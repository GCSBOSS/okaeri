const assert = require('assert');
const Okaeri = require('../lib/main');

process.env.NODE_ENV = 'testing';

const mongoConf = {
    url: 'mongodb://' + (process.env.MONGO_HOST || 'localhost:27017'),
    name: 'Okaeri'
};

let okaeri, mongo = null;

beforeEach(async function(){

    okaeri = new Okaeri({ mongo: mongoConf, identityHeader: 'id' });
    await okaeri.start();
    mongo = okaeri.mongo;
});

afterEach(async function(){
    await mongo.deleteOne({ name: 'test-a' });
    await okaeri.stop();
});

describe('Okaeri', function(){

    describe('Creating an account', function(){

        it('Should fail when input is invalid', async function(){
            let res = await okaeri.createAccount({ password: 'blah' });
            assert(!res.ok);
        });

        it('Should create account in database', async function(){
            assert(!await mongo.findOne({ name: 'test-a' }));
            let res = await okaeri.createAccount({ name: 'test-a', password: 'foobarbaz' });
            assert(res.ok);
            assert(await mongo.findOne({ name: 'test-a' }));
        });

        it('Should fail when account already exists', async function(){
            await okaeri.createAccount({ name: 'test-a', password: 'foobarbaz' });
            let res = await okaeri.createAccount({ name: 'test-a', password: 'foobarbaz' });
            assert(!res.ok);
            assert.strictEqual(res.type, 'conflict');
        });

    });

    describe('Verifying authentication', function(){

        it('Should fail when input is invalid', async function(){
            let res = await okaeri.checkCredentials(null, 'blah');
            assert(!res.ok);
        });

        it('Should fail when account doesn\'t exist', async function(){
            let res = await okaeri.checkCredentials('test-a', 'blah');
            assert(!res.ok);
            assert.strictEqual(res.type, 'wrong');
        });

        it('Should fail when password is wrong', async function(){
            await okaeri.createAccount({ name: 'test-a', password: 'foobarbaz' });
            let res = await okaeri.checkCredentials('test-a', 'wrong-pass');
            assert(!res.ok);
            assert.strictEqual(res.type, 'wrong');
        });

        it('Should respond OK when name and password are correct', async function(){
            await okaeri.createAccount({ name: 'test-a', password: 'foobarbaz' });
            let res = await okaeri.checkCredentials('test-a', 'foobarbaz');
            assert(res.ok);
        });

    });

    describe('Fetching account info', function(){

        it('Should fail when account doesn\'t exist', async function(){
            let res = await okaeri.readAccount('abdcfe61524635124');
            assert(!res.ok);
            assert.strictEqual(res.type, 'unknown');
        });

        it('Should return account info', async function(){
            let { id } =  await okaeri.createAccount({ name: 'test-a', password: 'foobarbaz' });
            let res = await okaeri.readAccount(id);
            assert(res.ok);
            assert.strictEqual(res.acc.name, 'test-a');
        });

    });

});
