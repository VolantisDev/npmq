var inquirer = require('inquirer')
const gitConfig = require('git-config')
var path = require('path')
var boxen = require('boxen')
var chalk = require('chalk')
var Conf = require('conf')
var config = new Conf()

module.exports = createCommand

function createCommand (argv) {
    console.log(chalk.blue.bold('\nStarting npmq package creation\n'))

    if (!config.get('quiet', argv.quiet || false)) {
        console.log('Follow the prompts to configure your new package.\n')
    }

    if (!config.get('initialized', false)) {
        console.log(boxen(
            'You can save time by running "npmq init" to generate your global npmq configuration file.',
            { 
                padding: 1, 
                margin: 1, 
                float: 'center'
            }
        ))
    }

    var gitValues = gitConfig.sync()

    return createPrompt(argv, gitValues.user)
        .then(answers => {
            return create(argv, answers)
        })
}

function filterVersion (input) {
    var filtered = input.split('.');

    while (filtered.length < 3) {
        filtered.push('0');
    }

    return filtered.map(v => (v || '0')).join('.');
}

function createPrompt (argv, gitConfig) {
    var ghToken = argv.gitHubToken || config.get('gitHub.token', '')
    var ghAction = ghToken ? 'Override' : 'Enter'
    var quiet = config.get('quiet', false)

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
            type: 'input',
            name: 'version',
            message: 'Enter the starting version number:',
            default: argv.version || config.get('startVersion', '0.0.0'),
            when: !argv.version && !(config.get('startVersion', null) && quiet),
            validate: v => (/^[0-9]+(\.[0-9]+){0,2}$/.test(v)),
            filter: filterVersion
        },
        {
            type: 'input',
            name: 'description',
            message: 'Enter an optional short description:'
        },
        {
            type: 'input',
            name: 'authorName',
            message: 'Enter the author\'s name:',
            default: argv.authorName || config.get('authorName', gitConfig.name || ''),
            when: !argv.authorName && !(config.get('authorName', null) && quiet)
        },
        {
            type: 'input',
            name: 'authorEmail',
            message: 'Enter the author\'s email address:',
            default: argv.email || config.get('authorEmail', gitConfig.email || ''),
            when: !argv.email && !(config.get('authorEmail', null) && quiet)
        },
        {
            type: 'list',
            name: 'license',
            message: 'Choose a license for the package:',
            choices: ['Unlicense', 'ISC', 'MIT', 'BSD-2-Clause', 'BSD-3-Clause', 'None'],
            default: argv.license || config.get('defaults.license', 'Unlicense'),
            when: !argv.license  && !(config.get('defaults.license', null) && quiet)
        },
        {
            type: 'input',
            name: 'entry',
            message: 'Enter the entry point of the package:',
            default: argv.entry || config.get('defaults.entry', 'index.js'),
            when: !argv.entry && !(config.get('defaults.entry', null) && quiet)
        },
        {
            type: 'input',
            name: 'keywords',
            message: 'Enter any comma-separated keywords for the package:',
            when:  !quiet,
            filter: v => v.split(',').map(k => k.trim())
        },
        {
            type: 'confirm',
            name: 'enableGit',
            message: 'Manage local git repository?',
            default: config.get('git.enable', true),
            when: (config.get('git.enable', null) === null || !quiet)
        },
        {
            type: 'confirm',
            name: 'enableGitHub',
            message: 'Manage GitHub repository?',
            default: config.get('gitHub.enable', true),
            when: answers => answers.enableGit && (config.get('git.enable', null) !== null || !quiet)
        },
        {
            type: 'input',
            name: 'repoName',
            message: 'Enter a name for the GitHub repository:',
            default: argv.repoName || path.basename(process.cwd()),
            when: answers => !argv.repoName && realValue(argv, answers, 'enableGitHub', 'gitHub.enable', false),
            validate: v => (/^[a-z0-9][a-z0-9-_.]{1,213}$/.test(v))
        },
        {
            type: 'input',
            name: 'ghUsername',
            message: 'Enter your GitHub username (not email address):',
            default: config.get('gitHub.username', ''),
            when: answers => answers.enableGit && realValue(argv, answers, 'enableGitHub', 'gitHub.enable', false) && !(config.get('gitHub.username', null) && quiet)
        },
        {
            type: 'password',
            name: 'ghToken',
            message: ghAction + ' GitHub authentication token (https://github.com/settings/tokens):',
            default: ghToken,
            when: answers => answers.enableGit && realValue(argv, answers, 'enableGitHub', 'gitHub.enable', false) && answers.ghUsername && !(config.get('gitHub.password', null) && quiet)
        }
    ])
}

function realValue(argv, answers, answerKey, configKey, defaultValue) {
    var value = defaultValue

    if (typeof argv[answerKey] !== 'undefined') {
        value = argv[answerKey]
    } else if (typeof answers[answerKey] !== 'undefined') {
        value = answers[answerKey]
    } else {
        value = config.get(configKey, defaultValue)
    }

    return value
}

function create (argv, answers) {
    console.log(chalk.magenta('Oops! npmq doesn\'t quite do anything yet. Check back soon!'))
}
