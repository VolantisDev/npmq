const inquirer = require('inquirer')
const gitConfig = require('git-config')
const path = require('path')
const boxen = require('boxen')
const ora = require('ora')
const chalk = require('chalk')
const packageUtils = require('../package-utils')
const Conf = require('conf')
const config = new Conf()

module.exports = yargs => {
    return {
        command: 'preset [name]',
        aliases: ['c'],
        desc: 'Create or update a package preset',
        builder: argv => {
            yargs.option({
                'dependencies': {
                    alias: 'deps',
                    describe: 'A comma-separated list of dependencies'
                },
                'devDependencies': {
                    alias: 'dev',
                    describe: 'A coma-separated list of dev dependencies'
                },
                keywords: {
                    alias: 'k',
                    describe: 'A comma-separated list of keywords'
                },
                'delete': {
                    alias: 'd',
                    describe: 'Delete the provided preset'
                }
            })
        },
        handler: command
    }
}

function command (argv) {
    var operation = argv.delete ? 'deletion' : 'creation'
    console.log(chalk.blue.bold('\nStarting npmq package preset ' + operation + '\n'))

    if (!config.get('quiet', argv.quiet || false)) {
        console.log('Follow the prompts to continue.\n')
    }

    if (argv.delete) {
        return deletePrompt(argv).then(answers => deletePreset(argv, answers))
    } else {
        return createPrompt(argv).then(answers => createPreset(argv, answers))
    }
}

function createPrompt (argv, gitConfig) {
    var quiet = config.get('quiet', false)

    return inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Enter a name for the preset:',
            default: argv.name || path.basename(process.cwd()).replace(/^node-/, ""),
            when: !argv.name,
            validate: v => (/^[a-z0-9][a-z0-9-_.]{1,213}$/.test(v))
        },
        {
            type: 'list',
            name: 'license',
            message: 'Choose a license for the preset:',
            choices: ['Unlicense', 'ISC', 'MIT', 'BSD-2-Clause', 'BSD-3-Clause', 'None'],
            default: argv.license || config.get('defaults.license', 'Unlicense'),
            when: !argv.license  && !(config.get('defaults.license', null) && quiet)
        },
        {
            type: 'input',
            name: 'entry',
            message: 'Enter the entry point for the preset:',
            default: argv.entry || config.get('defaults.entry', 'index.js'),
            when: !argv.entry
        },
        {
            type: 'input',
            name: 'keywords',
            message: 'Enter any comma-separated keywords for the preset:',
            filter: v => v.split(',').map(k => k.trim()),
            default: argv.keywords ? argv.keywords : '',
            when: !argv.keywords
        },
        {
            type: 'input',
            name: 'dependencies',
            message: 'Enter a comma-separated list of dependencies for the preset:',
            filter: v => v.split(',').map(k => k.trim()),
            default: argv.dependencies ? argv.dependencies : '',
            when: !argv.dependencies
        },
        {
            type: 'input',
            name: 'devDependencies',
            message: 'Enter a comma-separated list of development dependencies for the preset:',
            filter: v => v.split(',').map(k => k.trim()),
            default: argv.devDependencies ? argv.devDependencies : '',
            when: !argv.devDependencies
        }
    ])
}

function deletePrompt (argv, gitConfig) {
    return inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Enter a name for the package:',
            default: argv.name || path.basename(process.cwd()).replace(/^node-/, ""),
            when: !argv.name,
            validate: v => (/^[a-z0-9][a-z0-9-_.]{1,213}$/.test(v))
        },
        {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you wish to delete the preset?',
            default: true
        }
    ])
}

function createPreset (argv, answers) {
    var name = argv.name || answers.name
    var actionPrefix = config.has('presets.' + name) ? 'Updat' : 'Creat'
    var spinner = ora(actionPrefix + 'ing preset ' + name)

    config.set('presets.' + name, {
        license: argv.license || answers.license,
        entry: argv.entry || answers.entry,
        keywords: argv.keywords ? argv.keywords.split(',').map(k => k.trim()) : answers.keywords,
        dependencies: argv.dependencies ? argv.dependencies.split(',').map(k => k.trim()) : answers.dependencies,
        devDependencies: argv.devDependencies ? argv.devDependencies.split(',').map(k => k.trim()) : answers.devDependencies
    })

    spinner.succeed(actionPrefix + 'ed preset ' + name)

    console.log(boxen(
        'You can select the ' + chalk.blue(name) + ' preset when running ' + chalk.cyan('npmq create') + '.\nYou can also use the ' + chalk.cyan('-p ' + name) + ' or ' + chalk.cyan('--preset=' + name) + ' option on the CLI.',
        { 
            padding: 1, 
            margin: 1, 
        }
    ))
}

function deletePreset (argv, answers) {
    if (!answers.confirm) {
        console.log(chalk.magenta('Not deleting any presets'))
    } else {
        const spinner = ora('Deleting preset ' + answers.name)
        if (config.has('presets.' + answers.name)) {
            config.delete('presets.' + answers.name)
            spinner.succeed('Deleted preset ' + answers.name)
        } else {
            spinner.succeed('Preset ' + answers.name + ' not set')
        }
    }
}
