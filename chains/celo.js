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
  console.log(data);

  return data;
}

async function send(to, amount, asset, fromSecret, fromAddress) {
  // 1. Add sender account to ContractKit to sign transactions  
  kit.addAccount(fromSecret);

  let stableToken = await kit.contracts.getStableToken();

  let tx = await stableToken.transfer(to, amount).send({ from: fromAddress });

  let receipt = await tx.waitReceipt();

  return receipt;
}

module.exports = {
  newUser,
  send
};
