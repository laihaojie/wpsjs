const cp = require('child_process');
const express = require('express');
const ini = require('ini')
const os = require('os');
const xml2js = require("xml2js");
const fs = require('fs')
const fsEx = require('fs-extra')
const path = require('path')
const http = require("http")
const jsUtil = require('./util.js')
const rcWatch = require('recursive-watch')
const sudo = require('sudo-js');
const inquirer = require('inquirer')
const chalk = require('chalk');
const { setTimeout } = require('timers/promises');

let projectCfg = jsUtil.projectCfg()
let remoteDebuggingPort = -1
let bSuRoot = false

var serverHost
var serverPort
function debug(arg){
    GetWebSiteInfo(arg).then(arg => {
        serverHost = arg[0]
        serverPort = arg[1]
        return configPublish(serverHost, serverPort)
    }).then((serverPort)=>{
        return startServer(serverPort)
    }).then(()=>{
        return checkServer()
    }).then(()=>{
            //startWpsReady()
            startWps()
    }).finally(err=>{
        //console.log(chalk.red('启动server失败'))
    })
}

async function startServer(serverPort){
    let bSuccess = await debugVue('serve', serverPort)
    if (bSuccess)
        return new Promise(r=>r())
    bSuccess = await debugVue('dev', serverPort)
    if (bSuccess)
        return new Promise(r=>r())
    bSuccess = await debugReact('start', serverPort)
    if (bSuccess)
        return new Promise(r=>r())
    bSuccess = await debugReact('dev', serverPort)
    if (bSuccess)
        return new Promise(r=>r())

    startNormalServer(serverPort)
    return new Promise((r, j)=>r())
}

function startNormalServer(serverPort){
    //如果不是使用的vue/react, 直接启动server
    const app = express()
    const clients = []
        
    let rootPath = process.cwd()
    app.all('*', function (req, response, next) {
        if (req.originalUrl.endsWith(".html") || req.originalUrl.endsWith(".htm")) {
            let filePath = rootPath + req.originalUrl
            var htmlData = fsEx.readFileSync(filePath)
            let pos = htmlData.indexOf("<body")
            if (pos == -1)
                pos = htmlData.indexOf("<script")
            if (pos == -1) {
                pos = htmlData.indexOf("<html>")
                pos += 6
            }
            htmlData = htmlData.slice(0, pos) + `<script type="text/javascript" src="./hot-update-inject.js"></script>` + htmlData.slice(pos)
            response.writeHead(200, "OK", { "Content-Type": "text/html" })
            response.end(htmlData)
        } else if (req.originalUrl.endsWith("/hot-update-inject.js")) {
            response.writeHead(200, "OK", { "Content-Type": "application/javascript; charset=utf-8" })
            const inject =
                `function handleMessage(event) {
                    var res = JSON.parse(event.data)
                    if (res.update)
                        window.location.reload()
                }

                function handleOnline(event) {
                }

                function handleDisconnect(event) {
                    source.close();;
                }

                var source = new window.EventSource('${serverHost}/hot-update/${Math.random()}');
                source.onopen = handleOnline;
                source.onerror = handleDisconnect;
                source.onmessage = handleMessage;`
            response.end(inject)
        } else {
            next();
        }
    });
    app.use(express.static(rootPath))
    app.use("/publish.xml", function (request, response) {
        response.writeHead(200, "OK", { "Content-Type": "text/xml" })
        response.end("")
    });
    app.use("/hot-update/:id", function (request, response) {
        response.writeHead(200, "OK", { 'Connection': 'keep-alive', "Content-Type": "text/event-stream", 'Cache-Control': 'no-cache' })
        clients.push(response)
    });

    var server = app.listen(serverPort, function () {
        console.log(jsUtil.getNow() + `启动本地web服务(${serverHost})成功！`)
        let lastTime = new Date()
        rcWatch(rootPath, () => {
            let nowTime = new Date()
            if (nowTime.getTime() - lastTime.getTime() > 300) {
                lastTime = nowTime;
                let res = { update: true }
                clients.forEach(response => {
                    response.write(`data:${JSON.stringify(res)}\n\n`)
                });
            }
        })
    });

    server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            console.log('地址正被使用，重试中...');
            setTimeout(() => {
                server.close();
                server.listen(serverPort);
            }, 2000);
        }
    });
}

async function debugVue(tag, serverPort) {
    const wpsjsConfig = await jsUtil.wpsjsConfig()
    if(wpsjsConfig.script){
        jsUtil.SpawnNpm(wpsjsConfig.script)
        return true
    }
	if (projectCfg.scripts && typeof projectCfg.scripts[tag] == 'string') {
		let devCmd = projectCfg.scripts[tag].trim()
		if (devCmd.startsWith("vite")) {
			projectCfg.scripts[tag] = `vite --port ${serverPort}`
			cfgData = JSON.stringify(projectCfg, "", "\t")
			// fsEx.writeFileSync('package.json', cfgData)

            jsUtil.SpawnNpm(tag)
			return true
		}
	}
	return false
}

