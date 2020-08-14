const crypto = require('crypto');
const v = require('valinor');
const { post } = require('muhb');

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

module.exports = {

    async create({ mongo, res, log, body, conf }){

        let out = v.schema({
            name: v.str,
            password: v.str.between(8, 128)
        }).test(body);

        res.badRequest(out !== true, out);

        let conflict = await mongo.exists('Account', 'name', body.name);
        res.badRequest(conflict, 'Account name \'%s\' is taken', body.name);

        let salt = await generateSalt();

        let acc = {
            salt,
            name: body.name,
            hash: await hashPassword(body.password, salt),
            creation: new Date()
        };

        await mongo.insert('Account', acc);
        res.end(acc._id.toString());

        log.info('Created account \'%s\'', body.name);

        if(conf.hooks.onCreateAccount){
            delete acc.salt;
            delete acc.hash;
            post(conf.hooks.onCreateAccount, {
                'Content-Type': 'application/json',
                'X-Okaeri-Event': 'new-account'
            }, acc);
        }
    },

    async auth({ body, res, mongo }){
        v.schema({ name: v.str, password: v.str }).assert(body);

        let acc = await mongo.get('Account', 'name', body.name);
        res.unauthorized(!acc, 'Authentication failed');

        let claim = await hashPassword(body.password, acc.salt);
        res.unauthorized(claim !== acc.hash, 'Authentication failed');

        res.end(acc._id.toString());
    },

    async info({ headers, conf, params, res, mongo }){
        let id = params.acc || headers[conf.identityHeader];

        let acc = await mongo.get('Account', '_id', mongo.id(id));
        res.notFound(!acc);

        let out = { ...acc.metadata, id, name: acc.name, creation: acc.creation };
        res.set('Content-Type', 'application/json');
        res.end(JSON.stringify(out));
    }

}
