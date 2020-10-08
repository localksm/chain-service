const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { check, validationResult, param } = require("express-validator");
const config = require("./config/config");
const chain = require("./chain");
const getKeys = require("./kms");
const port = config.port;
const chainName = config.chain;


const middleware = [
  bodyParser.json(),
  bodyParser.urlencoded({ extended: true }),
  check(),
];

app.use(middleware);

app.get("/", (req, res) => {
  res.send("live");
});

app.get("/create_account", async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    //res.setTimeout(3000)
    let datos = await chain.createAccount();
    return res.status(200).send(datos);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

const sendCheck = [
  check("sender_kms_key").exists().trim().escape(),
  check("receiver_kms_key").exists().trim().escape(),
  check("amount").exists().trim().escape(),
  check("asset").exists().trim().escape(),
];

app.post("/send", sendCheck, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    //res.setTimeout(3000)
    const { amount, asset, receiver_kms_key, sender_kms_key } = req.body;
    const kmsKeys = await getKeys(sender_kms_key.toString());
    const receiverKeys = await getKeys(receiver_kms_key.toString());
    const secret = kmsKeys["keys"][chainName]["private_key"];
    const to =
      receiverKeys["keys"][chainName]["public_key"] ||
      receiverKeys["keys"][chainName]["address"];
    const from =
      kmsKeys["keys"][chainName]["public_key"] ||
      kmsKeys["keys"][chainName]["address"];

    const resp = await chain.send(to, amount, asset, secret, from);
    return res.status(200).send({ hash: resp });
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
});

app.get("/fees/:chain", async (req, res) => {
  const _chainName = req.params.chain;

  // Validate params
  const isStellar = _chainName === "stellar";
  const isBinance = _chainName === "binance";

  if (isStellar || isBinance) {
    try {
      const networkFees = await chain.fee();
      res.status(200).send({ airprotocolFee: 0.001, _chainName, networkFees });
    } catch (e) {
      res.status(500).send(e.message);
    }
  } else {
    res.status(400).send("Chain not found");
  }
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));
