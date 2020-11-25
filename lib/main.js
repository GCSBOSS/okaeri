const Nodecaf = require('nodecaf');
const { ObjectID, MongoClient } = require('mongodb');

const api = require('./api');

module.exports = () => new Nodecaf({
    api,
    conf: __dirname + '/default.toml',

    async startup({ global, conf }){
        let client = new MongoClient(conf.mongo.url, { useUnifiedTopology: true });
        await client.connect();
        global.mongo = client.db(conf.mongo.db).collection('Account');
        global.mongo.createIndexes({ name: 1 }, { unique: true });
        global.mongo.client = client;
        global.mongo.id = ObjectID;
    },

    async shutdown({ global }){
        await global.mongo.client.close();
    }
});
