const Conf = require('conf')
const config = new Conf()
const boxen = require('boxen')
const Table = require('cli-table2')
const chalk = require('chalk')

module.exports = yargs => {
    return {
        command: 'presets',
        aliases: ['pr'],
        desc: 'View your current list of package presets',
        handler: command
    }
}

function command (argv) {
    console.log(chalk.blue.bold('\nListing npmq package presets\n'))
    
    return presets(argv)
}

function presets (argv) {
    var table = new Table({
        head: ['Name', 'Entry', 'Keywords', 'Dependencies', 'Dev Dependencies'],
        style: {
            head: ['cyan']
        },
        wordWrap: true
    })

    var presets = config.get('presets', {})
    var keys = Object.keys(presets)
    if (keys.length === 0) {
        table.push(['No presets defined', '', ''])
    } else {
        keys.forEach((name) => {
            var preset = presets[name]
            table.push([name, preset.entry, preset.keywords.join(chalk.dim(' ')), preset.dependencies.join(chalk.dim(' ')), preset.devDependencies.join(chalk.dim(' '))])
        })
    }
    
    console.log(table.toString())

    console.log(boxen(
        'You can select one of these presets by name when using npmq create.\nYou can also use the -p or --preset option on the CLI specifying a preset name.\n\nUse ' + chalk.blue('npmq preset') + ' to add or modify a preset.',
        { 
            padding: 1, 
            margin: 1
        }
    ))
}
