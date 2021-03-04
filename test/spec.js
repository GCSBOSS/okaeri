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
    await mongo.account.deleteOne();
    await mongo.group.deleteOne();
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

    describe('Creating a Group', function(){

        it('Should fail when input is invalid', async function(){
            let res = await okaeri.createGroup();
            assert(!res.ok);
        });

        it('Should create a group in database', async function(){
            let res = await okaeri.createGroup({ name: 'g1', code: 'g1' });
            assert(res.ok);
            assert(await mongo.group.findOne({ name: 'g1' }));
        });

        it('Should fail when the group already exists', async function(){
            await okaeri.createGroup({ name: 'g1', code: 'g1' });
            let res = await okaeri.createGroup({ name: 'g2', code: 'g1' });
            assert(!res.ok);
            assert.strictEqual(res.type, 'conflict');
        });

    });

    describe('Updating a Group', function(){

        it('Should fail when input is invalid', async function(){
            let res = await okaeri.updateGroup('abdcfe61524635124', false);
            assert(!res.ok);
        });

        it('Should fail when group doesn\'t exist', async function(){
            let res = await okaeri.updateGroup('abdcfe61524635124');
            assert(!res.ok);
            assert.strictEqual(res.type, 'unknown');
        });

        it('Should update group in database', async function(){
            let { id } = await okaeri.createGroup({ name: 'g1', code: 'g1' });
            let res = await okaeri.updateGroup(id, { name: 'g0' });
            assert(res.ok);
            assert(await mongo.group.findOne({ name: 'g0' }));
        });

    });

    describe('Fetching Group info', function(){

        it('Should fail when group doesn\'t exist', async function(){
            let res = await okaeri.readGroup('abdcfe61524635124');
            assert(!res.ok);
            assert.strictEqual(res.type, 'unknown');
        });

        it('Should return group info', async function(){
            let { id } =  await okaeri.createGroup({ name: 'g1', code: 'g1' });
            let res = await okaeri.readGroup(id);
            assert(res.ok);
            assert.strictEqual(res.group.name, 'g1');
        });

    });

    describe('Removing group', function(){

        it('Should fail when group doesn\'t exist', async function(){
            let res = await okaeri.removeGroup('abdcfe61524635124');
            assert(!res.ok);
            assert.strictEqual(res.type, 'unknown');
        });

        it('Should remove the group from db', async function(){
            let { id } = await okaeri.createGroup({ name: 'g1', code: 'g1' });
            let res = await okaeri.removeGroup(id);
            assert(res.ok);
            assert.strictEqual(res.code, 'g1');
            let r = await okaeri.readGroup(id);
            assert(!r.ok);
        });

    });

    describe('Query groups', function(){

        it('Should return all group records', async function(){
            await okaeri.createGroup({ name: 'g1', code: 'g1' });
            await okaeri.createGroup({ name: 'g2', code: 'g2' });
            let res = await okaeri.queryGroups();
            assert.strictEqual(res.groups.length, 2);
        });

        it('Should filter returned groups', async function(){
            await okaeri.createGroup({ name: 'g1', code: 'g1' });
            await okaeri.createGroup({ name: 'g2', code: 'g2' });
            let res = await okaeri.queryGroups({ name: { $regex: /2/ } });
            assert.strictEqual(res.groups.length, 1);
            assert.strictEqual(res.groups[0].name, 'g2');
        });

    });

    describe('Manage group accounts', function(){

        it('Should fail when account doesn\'t exist', async function(){
            let r1 = await okaeri.addAccountToGroup('234235abfd5765fe', '234235abfd5765fe');
            assert(!r1.ok);

            let r2 = await okaeri.removeAccountFromGroup('234235abfd5765fe', '234235abfd5765fe');
            assert(!r2.ok);
        });

        it('Should fail when group doesn\'t exist', async function(){
            let { id } = await okaeri.createAccount({ name: 'test-a', password: 'foobarbaz' });

            let r1 = await okaeri.addAccountToGroup(id, '234235abfd5765fe');
            assert(!r1.ok);

            let r2 = await okaeri.removeAccountFromGroup(id, '234235abfd5765fe');
            assert(!r2.ok);
        });

        it('Should add account to group', async function(){
            let { id } = await okaeri.createAccount({ name: 'test-a', password: 'foobarbaz' });
            let { id: gid } = await okaeri.createGroup({ name: 'g1', code: 'g1' });
            let res = await okaeri.addAccountToGroup(id, gid);
            assert(res.ok);
            let { group } = await okaeri.readGroup(gid);
            assert.strictEqual(group.accounts[0].name, 'test-a');
        });

        it('Should remove account to group', async function(){
            let { id } = await okaeri.createAccount({ name: 'test-a', password: 'foobarbaz' });
            let { id: gid } = await okaeri.createGroup({ name: 'g1', code: 'g1' });
            await okaeri.addAccountToGroup(id, gid);
            let res = await okaeri.removeAccountFromGroup(id, gid);
            assert(res.ok);
            let { group } = await okaeri.readGroup(gid);
            assert.strictEqual(group.accounts.length, 0);
        });

    });

    describe('Check if account belongs to group', function(){

        it('Should return whether account is in any group sent', async function(){
            let { id } = await okaeri.createAccount({ name: 'test-a', password: 'foobarbaz' });
            await okaeri.createGroup({ name: 'g1', code: 'g1' });
            let { id: i2 } = await okaeri.createGroup({ name: 'g2', code: 'g2' });


            let r1 = await okaeri.isAccountInAnyGroup(id, [ 'g1', 'g2' ]);
            assert(!r1.ok);

            await okaeri.addAccountToGroup(id, i2);
            let r2 = await okaeri.isAccountInAnyGroup(id, [ 'g2' ]);
            assert(r2.ok);

            let r3 = await okaeri.isAccountInAnyGroup(id, [ 'g1', 'g2' ]);
            assert(r3.ok);
        });

    });

});
