"use strict";

const FILENAME = 'funding.txt';
const process = require ('process');

/*-----\
| logs |
\-----*/
const DateFormat = require ('fast-date-format');
const dateFormat = new DateFormat ('YYYY[-]MM[-]DD HH[:]mm[:]ss');

const log = require ('console-log-level') ({
  prefix: function (level) {
    return `[shu-how] ${dateFormat.format (new Date ())} [${level.toLowerCase ()}]`
  },
  level: process.argv.includes ('--debug') ? 'debug' : 'info'
})

/*-----\
| args |
\-----*/
log.debug ('process.argv:', process.argv);
log.debug ('Parsing arguments');
const argv = require ('minimist') (process.argv.slice (2), {
  default: {
    to: '/nkn/data/wallet.json',
    directory: '/nkn/data'
  }
});
log.debug ('argv:', argv);

const reqArgs = ['amount', 'fee', 'from', 'pswdfile'];
reqArgs.forEach (arg => {
  if (!Object.keys (argv).includes (arg)) {
    log.error ('Missing required argument:', arg);
    process.exit (1);
  }
});

/*-----\
| Main |
\-----*/
// leave the program running for docker
process.on ('SIGTERM', process.exit);

const fs = require ('fs');
const nkn = require ('nkn-sdk');

// load funded wallet
log.debug ('Loading wallet at', argv.from);
const walletJSON = fs.readFileSync (argv.from).toString ();
log.debug ('wallet.json:', JSON.parse (walletJSON));
const fromWallet = nkn.Wallet.fromJSON (
  walletJSON, {
    password: fs.readFileSync (argv.pswdfile).toString ()
});

// load address to fund
const toAddress = JSON.parse (fs.readFileSync (argv.to)).Address;
if (!nkn.Wallet.verifyAddress (toAddress)) {
  log.error ('Could not find a valid \'Address\' property at', argv.to);
  process.exit (1);
}
log.debug ('Found to address', toAddress);

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
