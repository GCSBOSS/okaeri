const assert = require('assert');
const http = require('http');
const { EventEmitter } = require('events');
const { context } = require('muhb');
const Mongo = require('mongo-redux');
const init = require('../lib/main');

process.env.NODE_ENV = 'testing';

const mongoConf = {
    url: 'mongodb://' + (process.env.MONGO_HOST || 'localhost:27017'),
    name: 'Okaeri'
};

let
    app, base = context('http://localhost:7667'),
    mongo = new Mongo(),
    json = { 'Content-Type': 'application/json' },
    gotHook = new EventEmitter(),
    mockServer = http.createServer(function(req, res){
        gotHook.emit(req.headers['x-okaeri-event']);
        res.end();
    });

before(async function(){
    await mongo.connect(mongoConf);
    mockServer.listen(1234);
})

beforeEach(async function(){
    app = init();
    app.setup({ mongo: mongoConf });
    await app.start();
});

afterEach(async function(){
    await mongo.delete('Account', 'name', 'test-a');
    await app.stop();
});

after(async function(){
    await mongo.close();
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
            let { assert: test } = await base.post('account', json, { name: 'test-a', password: 'foobarbaz' });
            test.status.is(200);
            assert(await mongo.exists('Account', 'name', 'test-a'));
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
            assert.status.is(400);
            assert.body.contains('failed');
        });

        it('Should fail when password is wrong', async function(){
            await base.post('account', json, { name: 'test-a', password: 'foobarbaz' });
            let { assert } = await base.post('auth', json, { name: 'test-a', password: 'wrong-pass' });
            assert.status.is(400);
            assert.body.contains('failed');
        });

        it('Should respond OK when name and password are correct', async function(){
            await base.post('account', json, { name: 'test-a', password: 'foobarbaz' });
            let { assert } = await base.post('auth', json, { name: 'test-a', password: 'foobarbaz' });
            assert.status.is(200);
        });

    });

});
