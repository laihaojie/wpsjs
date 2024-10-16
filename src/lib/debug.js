var cp = require('child_process');
const express = require('express');
var ini = require('ini')
const os = require('os');
const fs = require('fs')
const fsEx = require('fs-extra')
const path = require('path')
const http = require("http")
const jsUtil = require('./util.js')
const rcWatch = require('recursive-watch')
const sudo = require('sudo-js');
const inquirer = require('inquirer')
const chalk = require('chalk')


async function debug(...options) {
	const xmlDebug = require('./debug_xmlplugin')
	const publishDebug = require('./debug_publish')
	needPublishDebug().then(b=>{
		return b ? publishDebug.debug(...options) : xmlDebug(...options)
	})
}

async function needPublishDebug(){
	var bPersonal = false;
	var versionCfgpath;
	if (os.platform() == 'win32') {
		return new Promise((r,j)=>{
			cp.exec("REG QUERY HKEY_CLASSES_ROOT\\KWPS.Document.12\\shell\\open\\command /ve", function (error, stdout, stderr) {
				var val = undefined;
				try {
					val = stdout.split("    ")[3].split('"')[1];
				} catch (err) {
					throw new Error("WPS未安装，请安装WPS 2019 最新版本。")
				}
				if (typeof (val) == "undefined" || val == null) {
					throw new Error("WPS未安装，请安装WPS 2019 最新版本。")
				}
				var pos = val.indexOf("wps.exe");
				if (pos < 0)
					pos = val.indexOf("wpsoffice.exe");
				if (pos < 0) {
					console.log(val)
					throw new Error("wps安装异常，请确认有没有正确的安装WPS 2019 最新版本！")
				}
				let versionCfgpath = val.substring(0, pos) + "cfgs/setup.cfg";
				r(versionCfgpath)
			});
		}).then(r=>{
			versionCfgpath = r
			if (!fsEx.existsSync(versionCfgpath))
				return false;
			var config = ini.parse(fs.readFileSync(versionCfgpath, 'utf-8'))
			var firstVer = config.Version.FirstVersion;
			var version = config.Version.Version;
			if (firstVer == '1' && version >= '16910')
				return true;
			if (firstVer == '9')
				return true;

			const projCfg = jsUtil.projectCfg()
			const scriptDev = projCfg.scripts.dev
			if (!scriptDev)
				return false
			const bVue3 = scriptDev.includes("vite")
			return bVue3;
		})
	} 

	return true;
}

module.exports = (...args) => {
	return debug(...args).catch(err => {
		console.error(err)
		if (!process.env.VUE_CLI_TEST) {
			process.exit(1)
		}
	})
}