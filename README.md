# shu-how
NKN has recently introduced a fee to register new nodes. The fee is nominal as it will ultimately be repaid to miners.

This program automatically funds new NKN nodes so that new nodes can join the network without any manual intervention.

## Options
- `--requirement`, `-r` *required*
  - The required amount of NKN to create a new node. Initially set at `10`.
- `--fee` *required*
  - Pre-set transaction fee for the NKN funding transaction. `0.1` may be a good default.
- `--from` *required*
  - Path to `wallet.json`-like file which holds and automatically distributes the initialization funds.
- `--password-file`, `-p` *required*
  - 
- `--interval`, `-i` *default:* `300`
  -  
- `--to` *default:* `/nkn/data/wallet.json`
  - Path to a JSON file representing an object with an `Address` property.
- `--directory`, `-d` *default:* `/nkn/data`
  -

## Overview
