const assert = require('assert');
const http = require('http');
const { EventEmitter } = require('events');
const { context } = require('muhb');
const init = require('../lib/main');

process.env.NODE_ENV = 'testing';

const mongoConf = {
    url: 'mongodb://' + (process.env.MONGO_HOST || 'localhost:27017'),
    name: 'Okaeri'
};

let
    app, base = context('http://localhost:7667'),
    mongo = null,
    json = { 'Content-Type': 'application/json' },
    gotHook = new EventEmitter(),
    mockServer = http.createServer(function(req, res){
        gotHook.emit(req.headers['x-okaeri-event']);
        res.end();
    });

before(function(){
    mockServer.listen(1234);
})

beforeEach(async function(){
    app = init();
    app.setup({ mongo: mongoConf, identityHeader: 'id' });
    await app.start();
    mongo = app.global.mongo;
});

afterEach(async function(){
    await mongo.deleteOne({ name: 'test-a' });
    await app.stop();
});

after(function(){
    mockServer.close();
});

describe('Okaeri', function(){

    describe('Creating an account', function(){

        it('Should fail when input is invalid', async function(){
            let { assert } = await base.post('account', json, { password: 'blah' });
            assert.status.is(400);
            assert.body.contains('"rule":"between"');
        });

        it('Should create account in database', async function(){
            assert(!await mongo.findOne({ name: 'test-a' }));
            let { assert: test } = await base.post('account', json, { name: 'test-a', password: 'foobarbaz' });
            test.status.is(200);
            assert(await mongo.findOne({ name: 'test-a' }));
        });

        it('Should fail when account already exists', async function(){
            await base.post('account', json, { name: 'test-a', password: 'foobarbaz' });
            let { assert } = await base.post('account', json, { name: 'test-a', password: 'foobarbaz' });
            assert.status.is(400);
            assert.body.contains('\'test-a\' is taken');
        });

        it('Should trigger webhook when [hooks.onCreateAccount = URL]', function(done){
            (async function(){
                await app.restart({ hooks: { onCreateAccount: 'http://localhost:1234' } });
                mongo = app.global.mongo;
                await base.post('account', json, { name: 'test-a', password: 'foobarbaz' });
                gotHook.once('new-account', done);
            })();
        });

    });

    describe('Verifying authentication', function(){

        it('Should fail when input is invalid', async function(){
            let { assert } = await base.post('auth', json, { password: 'blah' });
            assert.status.is(400);
            assert.body.contains('"rule":"required"');
        });

        it('Should fail when account doesn\'t exist', async function(){
            let { assert } = await base.post('auth', json, { name: 'test-a', password: 'my-pass' });
            assert.status.is(401);
            assert.body.contains('failed');
        });

        it('Should fail when password is wrong', async function(){
            await base.post('account', json, { name: 'test-a', password: 'foobarbaz' });
            let { assert } = await base.post('auth', json, { name: 'test-a', password: 'wrong-pass' });
            assert.status.is(401);
            assert.body.contains('failed');
        });

        it('Should respond OK when name and password are correct', async function(){
            await base.post('account', json, { name: 'test-a', password: 'foobarbaz' });
            let { assert } = await base.post('auth', json, { name: 'test-a', password: 'foobarbaz' });
            assert.status.is(200);
        });

    });

    describe('Fetching account info', function(){

        it('Should fail when account doesn\'t exist', async function(){
            let { assert } = await base.get('account/none');
            assert.status.is(404);
        });

        it('Should return account info', async function(){
            let { body } = await base.post('account', json, { name: 'test-a', password: 'foobarbaz' });
            let { assert } = await base.get('account/' + body);
            assert.status.is(200);
        });

        it('Should return account info by header', async function(){
            let { body } = await base.post('account', json, { name: 'test-a', password: 'foobarbaz' });
            let { assert } = await base.get('identity', { ...json, id: body });
            assert.status.is(200);
            assert.body.json.match('name', 'test-a');
        });

    });

});
