const cli = require('./cli-utils')

const globalOptions = {
    version: {
        alias: 'v',
        describe: 'Show installed npmq version'
    },
    quiet: {
        alias: 'q',
        describe: 'Assume default values and only prompt if necessary'
    }
}

cli.args('Usage: $0 <command> [options]', ['configure', 'create', 'presets', 'preset', 'sync'])
    .options(globalOptions)
    .demandCommand()
    .help('help')
    .alias('help', 'h')
    .epilogue('For more information, check out https://github.com/bmcclure/node-npmq/')
    .argv
