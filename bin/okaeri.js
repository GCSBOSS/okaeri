#!node

const { run } = require('nodecaf');
run({
    init: require('../lib/main'),
    confPath: process.argv[2]
});
