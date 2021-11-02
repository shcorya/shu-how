"use strict";

const FILENAME = 'funding.txt';

/*-----\
| logs |
\-----*/
const DateFormat = require ('fast-date-format');
const dateFormat = new DateFormat ('YYYY[-]MM[-]DD HH[:]mm[:]ss');

const log = require ('console-log-level') ({
  prefix: function (level) {
    return `[shu-how] ${dateFormat.format (new Date ())} [${level.toLowerCase ()}]`
  }
})

/*-----\
| args |
\-----*/
const yargs = require ('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const process = require ('process');
const argv = yargs (hideBin (process.argv)).options ({
  dry: {
    requiresArg: false,
    description: 'Do not actually transfer any NKN',
    demandOption: false,
    alias: 'd'
  },
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
  to: {
    requiresArg: true,
    description: 'Path to a JSON file representing an object with an \'Address\' property',
    default: '/nkn/data/wallet.json',
    string: true,
    alias: 't'
  },
  directory: {
    requiresArg: true,
    description: 'Directory to check for \'' + FILENAME + '\'',
    default: '/nkn/data',
    string: true,
    alias: 'd'
  }
}).argv;


/*-----\
| Main |
\-----*/
// leave the program running for docker
process.on ('SIGTERM', process.exit);

const fs = require ('fs');
const nkn = require ('nkn-sdk');

// load funded wallet
const fromWallet = nkn.Wallet.fromJSON (
  JSON.parse (fs.readFileSync (argv.from)), {
    password: fs.readFileSync (argv.pswdfile).toString ().trim ()
});

// load address to fund
const toAddress = JSON.parse (fs.readFileSync (argv.to)).Address;
if (!nkn.Wallet.verifyAddress (toAddress)) {
  log.error ('Could not find a valid \'Address\' property at', argv.to);
  process.exit (1);
}

// check for the existence of the receipt file (which should contain the tx or hash)
var checkFile = '';
checkFile = checkFile + (argv.directory.endsWith ('/') ?
  argv.directory + FILENAME :
  argv.directory + '/' + FILENAME);
log.info ('Checking for file at', checkFile);
try {
  fs.statSync (checkFile);

  // file found
  log.info (FILENAME, 'successfully found');

} catch (noFileError) {

  // file not found 
  log.warn ('Could not find file at', checkFile);

  // verify password
  log.info ('Checking provided wallet password');
  if (!fromWallet.verifyPassword ()) {
    log.error ('The provided password for the from wallet is not valid');
    process.exit (1);
  }

  // ensure sufficient balance
  log.info ('Checking wallet balance');
  nkn.Wallet.getBalance (fromWallet.address).then (amount => {
    log.info ('Found ' + amount.toString () + ' NKN at init address ' + fromWallet.address);

    // check whether or not balance amount is sufficient
    if (!amount.comparedTo (argv.amount + argv.fee) >= 0) {
      // insufficient balance to initialize a new wallet
      log.error ('Insufficient NKN balance to initialize a new node');
      process.exit (1);      

    } else {

      // balance is sufficient
      if (!argv.dry) {  
        fromWallet.transferTo (toAddress, argv.amount, {
          fee: argv.fee
        }).then (txOrHash => {

          // transaction successfully submitted
          fs.writeFileSync (checkFile, JSON.stringify (txOrHash));
          log.info ('Transaction successfully submitted and saved');

        }, txFailure => {
          // failed to submit transaction
          log.error ('Could not submit transaction to NKN blockchain');
          process.exit (1);
        });
      } else {

        // dry run 
        log.info ('Sufficient balance found, skipping tx in dry run');
      }
    }

  }, balanceFailure => {
    // could not retrieve balance
    log.error ('Could not retrieve balance for wallet ' + fromWallet.address);
    process.exit (1);
  });
}