async function debugReact(tag, serverPort) {
    const wpsjsConfig = await jsUtil.wpsjsConfig()
    if(wpsjsConfig.script){
        jsUtil.SpawnNpm(wpsjsConfig.script)
        return true
    }
	if (projectCfg.scripts && typeof projectCfg.scripts[tag] == 'string') {
		let devCmd = projectCfg.scripts[tag].trim()
		if (devCmd.includes("react-scripts")) {
			if (os.platform() == 'win32')
				projectCfg.scripts[tag] = `set PORT=${serverPort} && react-scripts start`
			else
				projectCfg.scripts[tag] = `export PORT=${serverPort} react-scripts start`
			cfgData = JSON.stringify(projectCfg, "", "\t")
			// fsEx.writeFileSync('package.json', cfgData)

			jsUtil.SpawnNpm(tag)
			return true
		}
	}
	return false
}

async function checkServer() {
    const testServer = ()=>{
        return new Promise((resolve, reject) => {
          http.get(`${serverHost}/index.html`, (res) => {
              resolve()
          }).on('error', (e) => {
             reject()
          })
        });
    }
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
        const attempt = () => {
            testServer().then(()=>{
                resolve()
            }).catch((err) => {
                const elapsedTime = (Date.now() - startTime);
                if(elapsedTime > 1000 * 8) {
                    reject()
                } else {
                    attempt()
                }
            })
        }
        attempt()
    })
}

function startWps(){
    const GetExePath = (callback)=>{
        if (os.platform() == 'win32') {
            let type = "KET.Sheet.12"
            if (projectCfg.addonType == "wps")
                type = "KWPS.Document.12"
            else if (projectCfg.addonType == "wpp")
                type = "KWPP.Presentation.12"
            cp.exec(`REG QUERY HKEY_CLASSES_ROOT\\${type}\\shell\\new\\command /ve`, function (error, stdout, stderr) {
                var strList = stdout.split("    ")
                var val = strList.length > 2 ? strList[3] : undefined;
                if (typeof (val) == "undefined" || val == null) {
                    throw new Error("WPS未安装，请安装WPS 2019 最新版本。")
                }
                var pos = val.indexOf(".exe");
                if (pos < 0) {
                    throw new Error("wps安装异常，请确认有没有正确的安装 WPS 2019最新版本！")
                }
                val = val.trim()
                if (!val.endsWith("\"%1\"")) {
                    console.log("获取 WPS 启动路径异常，继续尝试启动")
                }
                let cmdString = val.replace("\"%1\"", "")
                let cmds = cmdString.split("\"")
                let exePath = cmds[0] ? cmds[0] : cmds[1]
                let rawArgs = []
                if (cmds.length == 1) {
                    let data = cmds[0].split(" ")
                    exePath = data[0]
                    rawArgs = data.splice(1)
                } else if (cmds.length > 1) {
                    let idx = cmds[0] ? 1 : 2;
                    if (cmds[idx]) {
                        rawArgs = cmds[idx].split(" ")
                    }
                }
                let args = []
                rawArgs.forEach(function (item) {
                    if (item) args.push(item)
                })
                callback(exePath, args)
            });
        } else {
            let exePath = `/opt/kingsoft/wps-office/office6/${projectCfg.addonType}`
            if (!fsEx.existsSync(exePath))
                exePath = `/opt/apps/cn.wps.wps-office-pro/files/kingsoft/wps-office/office6/${projectCfg.addonType}`
            callback(exePath, [])
        }
    }
    GetExePath((cmd, args) => {
		//cmd = "f:\\work\\one\\debug\\WPSOffice\\office6\\wps.exe /prometheus /wps /t"
        console.log(chalk.green(`启动WPS：${cmd} ${args.join("  -  ")}`))
		if (remoteDebuggingPort != -1) {
			cmd += " " + `/JsApiremotedebuggingPort=${remoteDebuggingPort}`
			let userDataDir = path.join(os.tmpdir(), `wpsjs-userdatadir_${remoteDebuggingPort}`)
			cmd += " " + `/JsApiUserDataDir=${userDataDir}`
		}
		if (os.platform() == 'win32') {
			cp.spawn(cmd, args, { detached: true, stdio: ['ignore'] })
		} else {
			cp.spawn(cmd, { detached: true, stdio: ['ignore'] })
		}
	})
}

