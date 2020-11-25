
const Account = require('./account');

module.exports = function({ post, get }){

    get('/account/:acc', Account.info);

    post('/account', Account.create);
    post('/auth', Account.auth);
    get('/identity', Account.info);
}
