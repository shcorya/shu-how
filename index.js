"use strict";

const FILENAME = 'funding.txt';

/*-----\
| args |
\-----*/
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
    description: 'Interval (in minutes) to re-check for transaction hash at \'' + FILENAME + '\'',
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
    r equiresArg: true,
    description: 'Directory to check for \'' + FILENAME + '\'',
    default: '/nkn/data',
    string: true,
    alias: 'd'
  }
}).argv;


/*-----\
| Main |
\-----*/
const fs = require ('fs');
const nkn = require ('nkn-sdk');

// load funded wallet
const fromWallet = new nkn.Wallet.fromJSON (
  fs.readFileSync (argv.from), {
    password: fs.readFileSync (argv.pswdfile).toString ().trim ()
});

// load address to fund
const toAddress = JSON.parse (fs.readFileSync (argv.to)).Address;
if (!nkn.Wallet.verifyAddress (toAddress)) {
  console.error ('Could not find a valid \'Address\' property at', argv.to);
  process.exit (1);
}

// check 
const checkFile = argv.directory.endsWith ('/') ?
    argv.directory  + FILENAME :
    argv.directory + '/' + FILENAME;
try {
  fs.statSync (checkFile);
} catch (error) {
  console.log ('Could not find file at', checkFile);
  process.exit (1);
}