function startWpsReady() {
    const StartWpsReadyInner = ()=>{
        let handShake = jsUtil.GetHandShake();
        fsEx.writeFileSync(handShake, process.cwd())

        let demoName = 'systemdemo.html'
        let systemDemoPath = path.resolve(__dirname, 'res', demoName)
        var demoData = fs.readFileSync(systemDemoPath)
        let htmlDemo = path.resolve(jsUtil.GetDebugTempPath(), demoName);
        fsEx.writeFileSync(htmlDemo, demoData)

        let sdkName = 'wpsjsrpcsdk.js'
        let systemDemoJs = path.resolve(__dirname, '../../node_modules/wpsjs-rpc-sdk-new', sdkName)
        var sdkData = fs.readFileSync(systemDemoJs)
        let sdkDemo = path.resolve(jsUtil.GetDebugTempPath(), sdkName);
        fsEx.writeFileSync(sdkDemo, sdkData)

        let infoDemo = path.resolve(jsUtil.GetDebugTempPath(), 'project.js');
        fsEx.writeFileSync(infoDemo, `var projInfo = {"name":"${projectCfg.name}","type":"${projectCfg.addonType}"}`)

        let urlDemo = path.resolve(jsUtil.GetDebugTempPath(), 'NotifyDemoUrl');
        fsEx.writeFileSync(urlDemo, `${serverHost}/${jsUtil.GetDebugTempName()}/${demoName}`)

        if (projectCfg.addonType == "wps") {
            let wpsfileName = 'wpsDemo.docx'
            let wpsfilePath = path.resolve(__dirname, 'res', wpsfileName)
            var wpsfileData = fs.readFileSync(wpsfilePath)
            let wpsfileDst = path.resolve(jsUtil.GetDebugTempPath(), wpsfileName);
            fsEx.writeFileSync(wpsfileDst, wpsfileData)
        } else if (projectCfg.addonType == "wpp") {
            let wppfileName = 'wppDemo.pptx'
            let wppfilePath = path.resolve(__dirname, 'res', wppfileName)
            var wppfileData = fs.readFileSync(wppfilePath)
            let wppfileDst = path.resolve(jsUtil.GetDebugTempPath(), wppfileName);
            fsEx.writeFileSync(wppfileDst, wppfileData)
        } else if (projectCfg.addonType == "et") {
            let etfileName = 'etDemo.xlsx'
            let etfilePath = path.resolve(__dirname, 'res', etfileName)
            var etfileData = fs.readFileSync(etfilePath)
            let etfileDst = path.resolve(jsUtil.GetDebugTempPath(), etfileName);
            fsEx.writeFileSync(etfileDst, etfileData)
        }
    }

	if (os.platform() == 'win32') {
		StartWpsReadyInner()
	} else {
		try {
			StartWpsReadyInner()
		} catch (e) {
			if (os.platform() == 'win32') {
				console.log(e)
			} else {
				suRoot(3, (res) => {
					if (res) {
						let directPath = GetPublistXmlPath();
						directPath = path.resolve(directPath, '..')
						sudo.exec(['chmod', 'a+rw', directPath], (err, pid, result) => {
							StartWpsReadyInner()
						})
					}
				})
			}
		}
	}
}

async function GetWebSiteInfo(arg){
    return new Promise((r,j)=>{
        jsUtil.GetWebSiteHost(arg.port, (host, port)=>{
            if (arg.port && arg.port != port){
                console.log(chalk.red(`服务启动失败，端口（${port}）被占用`))
                j()
                return
            }
            r([host, port])
        })
    })
}

async function configPublish(serverHost, port){
    const getXmlStr = ()=>{
        let resultStr = '<jsplugins></jsplugins>'
        if (fsEx.existsSync(GetPublistXmlPath())){
            resultStr = fsEx.readFileSync(GetPublistXmlPath()).toString()
        }

        return resultStr
    }
    
    let parseResult = await xml2js.parseStringPromise(getXmlStr())
    if (parseResult && parseResult.jsplugins === ''){
        parseResult.jsplugins = {}
    }
    var publishXml =""
    const onlinePlugin = {$:{
        name:projectCfg.name,
        type:projectCfg.addonType ? projectCfg.addonType : "wps",
        url:`${serverHost}/`,
        debug:'',
        enable:'enable_dev',
        install:'null'
    }}
    if (parseResult.jsplugins.jspluginonline){
        let bFind = false
        for (let idx = parseResult.jsplugins.jspluginonline.length - 1; idx >= 0; --idx){
            if (parseResult.jsplugins.jspluginonline[idx].$.name == onlinePlugin.$.name){
                parseResult.jsplugins.jspluginonline[idx] = onlinePlugin
                bFind = true
                continue
            } else if (parseResult.jsplugins.jspluginonline[idx].$.url == onlinePlugin.$.url){
                delete parseResult.jsplugins.jspluginonline[idx]
            }
        }
        if (!bFind){
            parseResult.jsplugins.jspluginonline.push(onlinePlugin)
        }
    }else{
        parseResult.jsplugins.jspluginonline = [].concat(onlinePlugin)
    }

    publishXml = new xml2js.Builder().buildObject(parseResult)
    let xmlString = publishXml.toString({ pretty: true })
    const publishXmlPath = GetPublistXmlPath()
    return new Promise((r, j)=>{
        fsEx.ensureDirSync(path.dirname(publishXmlPath))
        fs.writeFile(publishXmlPath, xmlString, ()=>{
            r(port);
        })
    })
}

function GetPublistXmlPath(){
    let directPath = ""
	if (os.platform() == 'win32') {
		directPath = path.resolve(process.env.APPDATA, 'kingsoft/wps/jsaddons/publish.xml')
	} else {
		directPath = path.resolve(process.env.HOME, ".local/share/Kingsoft/wps/jsaddons/publish.xml")
	}
	return directPath
}

module.exports = {
    debug
}