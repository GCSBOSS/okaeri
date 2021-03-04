const mongo = require('nodecaf-mongo');
const crypto = require('crypto');
const v = require('valinor');

function generateSalt(){
    return new Promise( (resolve, reject) =>
        crypto.randomBytes(32, (err, buf) =>
            /* istanbul ignore next */
            err ? reject(err) : resolve(buf.toString('hex'))));
}

function hashPassword(password, salt){
    return new Promise( (resolve, reject) =>
        crypto.pbkdf2(password, salt, 1e5, 64, 'sha512', (err, buf) =>
            /* istanbul ignore next */
            err ? reject(err) : resolve(buf.toString('hex'))));
}

const ACC_PROJECTION = { hash: 0, salt: 0, _id: 0 };

module.exports = class Okaeri {

    constructor(conf){
        this.running = false;
        this.conf = {
            loginField: 'name',
            accountSchema: v.schema({
                name: v.str,
                password: v.str.between(8, 128)
            }),
            ...conf
        };
    }

    async start(){
        this.running = true;
        this.mongo = await mongo(this.conf.mongo, {
            account: 'Account',
            group: 'Group'
        })
        this.mongo.account.createIndexes({ [this.conf.loginField]: 1 }, { unique: true });
    }

    async stop(){
        this.running = false;
        await this.mongo.close();
    }

    async createAccount(input){

        let out = this.conf.accountSchema.test(input);
        if(!out.ok)
            return out;

        let lf = this.conf.loginField;
        if(await this.mongo.account.findOne({ [lf]: input[lf] }))
            return { ok: false, type: 'conflict' };

        let salt = await generateSalt();

        let acc = {
            ...out.final,
            salt,
            hash: await hashPassword(out.final.password, salt),
            groups: [],
            creation: new Date()
        };

        delete acc.password;

        await this.mongo.account.insertOne(acc);

        return { ok: true, id: acc._id.toString() };
    }

    async checkCredentials(key, password){
        let acc = await this.mongo.account.findOne(
            { [this.conf.loginField]: key },
            { hash: 1, salt: 1 }
        );

        if(!acc)
            return { ok: false, type: 'wrong' };

        let claim = await hashPassword(password, acc.salt);
        if(claim !== acc.hash)
            return { ok: false, type: 'wrong' };

        return { ok: true, id: acc._id.toString() };
    }

    async readAccount(id){
        var acc = await this.mongo.account.findOne({ _id: this.mongo.id(id) },
            { projection: ACC_PROJECTION });

        if(!acc)
            return { ok: false, type: 'unknown' };

        acc.id = id;

        return { ok: true, acc };
    }

    async updateAccount(id, data = {}){
        delete data.hash;
        delete data.salt;
        data.lastUpdate = new Date();

        // TODO logic if password changes
        // TODO logic if KEY changes
        delete data.password;

        let res = await this.mongo.account.updateOne({ _id: this.mongo.id(id) }, { $set: data });

        if(res.result.nModified == 0)
            return { ok: false, type: 'unknown' };

        return { ok: true };
    }

    async queryAccounts(filters = {}, order = {}, page = 1){

        let result = await this.mongo.account.aggregate([
            { $sort: { _id: 1, ...order } },
            ...Object.keys(filters).length ? [{ $match: filters }] : [],
            { $skip: (page - 1) * 30 },
            { $limit: 30 },
            { $addFields: { id: '$_id'} },
            { $project: ACC_PROJECTION }
        ]);

        return { ok: true, accs: await result.toArray() };
    }

    async iterateAccounts(filters = {}){
        return await this.mongo.account.aggregate([
            ...Object.keys(filters).length ? [{ $match: filters }] : [],
            { $addFields: { id: '$_id'} },
            { $project: ACC_PROJECTION }
        ]);
    }

    async createGroup(input){
        let out = v.schema({ name: v.str, code: v.str }).test(input);
        if(!out.ok)
            return out;

        if(await this.mongo.group.findOne({ code: out.final.code }))
            return { ok: false, type: 'conflict' };

        let group = {
            ...out.final,
            accounts: [],
            creation: new Date()
        };

        await this.mongo.group.insertOne(group);

        return { ok: true, id: group._id.toString() };
    }

    async updateGroup(id, data = {}){
        let out = v.schema({ name: v.str.opt, code: v.str.opt }).test(data);
        if(!out.ok)
            return out;

        out.final.lastUpdate = new Date();

        let res = await this.mongo.group.updateOne({ _id: this.mongo.id(id) }, { $set: out.final });

        if(res.result.nModified == 0)
            return { ok: false, type: 'unknown' };

        return { ok: true };
    }

    async readGroup(id){
        var group = await this.mongo.group.findOne({ _id: this.mongo.id(id) });

        if(!group)
            return { ok: false, type: 'unknown' };

        let res = await this.mongo.account.aggregate([
            { $match: { _id: { $in: group.accounts } } },
            { $sort: { name: 1, _id: 1 } },
        ]);

        group.accounts = (await res.toArray()).map(a => {
            delete a.salt;
            delete a.hash;
            delete a.creation;
            delete a.groups;
            a.id = a._id.toString();
            delete a._id;
            return a;
        });

        return { ok: true, group };
    }

    async removeGroup(id){
        let _id = this.mongo.id(id);
        let g = await this.mongo.group.findOne({ _id });
        if(!g)
            return { ok: false, type: 'unknown' };

        await this.mongo.group.removeOne({ _id });

        return { ok: true, code: g.code }
    }

    async queryGroups(filters = {}, order = {}, page = 1){

        let result = await this.mongo.group.aggregate([
            { $sort: { ...order, _id: 1 } },
            ...Object.keys(filters).length ? [{ $match: filters }] : [],
            { $skip: (page - 1) * 30 },
            { $limit: 30 },
            { $addFields: { members: { $size: '$accounts' } } },
            { $project: { accounts: 0 } }
        ]);

        return { ok: true, groups: await result.toArray() };
    }

    async addAccountToGroup(accId, grpId){

        if(!await this.mongo.account.findOne({ _id: this.mongo.id(accId) }))
            return { ok: false, type: 'unknown' };

        if(!await this.mongo.group.findOne({ _id: this.mongo.id(grpId) }))
            return { ok: false, type: 'unknown' };

        await this.mongo.account.updateOne({ _id: this.mongo.id(accId) },
            { $addToSet: { groups: this.mongo.id(grpId) } });

        await this.mongo.group.updateOne({ _id: this.mongo.id(grpId) },
            { $addToSet: { accounts: this.mongo.id(accId) } });

        return { ok: true };
    }

    async removeAccountFromGroup(accId, grpId){

        if(!await this.mongo.account.findOne({ _id: this.mongo.id(accId) }))
            return { ok: false, type: 'unknown' };

        if(!await this.mongo.group.findOne({ _id: this.mongo.id(grpId) }))
            return { ok: false, type: 'unknown' };

        this.mongo.account.updateOne({ _id: this.mongo.id(accId) },
            { $pull: { groups: this.mongo.id(grpId) } });

        this.mongo.group.updateOne({ _id: this.mongo.id(grpId) },
            { $pull: { accounts: this.mongo.id(accId) } });

        return { ok: true };
    }

}
