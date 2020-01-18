#!node

const { run } = require('nodecaf');
run({
    init: require('../lib/main'),
    confPath: process.env.OKAERI_CONF || './conf.toml'
});
