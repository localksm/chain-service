const { ApiPromise, WsProvider } = require('@polkadot/api');
const Keyring = require('@polkadot/keyring').default;
const { encodeAddress } = require('@polkadot/util-crypto');

// Construct
const wsProvider = new WsProvider('wss://kusama-rpc.polkadot.io');
const multiplier = 1000000000000 //Multiplier to equal amount to 1 KSM

//Prefix used to get correct format for address
//https://github.com/paritytech/substrate/wiki/External-Address-Format-(SS58)
//https://wiki.polkadot.network/docs/en/learn-accounts#for-the-curious-how-prefixes-work
//SS58Prefix = 2  <-- Kusama
const SS58Prefix = 2; //Should be determined in config as it's network specific

async function send(to, amount, asset, secret, from){
    try{
        const api = await ApiPromise.create({ provider: wsProvider });
        const keyring = new Keyring(); //default curve ed25519

        const fromPair = keyring.addFromUri(secret); // Secret should be seed or mnemonic
        const fromAddress = encodeAddress(fromPair.address, SS58Prefix)
        const toAddress = encodeAddress(to, SS58Prefix)

        const tx = api.tx.balances.transfer(toAddress, amount*multiplier);

        const promise = new Promise((resolve, reject) => {
          tx.signAndSend(fromPair, ({ events = [], status }) => {
            console.debug(`Status: ${status.type}`)
            if (status.isFinalized) {
              console.debug(`Hash: ${status.asFinalized}`);
              blockHash = `${status.asFinalized}`;
              resolve(blockHash);
            }
          });
        });

        return await promise;        
    }catch (e){
      throw e; 
    }
}
