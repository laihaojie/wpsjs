const fs = require('fs')
const fsEx = require('fs-extra')
const path = require('path')
const chalk = require('chalk');
const defaultsDeep = require('lodash.defaultsdeep')
var cp = require('child_process');
const jsUtil = require('./util.js')
let projectCfg = jsUtil.projectCfg()

function buildVue(options) {
	let projectOptions = {}
	projectOptions.outputDir = path.resolve(process.cwd(), "dist");
	cp.execSync("npm run build", { stdio: 'inherit' })
	return projectOptions.outputDir
}

function warn(message) {
	console.log(chalk.yellow(message))
}

function error(message) {
	console.log(chalk.red(message))
}

module.exports = (...args) => {
	try {
		return buildVue(...args)
	} catch(err) {
		error(err)
		if (!process.env.VUE_CLI_TEST) {
			process.exit(1)
		}
	}
}