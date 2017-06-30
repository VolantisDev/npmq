const chalk = require('chalk')
const yargonaut = require('yargonaut')
    .style('blue')
    .style('yellow', 'required')
    .helpStyle('cyan')
    .errorsStyle('red.bold')

const yargs = require('yargs')

module.exports = {
    args: args,
    command: command
}

function args(usage, commands) {
    yargs.usage(chalk.blue('Usage: $0 <command> [options]'))
    
    commands.forEach(command => {
        yargs.command(require('./commands/' + command)(yargs))
    })
    
    return yargs
}

function command (cmd) {
    return yargs.command(require('./commands/' + cmd)(yargs))
}
