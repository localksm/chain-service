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

async function send(to, amount, asset, fromSecret, fromAddress, iscGLD=false) {
  if(asset === "cgld"){
    await sendcGLD(fromSecret, fromAddress, to, amount)
  } else {
    await sendcUSD(to, amount, asset, fromSecret, fromAddress)
  }
}

async function sendcUSD(to, amount, asset, fromSecret, fromAddress) {
  try {
    kit.addAccount(fromSecret);
    console.log(amount)
    const weiAmount = kit.web3.utils.toWei(amount.toString(), 'ether')
    const stabletoken = await kit.contracts.getStableToken();

    const tx = await stabletoken.transfer(to, weiAmount).send({ from: fromAddress });
    const receipt = await tx.waitReceipt();

    return receipt;
  } catch (e) {
    console.log(e)
    throw e;
  }
}

async function sendcGLD(secret, from, toAddress, amount){
  try {
    amount = kit.web3.utils.toWei(amount, 'ether');
    kit.addAccount(secret)
    let goldtoken = await kit.contracts.getGoldToken()  
    let tx = await goldtoken.transfer(toAddress, amount).send({from})
  
    let receipt = await tx.waitReceipt()
  
    console.log('Transaction receipt: %o', receipt)
  
    return receipt;
  } catch (e) {
    console.log(e)
    throw e;
  }
}

module.exports = {
  newUser,
  send,
};
