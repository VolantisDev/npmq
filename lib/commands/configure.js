const inquirer = require('inquirer')
const gitConfig = require('git-config')
const ora = require('ora')
const Conf = require('conf')
const config = new Conf()
const boxen = require('boxen')
const chalk = require('chalk')
const packageUtils = require('../package-utils')
const Table = require('cli-table2')

module.exports = yargs => {
    return {
        command: 'configure',
        aliases: ['config', 'init'],
        desc: 'Initialize or update npmq configuration file',
        builder: argv => {
            yargs.option({
                list: {
                    alias: 'l',
                    describe: 'Lists the current config instead of modifying it'
                }
            })
        },
        handler: command
    }
}

function command (argv) {
    if (argv.list) {
        console.log(chalk.blue.bold('\nListing current npmq configuration\n'))
        return listConfig(argv)
    } else {
        console.log(chalk.blue.bold('\nStarting npmq configuration\n'))
        console.log('Follow the prompts to configure your npmq experience.\n')

        return prompt(argv, gitConfig.sync().user)
            .then(answers => {
                return init(argv, answers)
            })
    }

    
}

function prompt (argv, gitValues) {
    var ghToken = argv.gitHubToken || config.get('gitHub.token', '')
    var ghAction = ghToken ? 'Update' : 'Enter'

    return inquirer.prompt([
        {
            type: 'confirm',
            name: 'enableGit',
            message: 'Enable management of local git repositories for packages?',
            default: config.get('git.enable', true)
        },
        {
            type: 'confirm',
            name: 'enableGitHub',
            message: 'Enable management of remote GitHub repositories for packages?',
            default: config.get('gitHub.enable', true),
            when: answers => answers.enableGit
        },
        {
            type: 'input',
            name: 'ghUsername',
            message: 'Enter your GitHub username (not email address):',
            default: config.get('gitHub.username', argv.ghUsername || ''),
            when: answers => answers.enableGit && answers.enableGitHub
        },
        {
            type: 'password',
            name: 'ghToken',
            message: ghAction + ' auth token for GitHub (https://github.com/settings/tokens/new):',
            when: answers => answers.enableGit && answers.enableGitHub && answers.ghUsername
        },
        {
            type: 'input',
            name: 'authorName',
            message: 'Enter a default author name:',
            default: argv.authorName || config.get('authorName', gitValues.name || '')
        },
        {
            type: 'input',
            name: 'authorEmail',
            message: 'Enter a default author email address:',
            default: argv.email || config.get('authorEmail', gitValues.email || '')
        },
        {
            type: 'input',
            name: 'startVersion',
            message: 'Enter a default version that packages should start at:',
            default: argv.packageVersion || config.get('startVersion', '0.0.0'),
            validate: v => (/^[0-9]+(\.[0-9]+){0,2}$/.test(v)),
            filter: packageUtils.filterVersion
        },
        {
            type: 'list',
            name: 'defaultLicense',
            message: 'Choose a default license to use for packages:',
            choices: ['Unlicense', 'ISC', 'MIT', 'BSD-2-Clause', 'BSD-3-Clause', 'None'],
            default: argv.license || config.get('defaults.license', 'Unlicense')
        },
        {
            type: 'input',
            name: 'defaultEntry',
            message: 'Enter a default entry point for packages:',
            default: argv.entry || config.get('defaults.entry', 'index.js'),
            when: !argv.entry
        },
        {
            type: 'confirm',
            name: 'quiet',
            message: 'Always assume these defaults when running npmq and only prompt when necessary?',
            default: argv.quiet || config.get('quiet', false)
        }
    ])
}

function init (argv, answers) {
    var spinner = ora('Saving npmq configuration').start()

    config.set('git.enable', answers.enableGit)
    config.set('gitHub.enable', answers.enableGitHub)
    config.set('gitHub.username', answers.ghUsername)
    if (answers.ghToken) {
        config.set('gitHub.token', answers.ghToken)
    }
    config.set('authorName', answers.authorName)
    config.set('authorEmail', answers.authorEmail)
    config.set('startVersion', answers.startVersion)
    config.set('defaults.license', answers.defaultLicense)
    config.set('defaults.entry', answers.defaultEntry)
    config.set('quiet', answers.quiet)
    config.set('initialized', true)
    config.set('saved', + new Date())

    spinner.succeed('Saved npmq configuration file')

    console.log(boxen(
        chalk.green('Your npmq configuration has been saved!') + '\n\nYou can re-run ' + chalk.cyan('npmq config') + ' anytime to modify your saved configuration.',
        { 
            padding: 1, 
            margin: 1, 
            float: 'center'
        }
    ))
}

function listConfig (argv) {
    if (!config.get('initialized', false)) {
        console.log(boxen(
            chalk.yellow('You do not have any configuration set.') + '\n\nYou can run ' + chalk.blue('npmq config') + ' without the -l flag to create your configuration.',
            { 
                padding: 1, 
                margin: 1
            }
        ))
        return
    }

    var table

    table = new Table({
        head: ['General'],
        style: { head: ['cyan'] },
        wordWrap: true
    })
    table.push(['Author name', config.get('authorName', 'Not set')])
    table.push(['Author email', config.get('authorEmail', 'Not set')])
    table.push(['Starting version', config.get('startVersion', 'Not set')])
    table.push(['Quiet operation', config.get('quiet', 'Not set')])
    console.log(table.toString() + '\n')

    table = new Table({
        head: ['Package defaults'],
        style: { head: ['cyan'] },
        wordWrap: true
    })
    table.push(['Default license', config.get('defaults.license', 'Not set')])
    table.push(['Default entry', config.get('defaults.entry', 'Not set')])
    console.log(table.toString() + '\n')

    table = new Table({
        head: ['Git'],
        style: { head: ['cyan'] },
        wordWrap: true
    })
    table.push(['Enabled', config.has('git.enable') ? config.get('git.enable') : 'Not set'])
    console.log(table.toString() + '\n')

    table = new Table({
        head: ['GitHub'],
        style: { head: ['cyan'] },
        wordWrap: true
    })
    table.push(['Enabled', config.get('gitHub.enable', chalk.yellow('Not set'))])
    table.push(['Username', config.get('gitHub.username', chalk.yellow('Not set'))])
    table.push(['Token', config.get('gitHub.token', '') ? chalk.dim('[Hidden]') : chalk.yellow('Not set')])
    console.log(table.toString() + '\n')

    table = new Table({
        head: ['Presets'],
        style: { head: ['cyan'] },
        wordWrap: true
    })
    var presets = Object.keys(config.get('presets', {}))
    table.push([presets.length > 0 ? presets.join(chalk.dim(', ')) : chalk.yellow('None')])
    console.log(table.toString() + '\n')

    console.log(boxen(
        'Run ' + chalk.blue('npmq config') + ' without the -l flag to modify the above settings.\n\nRun ' + chalk.blue('npmq presets') + ' to see the details of your presets.',
        { 
            padding: 1, 
            margin: 1
        }
    ))
}