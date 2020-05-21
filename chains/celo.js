const Web3 = require("web3");
const ContractKit = require("@celo/contractkit");
const config = require("../config/config");

let url = "https://alfajores-forno.celo-testnet.org";

if (config.network !== "testnet") {
  // Meanwhile
  url = "https://alfajores-forno.celo-testnet.org";
}

const kit = ContractKit.newKit(url);
const web3 = new Web3();

async function newUser() {
  const data = await web3.eth.accounts.create();

  return data;
}

async function send(to, amount, asset, fromSecret, fromAddress) {
  try {
    //1 usd = 0.1 cgold
    kit.addAccount(fromSecret);

    let goldToken = await kit.contracts.getGoldToken();    
    let tx = await goldToken.transfer(to, amount).send({ from: fromAddress });

    let receipt = await tx.waitReceipt();

    return receipt;
  } catch (e) {    
    throw e;
  }
}

module.exports = {
  newUser,
  send,
};
