# shu-how
NKN has recently introduced a fee to register new nodes. The fee is nominal as it will ultimately be repaid to miners. This program automatically funds new NKN nodes so that new nodes can join the network without any manual intervention. This program is intended to be run alongside an NKN node in a Docker Swarm environment.

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
The program accepts options which may change in accordance with potential and forseeable changes to the NKN blockchain. The simple, binary existance of a file is currently used to determine wether each local node has been funded already. Presently this filename is hardcoded as `funding.txt`. The removal or moving of this file may result in funds being illogically distributed.

## Example
```yaml
version: '3.9'

x-placement-constraint: &all-workers
  mode: global
  placement:
    constraints:   
      - node.role == worker

services:
  node:
    image: nknorg/nkn:latest
    command: >
      nknd
      --no-nat
      --password-file /run/secrets/nkn_master-pswd
    configs:
      - source: nkn_main-beneficiary
        target: /nkn/data/config.json
    secrets:
      - nkn_master-pswd 
    ports:
      - "80:80"
      - "30001-30005:30001-30005"
    volumes:
      - data:/nkn/data
    deploy:
      restart_policy:
        delay: 5s
        max_attempts: 3
        window: 120s
      update_config:
        parallelism: 1
        delay: 4h
        failure_action: rollback
      <<: *all-workers

  init:
    image: stevecorya/shu-how:latest
    command: >
      --dry
      --amount 10
      --fee 0.1
      --from /nkn_init-wallet
      --pswdfile /run/secrets/nkn_init-pswd
    configs:
      - nkn_init-wallet
    secrets:
      - nkn_init-pswd
    volumes:
      - data:/nkn/data
    deploy:
      <<: *all-workers

configs:
  nkn_main-beneficiary:
    external: true
  nkn_init-wallet:
    external: true

secrets:
  nkn_init-pswd:
    external: true

volumes:
  data:
    driver: local
```
