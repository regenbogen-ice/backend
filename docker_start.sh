#!/bin/bash
set -e
yarn run knex --env production migrate:latest
yarn node dist/src/index.js