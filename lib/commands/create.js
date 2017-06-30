const inquirer = require('inquirer')
const gitConfig = require('git-config')
const path = require('path')
const boxen = require('boxen')
const chalk = require('chalk')
const packageUtils = require('../package-utils')
const Conf = require('conf')
const config = new Conf()

module.exports = yargs => {
    return {
        command: 'create [name]',
        aliases: ['c'],
        desc: 'Create a new package',
        builder: argv => {
            yargs.option({
                gitHubRepo: {
                    alias: 'g',
                    describe: 'The name of the GitHub repository'
                },
                packageVersion: {
                    alias: 'r',
                    describe: 'The starting version number'
                },
                preset: {
                    alias: 'p',
                    describe: 'Use a named preset when creating the package'
                },
                desc: {
                    alias: 'd',
                    describe: 'The package description'
                },
                authorName: {
                    alias: 'a',
                    describe: 'The author\'s name'
                },
                email: {
                    alias: 'e',
                    describe: 'The author\'s email'
                },
                license: {
                    alias: 'l',
                    describe: 'The project license'
                },
                entry: {
                    alias: 'n',
                    describe: 'The module entry point'
                },
                keywords: {
                    alias: 'k',
                    describe: 'A comma-separated list of keywords'
                },
                workingDir: {
                    alias: 'w',
                    describe: 'Force the use of the current directory even if not empty'
                },
                childDir: {
                    alias: 'c',
                    describe: 'Force the use of a child directory if current directory is empty'
                }
            })
        },
        handler: command
    }
}

function initTip () {
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
}

function command (argv) {
    console.log(chalk.blue.bold('\nStarting npmq package creation\n'))

    if (!config.get('quiet', argv.quiet || false)) {
        console.log('Follow the prompts to configure your new package.\n')
    }

    initTip()

    var gitValues = gitConfig.sync()

    return prompt(argv, gitValues.user)
        .then(answers => {
            return create(argv, answers)
        })
}

function prompt (argv, gitConfig) {
    var ghToken = argv.gitHubToken || config.get('gitHub.token', '')
    var ghAction = ghToken ? 'Override' : 'Enter'
    var quiet = config.get('quiet', false)

    var presets = config.get('presets', {})
    var presetsList = Object.keys(presets)
    presetsList.push('None')

    return inquirer.prompt([
        {
            type: 'list',
            name: 'preset',
            message: 'Choose a preset for this package:',
            choices: presetsList,
            default: argv.preset || config.get('defaults.preset', 'None'),
            when: presetsList.length > 1 && !argv.preset && !quiet
        }
    ])
        .then(presetAnswers => {
            var preset = {}
            if (presetAnswers.preset && presetAnswers.preset !== 'None') {
                preset = config.get('presets.' + presetAnswers.preset)
            }

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
                    filter: packageUtils.filterVersion
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
                    default: argv.license || preset.license || config.get('defaults.license', 'Unlicense'),
                    when: !argv.license  && !(config.get('defaults.license', null) && quiet)
                },
                {
                    type: 'input',
                    name: 'entry',
                    message: 'Enter the entry point of the package:',
                    default: argv.entry || preset.entry || config.get('defaults.entry', 'index.js'),
                    when: !argv.entry && !(config.get('defaults.entry', null) && quiet)
                },
                {
                    type: 'input',
                    name: 'keywords',
                    message: 'Enter any comma-separated keywords for the package:',
                    filter: v => v.split(',').map(k => k.trim()),
                    default: argv.keywords ? argv.keywords : (preset.keywords.join(',') || ''),
                    when:  !argv.keywords && !quiet
                },
                {
                    type: 'input',
                    name: 'dependencies',
                    message: 'Enter a comma-separated list of dependencies for the package:',
                    filter: v => v.split(',').map(k => k.trim()),
                    default: argv.dependencies ? argv.dependencies : (preset.dependencies.join(',') || ''),
                    when: !argv.dependencies
                },
                {
                    type: 'input',
                    name: 'devDependencies',
                    message: 'Enter a comma-separated list of development dependencies for the package:',
                    filter: v => v.split(',').map(k => k.trim()),
                    default: argv.devDependencies ? argv.devDependencies : (preset.devDependencies.join(',') || ''),
                    when: !argv.dependencies
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
                    name: 'gitHubRepo',
                    message: 'Enter a name for the GitHub repository:',
                    default: argv.gitHubRepo || path.basename(process.cwd()),
                    when: answers => !argv.gitHubRepo && realValue(argv, answers, 'enableGitHub', 'gitHub.enable', false),
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
                    when: answers => answers.enableGit && realValue(argv, answers, 'enableGitHub', 'gitHub.enable', false) && answers.ghUsername && !(config.get('gitHub.token', null) && quiet)
                }
            ])
        })
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
    var dir = process.cwd()

    if ((!argv.workingDir || argv.childDir) || fs.readdirSync(dir).length > 0) {
        var dirName = argv.gitHubRepo || answers.gitHubRepo || argv.name || answers.name
        console.log('Creating a new subdirectory named ' + dirname + ' for the package')
        dir = path.resolve(process.cwd(), dirName)
    } else {
        console.log('Using the current working directory for the package')
    }

    
}
