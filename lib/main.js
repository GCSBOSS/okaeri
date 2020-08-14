const Nodecaf = require('nodecaf');
const Mongo = require('mongo-redux');

const api = require('./api');

module.exports = function init(){
    let app = new Nodecaf(api, __dirname + '/default.toml');

    app.startup(async function({ global, conf }){
        global.mongo = new Mongo();
        await global.mongo.connect(conf.mongo);
        await global.mongo.index('Account', { name: 1 }, { unique: true });
    });

    app.shutdown(async function({ global }){
        await global.mongo.close();
    });

    return app;
}
