"use strict";

// cmd
const { hideBin } = require('yargs/helpers');
const argv = yargs (hideBin (process.argv)).options ({
  amount: {
    requiresArg: true,
    description: 'The required amount of NKN to create a new node',
    demandOption: true,
    number: true,
    alias: 'a'
  },
  fee: {
    requiresArg: true,
    description: 'Pre-set transaction fee for the NKN funding transaction',
    demandOption: true,
    number: true,
    alias: 'f'
  },
  from: {
    requiresArg: true,
    description: 'Path to \'wallet.json\'-like file which holds and automatically distributes the initialization funds',
    demandOption: true,
    string: true
  },
  pswdfile: {
    requiresArg: true,
    description: 'Path to \'wallet.pswd\'-like file corresponding to the from option',
    demandOption: true,
    string: true,
    alias: 'p'
  },
  interval: {
    requiresArg: true,
    description: 'Interval (in seconds) to re-check for transaction hash in \'funding.txt\'',
    default: 300,
    number: true,
    alias: 'i'
  },
  to: {
    requiresArg: true,
    description: 'Path to a JSON file representing an object with an \'Address\' property',
    default: '/nkn/data/wallet.json',
    string: true,
    alias: 't'
  },
  directory: {
    requiresArg: true,
    description: 'Directory to check for \'funding.txt\'',
    default: '/nkn/data',
    string: true,
    alias: 'd'
  }
}).argv;


// main
const nkn = require ('nkn-sdk');

