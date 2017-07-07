const Conf = require('conf')
const config = new Conf()
const chalk = require('chalk')
const GistConfig = require('../../../node-gist-config')

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
                    describe: 'The operation to perform (sync, upload, download, reset)'
                }
            })
        },
        handler: command
    }
}

function command (argv) {
    var quiet = argv.quiet || config.get('quiet', false)
    var operation = argv.operation || 'sync'

    const gistConfig = GistConfig({
        token: config.get('gitHub.token'),
        interactive: !quiet
    })
    
    return executeCommand(operation, gistConfig)
        .then((data) => {
            config.set('gistConfig', gistConfig.config.get())
            return data
        })
}

function executeCommand (operation, gistConfig) {
    if (operation === 'reset') {
        console.log(chalk.blue.bold('\nResetting npmq configuration synchronization settings'))
        return gistConfig.reset()
    } else if (operation === 'sync') {
        console.log(chalk.blue.bold('\nStarting npmq configuration synchronization\n'))
        return gistConfig.sync(config.get())
            .then(cfg => {
                console.log(cfg)
                return cfg
            })
    } else if (operation === 'download') {
        console.log(chalk.blue.bold('\nStarting npmq configuration download\n'))
        return gistConfig.download(config.get())
            .then(cfg => { 
                console.log(cfg)
                return cfg
             })
            .then(cfg => { config.set(cfg) })
    } else if (operation === 'upload') {
        console.log(chalk.blue.bold('\nStarting npmq configuration upload\n'))
        return gistConfig.upload(config.get())
    }
}
