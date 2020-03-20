
const stellar = require('stellar-sdk')
const fetch = require('node-fetch')
const config = require('../config/config')
const argv = require('yargs').argv
const chainFee = 0.001
const server = 'https://horizon-testnet.stellar.org'

if(config.network == 'testnet'){
  stellar.Network.useTestNetwork()
} else {
  stellar.Network.usePublicNetwork()
  server = 'https://horizon.stellar.org'
}

const newUser = async () => {
    const keys = stellar.Keypair.random()
    const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(keys.publicKey())}`)
    return { privateKey: keys.secret(), address: keys.publicKey() }
}

const send = async (to, amount, asset, secret) => {
    const server = new stellar.Server(server)

    const sender = stellar.Keypair.fromSecret(secret)


    let senderAcc
    try {
        senderAcc = await server.loadAccount(sender.publicKey())
    } catch (e) {
        console.log('unable to load buyer account: ' + e)
        throw (e)
    }

    const total = amount + chainFee

    const txConfig = {
        destination: to.publicKey(),
        asset: stellar.Asset.native(),
        amount: total.toString()
    }

    let sendTx = new stellar.TransactionBuilder(senderAcc, txOptions)
        .addOperation(stellar.Operation.createAccount(escrowAccountConfig))
        .setTimeout(stellar.TimeoutInfinite)
        .build()

    sendTx.sign(sender)
    await server.submitTransaction(sendTx)

    return escrowPair
}

module.exports = { newUser, send}
