const { AppServer } = require('nodecaf');
const Mongo = require('mongo-redux');

const api = require('./api');

module.exports = function init(){
    let app = new AppServer(__dirname + '/default.toml');
    let mongo = new Mongo();

    let shared = { mongo };

    app.onRouteError = function(input, err, send){
        if(err.code == 'ERR_ASSERTION'){
            input.res.set('Content-Type', 'application/json');
            send('InvalidContent', err.expected);
        }
    };

    app.beforeStart = async function({ conf }){
        await mongo.connect(conf.mongo);
        // TODO mongo index on account name
    };

    app.afterStop = async function(){
        await mongo.close();
    };

    app.name = 'Okaeri';
    app.version = '0.0.2';
    app.expose(shared);
    app.api(api);

    return app;
}
