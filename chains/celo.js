const Web3 = require("web3");
var web3 = new Web3();

async function newUser() {
  return await web3.eth.accounts.create();
}

module.exports = {
  newUser,
};
