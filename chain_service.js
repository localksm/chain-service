const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const { check, validationResult, param } = require('express-validator')
const config = require('./config/config')
const chain = require ('./chain')
const getKeys = require('./kms')
const port = config.port
const chainName = config.chain;

const middleware = [
  bodyParser.json(),
  bodyParser.urlencoded({ extended: true }),
  check()
]

app.use(middleware)

app.get('/', (req, res) => {
  res.send('live')
})

app.get('/create_account', async (req, res) => {
  try{
    const errors = validationResult(req)
    if(!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() })

    //res.setTimeout(3000)
    let datos = await chain.createAccount()
    return res.status(200).send(datos)

  }catch(error){
    return res.status(500).send(error.message)
  }
})

const sendCheck = [
  check('sender_kms_key').exists().trim().escape(),
  check('receiver_kms_key').exists().trim().escape(),
  check('amount').exists().trim().escape(),
  check('asset').exists().trim().escape()
]

app.post('/send', sendCheck, async (req, res) => {
  try{
    const errors = validationResult(req)
    if(!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() })

    //res.setTimeout(3000)
    const { amount, asset, receiver_kms_key, sender_kms_key } = req.body
    const kmsKeys = await getKeys(sender_kms_key.toString())
    const receiverKeys = await getKeys(receiver_kms_key.toString())
    const secret = kmsKeys['keys'][chainName]['private_key']
    const to = receiverKeys['keys'][chainName]['public_key']

    await chain.send(to, amount, asset, secret)
    return res.status(200).send("Send finished!")

  }catch(error){
    return res.status(500).send(error.message)
  }
})

app.listen(port, () => console.log(`Server listening on port ${port}!`))
