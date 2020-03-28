const BncClient = require('@binance-chain/javascript-sdk')
const axios = require('axios')
const config = require('../config/config')
const chainFee = 0.001
let api = 'https://testnet-dex.binance.org/'

if(config.network !== 'testnet'){
    api = 'https://dex.binance.org/'
}

const newUser = async () => {
    const client = new BncClient(api)
    await client.initChain()
    if(config.network !== 'testnet'){
        client.chooseNetwork(config.network)
    }
    return client.createAccount()
}

const send = async (to, amount, asset, secret) => {
  const bnbClient = new BncClient(api);

  bnbClient.chooseNetwork(config.network); // or this can be "mainnet
  bnbClient.setPrivateKey(secret);
  await bnbClient.initChain();

  const sender = await bnbClient.getClientKeyAddress(); // sender address string (e.g. bnb1...)
  const total = parseFloat(amount) + parseFloat(chainFee)
  const httpClient = axios.create({ baseURL: api });
  const sequenceURL = `${api}api/v1/account/${sender}/sequence`;

  await httpClient
    .get(sequenceURL)
    .then((res) => {
        const sequence = res.data.sequence || 0
        return bnbClient.transfer(sender, to, total, asset, 'AP TX', sequence)
    })
    .then((result) => {
        console.log(result);
        if (result.status === 200) {
          console.log('success', result.result[0].hash+"\n");
        } else {
          console.error('error', result);
        }
    })
    .catch((error) => {
      console.error('error', error);
    });
}

module.exports = { newUser, send}
