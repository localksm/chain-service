const { ApiPromise, WsProvider } = require("@polkadot/api");
const Keyring = require("@polkadot/keyring").default;
const { encodeAddress } = require("@polkadot/util-crypto");
const bip39 = require("bip39");

async function send(to, amount, asset, secret, from) {
  // Construct
  const wsProvider = new WsProvider("wss://kusama-rpc.polkadot.io");
  const multiplier = 1000000000000; //Multiplier to equal amount to 1 KSM

  //Prefix used to get correct format for address
  //https://github.com/paritytech/substrate/wiki/External-Address-Format-(SS58)
  //https://wiki.polkadot.network/docs/en/learn-accounts#for-the-curious-how-prefixes-work
  //SS58Prefix = 2  <-- Kusama
  const SS58Prefix = 2; //Should be determined in config as it's network specific
  const api = await ApiPromise.create({ provider: wsProvider });
  try {
    const keyring = new Keyring(); //default curve ed25519

    const fromPair = keyring.addFromUri(secret); // Secret should be seed or mnemonic
    const fromAddress = encodeAddress(fromPair.address, SS58Prefix);
    const toAddress = encodeAddress(to, SS58Prefix);

    const tx = api.tx.balances.transfer(toAddress, amount * multiplier);

    const result = await tx.signAndSend(fromPair);
    const jsonResp = result.toJSON();
    
    // Make sure we terminate the socket connection
    if(wsProvider.isConnected()){
      console.log("Disconnecting from socket");
      api.disconnect();
    }
    return jsonResp;
  } catch (e) {
    console.log("Disconnecting from socket");
    api.disconnect();
    return { error: e.toString() };
  }
}

function newUser() {
  // Create seed and mnemonic phrase
  const mnemonic = bip39.generateMnemonic();
  // Create an instance of the Keyring
  const keyring = new Keyring({ type: "ed25519" });
  const pair = keyring.addFromUri(mnemonic);
  // Get keys
  const keys = keyring.getPair(pair.address);
  const keypairs = {
    public_key: keys.address,
    private_key: mnemonic,
  };
  return keypairs;
}

module.exports = { newUser, send };
