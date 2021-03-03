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
            account: 'Account'
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

}
