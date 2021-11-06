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
});

/*-----\
| args |
\-----*/
log.debug ('process.argv:', process.argv);
log.debug ('Parsing arguments');
const argv = require ('minimist') (process.argv.slice (2), {
  default: {
    interval: 15,
    minimum: 0
  }
});
log.debug ('argv:', argv);

const reqArgs = ['amount', 'fee', 'wallet', 'pswdfile', 'service'];
reqArgs.forEach (arg => {
  if (!Object.keys (argv).includes (arg)) {
    log.error ('Missing required argument:', arg);
    process.exit (1);
  }
});

/*-----\
| Main |
\-----*/
const { exec, execSync } = require ('child_process');
const fs = require ('fs');

// read password
log.debug ('Reading password');
const password = fs.readFileSync (argv.pswdfile).toString ().trim ();

// check balance
log.debug ('Checking balance');
var balance = JSON.parse (
  execSync (`nknc --ip ${argv.seed} wallet --name ${argv.wallet} --password ${password} --list balance`)
).result.amount;
log.info ('Found a balance of', balance, 'NKN');

// check nonce
log.debug ('Checking nonce');
var nonce = JSON.parse (
  execSync (`nknc --ip ${argv.seed} wallet --name ${argv.wallet} --password ${password} --list nonce`)
).results.nonce;
log.info ('Found nonce', nonce);


const discovery = setInterval (async function discover () {
  const dnsEndpoint = `tasks.${argv.service}.`;
  const addresses = (await dig ([dnsEndpoint]))['answer'].map (a => a['value']);
  // each address will correspond to a public key and each address may correspond to an id
  // for each address with a public key but no id an id needs to be generated
  // id's must be generated one-at-a-time in order to properly track pending NKN balance
  const statuses = await Promise.all (addresses.map (address => {
    exec (`nknc --ip ${address} info --state`); 
  }));

  const keysToFund = statuses.filter (status => {
    return status.error.code == -45022 }).map (status => status.error.publicKey);
}, argv.interval * 1000);
