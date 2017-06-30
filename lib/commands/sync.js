const inquirer = require('inquirer')
const gitConfig = require('git-config')
const ora = require('ora')
const Conf = require('conf')
const config = new Conf()
const boxen = require('boxen')
const chalk = require('chalk')
const packageUtils = require('../package-utils')
const Table = require('cli-table2')
const SimpleGistClient = require('simple-gist-client')

module.exports = yargs => {
    return {
        command: 'synchronize',
        aliases: ['sync'],
        desc: 'Sync your npmq configuration with a private gist in the cloud',
        builder: argv => {
            yargs.option({
                token: {
                    alias: 't',
                    describe: 'A token for your GitHub account'
                },
                gist: {
                    alias: 'g',
                    describe: 'The gist id to sync (optional)'
                },
                operation: {
                    alias: 'o',
                    describe: 'The operation to perform (sync, upload, download)'
                }
            })
        },
        handler: command
    }
}

function command (argv) {
    console.log(chalk.blue.bold('\nStarting npmq configuration synchronization\n'))

    return prompt(argv)
        .then(answers => {
            return operation(argv, answers)
        })
}

function prompt (argv) {
    return inquirer.prompt([
        {
            type: 'password',
            name: 'ghToken',
            message: 'Enter auth token for GitHub (https://github.com/settings/tokens/new):',
            when: !argv.gitHubToken || config.get('gitHub.token', '')
        },
        {
            type: 'input',
            name: 'gistId',
            message: 'Enter the gist ID to synchronize (blank to generate):',
            default: argv.entry || config.get('defaults.entry', 'index.js'),
            when: !argv.entry
        },
        {
            type: 'list',
            name: 'operation',
            message: 'Choose an operation to perform:',
            choices: ['sync', 'upload', 'download', 'cancel'],
            default: argv.operation || 'sync'
        }
    ])
}

function operation (argv, answers) {
    var op = argv.operation || answers.operation

    if (op === 'cancel') {
        console.log(chalk.yellow('Canceled sync operation'))
    } else {
        operations[op]({
            token: argv.gitHubToken || answers.ghToken || config.get('gitHub.token', ''),
            gist: argv.gist || answers.gistId || config.get('sync.gistId', ''),
            synced: config.get('sync.synced', 0)
        })
    }
}

const operations = {
    sync: sync,
    upload: upload,
    download: download
}

function getGistId(syncConfig) {
    
}

function sync (syncConfig) {
    const client = new SimpleGistClient({ token: syncConfig.token });

}

function upload (syncConfig) {

}

function download (syncConfig) {

}
