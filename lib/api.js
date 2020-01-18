
const Account = require('./account');

module.exports = function({ post }){

    this.accept('json');

    post('/account', Account.create);
    post('/auth', Account.auth);
}
