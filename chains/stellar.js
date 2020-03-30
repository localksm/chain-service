const stellar = require('stellar-sdk')
const fetch = require('node-fetch')
const config = require('../config/config')
const argv = require('yargs').argv
const chainFee = 0.001
let serverURL = 'https://horizon-testnet.stellar.org'
let networks = stellar.Networks.TESTNET

if(config.network !== 'testnet'){
    networks = stellar.Networks.PUBLIC
    serverURL = 'https://horizon.stellar.org'
}

const newUser = async () => {
    const keys = await stellar.Keypair.random()

    if(config.network === 'testnet'){   
        const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(keys.publicKey())}`)
    }else{
        const to = keys.publicKey()
        const amount = '1'
        const asset = 'lumens'
        const secret = config.stellarFundingAccount
        const sender = await stellar.Keypair.fromSecret(secret)
        const server = new stellar.Server(serverURL)

        let senderAcc
        try {
            senderAcc = await server.loadAccount(sender.publicKey())
        } catch (e) {
            console.log('unable to load buyer account: ' + e)
            throw (e)
        }

        const txConfig = {
            destination: to,
            startingBalance: amount
        }

        const txOptions = {
            fee: await server.fetchBaseFee(),
            networkPassphrase: networks
        }

        let sendTx
        try{
            sendTx = await new stellar.TransactionBuilder(senderAcc, txOptions)
                .addOperation(stellar.Operation.createAccount(txConfig))
                .setTimeout(stellar.TimeoutInfinite)
                .build()

            sendTx.sign(sender)
            await server.submitTransaction(sendTx)
        }catch(e) {
            console.log('couldn\'t do transaction: ' + e)
            throw(e)
        }
    }
    
    return { privateKey: keys.secret(), address: keys.publicKey() }
}

const send = async (to, amount, asset, secret) => {
    const server = new stellar.Server(serverURL)
    const sender = await stellar.Keypair.fromSecret(secret)
    let senderAcc
    try {
        senderAcc = await server.loadAccount(sender.publicKey())
    } catch (e) {
        console.log('unable to load buyer account: ' + e)
        throw (e)
    }

    const total = parseFloat(amount) + parseFloat(chainFee)

    const txConfig = {
        destination: to,
        asset: stellar.Asset.native(),
        amount: total.toString()
    }

    const txOptions = {
        fee: await server.fetchBaseFee(),
        networkPassphrase: networks
    }

    let sendTx
    try{
        sendTx = await new stellar.TransactionBuilder(senderAcc, txOptions)
            .addOperation(stellar.Operation.payment(txConfig))
            .setTimeout(stellar.TimeoutInfinite)
            .build()
    }catch(e) {
        console.log('couldn\'t do transaction: ' + e)
        throw(e)
    }

    sendTx.sign(sender)
    await server.submitTransaction(sendTx)
}

const fee = async () => {
    const aux = await fetch(`${serverURL}/fee_stats`);
    const res = await aux.json();
    return res; 
}

module.exports = { newUser, send, fee}
