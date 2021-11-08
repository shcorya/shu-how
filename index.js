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
    minimum: 0,
    seed: 'mainnet-seed-0001.nkn.org',
    txfee: 0
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
const { setIntervalAsync, clearIntervalAsync } = require ('set-interval-async/dynamic');
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

// create a queue for sequential execution
const queue = require ('queue') ({
  concurrency: 1,
  autostart: true
});
queue.on ('error', error => log.warn (error.message));

// run repeatedly
const mainClock = setIntervalAsync (async function main () {

  // find every virtual IP/task at the specified service name
  const addresses = (await dig ([`tasks.${argv.service}.`]))['answer'].map (a => a['value']);

  // check the status of every task
  const statuses = await Promise.all (addresses.map (address => {
    exec (`nknc --ip ${address} info --state`);
  }));

  // public keys from only tasks that are awaiting ID
  const keysReady = statuses.filter (status => {
    return status.error.code == -45022 }).map (status => status.error.publicKey);

  // send funding functions to the queue
  queue.push (async function (callback) {
    let cost = argv.fee + argv.txfee;

    // make sure balance stays above minimum
    if (minimum < (balance - cost)) {
      callback (new Error ("Insufficient balance for ID generation."), null);
    }

    // try to generate id
    try {
      const result = await exec (`nknc id --help`);
      balance = balance - cost;
      nonce = nonce + 1;
      callback (null, result);
    } catch (error) { 
      callback (error, null); 
    }
  });

}, argv.interval);

