const inquirer = require('inquirer')
const gitConfig = require('git-config')
const ora = require('ora')
const Conf = require('conf')
const config = new Conf()
const boxen = require('boxen')
const chalk = require('chalk')

module.exports = initCommand

function initCommand (argv) {
    console.log(chalk.blue.bold('\nStarting npmq configuration\n'))
    console.log('Follow the prompts to configure your npmq experience.\n')

    return initPrompt(argv, gitConfig.sync().user)
        .then(answers => {
            return init(argv, answers)
        })
}

function filterVersion (input) {
    var filtered = input.split('.');

    while (filtered.length < 3) {
        filtered.push('0');
    }

    return filtered
        .map(v => (v || '0'))
        .join('.');
}

function initPrompt (argv, gitValues) {
    var ghToken = argv.gitHubToken || config.get('gitHub.token', '')
    var ghAction = ghToken ? 'Update' : 'Enter'

    return inquirer.prompt([
        {
            type: 'confirm',
            name: 'enableGit',
            message: 'Enable management of local git repositories for packages',
            default: config.get('git.enable', true)
        },
        {
            type: 'confirm',
            name: 'enableGitHub',
            message: 'Enable management of remote GitHub repositories for packages',
            default: config.get('gitHub.enable', true),
            when: answers => answers.enableGit
        },
        {
            type: 'input',
            name: 'ghUsername',
            message: 'Enter your GitHub username (not email address)',
            default: config.get('gitHub.username', argv.ghUsername || ''),
            when: answers => answers.enableGit && answers.enableGitHub
        },
        {
            type: 'password',
            name: 'ghToken',
            message: ghAction + ' auth token for GitHub (https://github.com/settings/tokens/new)',
            when: answers => answers.enableGit && answers.enableGitHub && answers.ghUsername
        },
        {
            type: 'input',
            name: 'authorName',
            message: 'Enter a default author name',
            default: argv.authorName || config.get('authorName', gitValues.name || '')
        },
        {
            type: 'input',
            name: 'authorEmail',
            message: 'Enter a default author email address',
            default: argv.email || config.get('authorEmail', gitValues.email || '')
        },
        {
            type: 'input',
            name: 'startVersion',
            message: 'Enter a default version that packages should start at',
            default: argv.packageVersion || config.get('startVersion', '0.0.0'),
            validate: v => (/^[0-9]+(\.[0-9]+){0,2}$/.test(v)),
            filter: filterVersion
        },
        {
            type: 'list',
            name: 'defaultLicense',
            message: 'Choose a default license to use for packages',
            choices: ['Unlicense', 'ISC', 'MIT', 'BSD-2-Clause', 'BSD-3-Clause', 'None'],
            default: argv.license || config.get('defaults.license', 'Unlicense')
        },
        {
            type: 'input',
            name: 'defaultEntry',
            message: 'Enter a default entry point for packages',
            default: argv.entry || config.get('defaults.entry', 'index.js'),
            when: !argv.entry
        },
        {
            type: 'confirm',
            name: 'quiet',
            message: 'Always assume these defaults when running npmq and only prompt when necessary',
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
