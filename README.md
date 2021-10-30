# shu-how
NKN has recently introduced a fee to register new nodes. The fee is nominal as it will ultimately be repaid to miners. This program automatically funds new NKN nodes so that new nodes can join the network without any manual intervention.

## Options
- `--dry`, `-d` | *default:* `false`
  - Do not actually transfer any NKN. Leaves no transaction record either.
- `--amount`, `-a` | ***required***
  - The required amount of NKN to create a new node. Initially set at `10`.
- `--fee` | ***required***
  - Pre-set transaction fee for the NKN funding transaction. `0.1` may be a good default.
- `--from` | ***required***
  - Path to `wallet.json`-like file which holds and automatically distributes the initialization funds.
- `--pswdfile`, `-p` | ***required***
  - Path to `wallet.pswd`-like file corresponding to the `from` option.
- `--to` | *default:* `/nkn/data/wallet.json`
  - Path to a JSON file representing an object with an `Address` property.
- `--directory`, `-d` | *default:* `/nkn/data`
  - Directory to check for `funding.txt`.

## Overview
