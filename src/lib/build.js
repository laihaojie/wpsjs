const inquirer = require('inquirer')
const fs = require('fs')
const fsEx = require('fs-extra')
const path = require('path')
const _7z = require('node-7z');
const _7zBin = require('7zip-bin')
const jsUtil = require('./util.js')
let projectCfg = jsUtil.projectCfg()
const chalk = require('chalk');
const { serialize } = require('v8');

const buildDirectory = jsUtil.GetBuildDir()

async function build(cmd) {
    if (cmd.parent.rawArgs[cmd.parent.rawArgs.length - 1].includes("exe"))
    {
        if (false == new RegExp("^[!-~]+$").test(projectCfg.name)){
            console.log(`${chalk.red("项目名只能是字母、数字和下划线")}...`)
            return
	    }
        buildwithSelfArchive()
        return
    }
    inquirer.prompt({
        name: 'pluginType',
        type: 'list',
        message: `选择 WPS 加载项发布类型:`,
        choices: [{
                name: '在线插件',
                value: 'online'
            },
            {
                name: '离线插件',
                value: 'offline'
            }
        ]
    }).then(answers => {
        return buildWithArgs(answers)
    }).then(buildDir=>{
        console.log(chalk.cyan(`\n==>>  编译成功。请将目录${buildDir}下的文件署到服务器...`))
    })
}

async function buildWithArgs(answers) {
    return new Promise((r,j)=>{
        let debugTemp = jsUtil.GetDebugTempPath(true);
        fsEx.removeSync(debugTemp)
    
        let curDir = process.cwd()
        let buildDir = curDir
        if (projectCfg.scripts && typeof projectCfg.scripts.build == 'string') {
            let buildCmd = projectCfg.scripts.build.trim();
            if (buildCmd.includes("vite")) {
                buildDir = require('./buildvue')(answers)
            } else if (buildCmd.includes("react-scripts")) {
                buildDir = require('./buildreact')(answers)
            }
        }
        let publishRoot = path.resolve(curDir, jsUtil.GetPublishDir());
        fsEx.removeSync(publishRoot);
        let buildRoot = path.resolve(curDir, buildDirectory);
        let distPath = buildRoot
        if (answers.pluginType == "offline")
            distPath = path.resolve(buildRoot, `${projectCfg.name}_${projectCfg.version}`)
        fsEx.removeSync(buildRoot)
        fs.readdir(buildDir, (_, files) => {
            files.forEach(file => {
                if (file != buildDirectory && file != "node_modules" &&
                    file != ".vscode" && file != ".git" &&
                    file != "package.json" && file != "package-lock.json") {
                    const srcPath = path.resolve(buildDir, file)
                    fsEx.copySync(srcPath, path.resolve(distPath, file))
                }
            })
    
            if (answers.pluginType == "offline") {
                let path7z = path.resolve(buildRoot, `${projectCfg.name}.7z`)
                let inputPaths = [distPath]
                const stream7z = _7z.add(path7z, inputPaths, {
                    recursive: false,
                    $bin: _7zBin.path7za
                  });
                stream7z.on('end', ()=>{
                    fsEx.removeSync(distPath)
                })                
            }

            const buildResultDir = path.resolve(process.cwd(), buildDirectory)
            r(buildResultDir)
        })
    })
}

async function buildwithSelfArchive(){
    buildWithArgs('online').then(buildDir=>{
        let curDir = process.cwd()
        let buildRoot = path.resolve(curDir, 'dist')
        if (!projectCfg.scripts){
            fsEx.removeSync(buildRoot)
            fsEx.copySync(buildDir, buildRoot)
        }
       
        let exePath = path.resolve(buildDir, `${projectCfg.name}.exe`)
        createSelfExtractingExe(buildDir, buildRoot, exePath)
    })
}

async function createSelfExtractingExe(buildDir, inputFolder, outputFile) {
    const sfxPath = path.join(__dirname, 'res/7zsd.sfx');
  
    if (!fs.existsSync(sfxPath)) {
      console.error('7zsd.sfx not found. Please make sure it exists in the same folder as this script');
      return;
    }
  
    const configFileBuffer = createSfxConfig(outputFile);
    const zipBuffer = await create7ZipBuffer(buildDir, inputFolder);
  
    // 创建自解压 exe 文件
    const ws = fs.createWriteStream(outputFile);
    ws.write(fs.readFileSync(sfxPath));
    ws.write(configFileBuffer);

    let path7z = path.resolve(buildDir, `${projectCfg.name}.7z`)
    ws.write(fs.readFileSync(path7z));
    ws.end(()=>{fsEx.removeSync(path7z)});
  
    console.log('Self-extracting EXE created:', outputFile);
  }
  
  function createSfxConfig(outputFile) {
    return Buffer.from(`
  ;!@Install@!UTF-8!
  Title="install wps jsaddons"
  BeginPrompt="确定要安装${projectCfg.name}?"
  RunProgram="copy.bat"
  ;!@InstallEnd@!
    `, 'utf-8');
  }

  function CreateCopyBat() {
    return Buffer.from(`
@echo off
set source_folder=${projectCfg.name}_${projectCfg.version}
set destination_folder=%appdata%/kingsoft/wps/jsaddons

if not exist "%destination_folder%" (
    mkdir "%destination_folder%"
)

if not exist "%destination_folder%/%source_folder%" (
    mkdir "%destination_folder%/%source_folder%"
)

xcopy /E /I /Y "%source_folder%" "%destination_folder%/%source_folder%"
xcopy /E /I /Y "publish.xml" "%destination_folder%"
    `, 'utf-8');
  }

function CreatePublishXml(nameStr, typeStr, versionStr){
    return Buffer.from(`
        <jsplugins>
            <jsplugin name="${nameStr}" type="${typeStr}" url="${nameStr}_${versionStr}" version="${versionStr}" enable="enable_dev" install="null"/>
        </jsplugins>
          `);
}
  
  async function create7ZipBuffer(buildDir, inputFolder) {
    return new Promise((resolve, reject) => {
        let distDir = path.resolve(process.cwd(), 'dist')
        let tmp7zDir = path.resolve(buildDir, '7ztmpDir')
        let projDir = path.resolve(tmp7zDir, projectCfg.name + '_' + projectCfg.version)
        fsEx.ensureDirSync(tmp7zDir)
        fsEx.copy(distDir, projDir).then(()=>{
            new Promise(r=>{
                let batPath = path.resolve(tmp7zDir, "copy.bat")
                const ws = fs.createWriteStream(batPath)
                ws.write(CreateCopyBat())
                ws.end(()=>{r()})
            }).then(()=>{
                new Promise(r=>{
                    let publishXmlPath = path.resolve(tmp7zDir, "publish.xml")
                    const ws = fs.createWriteStream(publishXmlPath)
                    ws.write(CreatePublishXml(projectCfg.name, projectCfg.addonType, projectCfg.version))
                    ws.end(()=>{r()})
                })
            }).then(()=>{
                let path7z = path.resolve(buildDir, `${projectCfg.name}.7z`)
                let inputPaths = [path.resolve(tmp7zDir, "copy.bat"), path.resolve(tmp7zDir, "publish.xml"),  projDir]
                const stream7z = _7z.add(path7z, inputPaths, {
                    recursive: false,
                    $bin: _7zBin.path7za
                  });
                  stream7z.on('end', info=>{
                    fsEx.removeSync(tmp7zDir)
                    resolve()
                  }).on('error', err=>{
                    reject(err)
                  })
                })
            })
            
        })
  }

module.exports = {
    build,
    buildWithArgs
}