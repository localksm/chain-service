const hostConfiguration = require('./config/config')
const chain = require('./chains/'+hostConfiguration.chain)


const createAccount = async () => {
  return await chain.newUser()
}

const send = async(to, amount, asset, secret) =>{
  await chain.send(to, amount, asset, secret)
}

module.exports = {createAccount, send}
