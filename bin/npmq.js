#!/usr/bin/env node

const pkg = require('../package.json')
const yargonaut = require('yargonaut')
const yargs = require('yargs')
const updateNotifier = require('update-notifier')

// Notify if there are updates available
updateNotifier({ pkg }).notify()

// Process arguments
yargonaut
    .style('blue')
    .style('yellow', 'required')
    .helpStyle('cyan')
    .errorsStyle('red.bold')

yargs
    .usage('Usage: $0 <command> [options]')
    .command({
        command: 'config',
        aliases: ['init'],
        desc: 'Initialize or update npmq configuration file',
        handler: require('../lib/init')
    })
    .command({
        command: 'create [name]',
        aliases: ['c', '*'],
        desc: 'Create a new package',
        builder: argv => {
            yargs.option({
                'repo-name': {
                    alias: 'r',
                    describe: 'The name of the GitHub repository'
                },
                'package-version': {
                    alias: 'p',
                    describe: 'The starting version number'
                },
                'desc': {
                    alias: 'd',
                    describe: 'The package description'
                },
                'author-name': {
                    alias: 'a',
                    describe: 'The author\'s name'
                },
                'email': {
                    alias: 'e',
                    describe: 'The author\'s email'
                },
                'license': {
                    alias: 'l',
                    describe: 'The project license'
                },
                'entry': {
                    alias: 'n',
                    describe: 'The module entry point'
                }
            })
        },
        handler: require('../lib/create')
    })
    .options({
        version: {
            alias: 'v',
            describe: 'Show installed npmq version'
        },
        quiet: {
            alias: 'q',
            describe: 'Assume default values and only prompt if necessary'
        }
    })
    .demandCommand()
    .help('help')
    .alias('help', 'h')
    .epilogue('For more information, check out https://github.com/bmcclure/node-npmq/')
    .argv
