#!/usr/bin/env node

// Notify if there are updates available
require('update-notifier')({ pkg: require('../package.json') }).notify()

// Process arguments and set up program
require('../lib/bootstrap')
