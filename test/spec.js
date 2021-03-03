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
    await mongo.account.deleteOne({ name: 'test-a' });
    await mongo.account.deleteOne({ name: 'test-z' });
    await okaeri.stop();
});

describe('Okaeri', function(){

    describe('Creating an account', function(){

        it('Should fail when input is invalid', async function(){
            let res = await okaeri.createAccount({ password: 'blah' });
            assert(!res.ok);
        });

        it('Should create account in database', async function(){
            assert(!await mongo.account.findOne({ name: 'test-a' }));
            let res = await okaeri.createAccount({ name: 'test-a', password: 'foobarbaz' });
            assert(res.ok);
            assert(await mongo.account.findOne({ name: 'test-a' }));
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

    describe('Updating an account', function(){

        it('Should fail when account doesn\'t exist', async function(){
            let res = await okaeri.updateAccount('abdcfe61524635124');
            assert(!res.ok);
            assert.strictEqual(res.type, 'unknown');
        });

        it('Should update account in database', async function(){
            let { id } = await okaeri.createAccount({ name: 'test-a', password: 'foobarbaz' });
            let res = await okaeri.updateAccount(id, { name: 'test-z' });
            assert(res.ok);
            let r = await okaeri.readAccount(id);
            assert(r.ok);
            assert.strictEqual(r.acc.name, 'test-z');
        });

    });

    describe('Query accounts', function(){

        it('Should return all account records', async function(){
            await okaeri.createAccount({ name: 'test-a', password: 'foobarbaz' });
            await okaeri.createAccount({ name: 'test-z', password: 'foobarbaz' });
            let res = await okaeri.queryAccounts();
            assert.strictEqual(res.accs.length, 2);
        });

        it('Should filter returned accounts', async function(){
            await okaeri.createAccount({ name: 'test-a', password: 'foobarbaz' });
            await okaeri.createAccount({ name: 'test-z', password: 'foobarbaz' });
            let res = await okaeri.queryAccounts({ name: { $regex: /z/ } });
            assert.strictEqual(res.accs.length, 1);
            assert.strictEqual(res.accs[0].name, 'test-z');
        });

    });

    describe('Iterating accounts', function(){

        it('Should allow iterating through all accounts', async function(){
            await okaeri.createAccount({ name: 'test-a', password: 'foobarbaz' });
            await okaeri.createAccount({ name: 'test-z', password: 'foobarbaz' });

            let res = await okaeri.iterateAccounts();

            let a1 = await res.next();
            assert.strictEqual(a1.name, 'test-a');
            let a2 = await res.next();
            assert.strictEqual(a2.name, 'test-z');
        });

        it('Should allow iterating through accounts matched by filter', async function(){
            await okaeri.createAccount({ name: 'test-a', password: 'foobarbaz' });
            await okaeri.createAccount({ name: 'test-z', password: 'foobarbaz' });

            let res = await okaeri.iterateAccounts({ name: { $regex: /z/ } });

            let a1 = await res.next();
            assert.strictEqual(a1.name, 'test-z');
            assert(!await res.next());
        });

    });

});
