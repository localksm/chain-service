// If you need more information about configurations or implementing the sample code, visit the AWS docs:
// https://aws.amazon.com/developers/getting-started/nodejs/

/**
 * Once we decrypt and validate our token we can get the kms_key and pass it as argument to the getKeys function
 * e.g getKeys("83c996aa8a8c55bc33a1db8cc0c8563ef4cc3395497e34225df472a07ea46994")
 * if evrything is ok this will return:
 * {
 *   ARN: 'arn:aws:secretsmanager:us-east-2:843736317724:secret:83c996aa8a8c55bc33a1db8cc0c8563ef4cc3395497e34225df472a07ea46994-AaVB5h',
 *   Name: '83c996aa8a8c55bc33a1db8cc0c8563ef4cc3395497e34225df472a07ea46994',
 *   VersionId: '59222294-a4c9-4f69-96c7-e41f904e7488',
 *   SecretString: '{"keys": {"stellar": {"public_key": "GBMGX3BON6WKKQRV6U656WP6EFMYE3WJJNPGDRX53W5GUKLMDB3UTIF7", "private_key": "SCCMFU3HZYNK7257ZESVGMND6GIWTZMRLGOAGTJ2NRNIOFT67ZY5SLIV"}, "mesh": {"public_key": "04772220de4fbcd8779382fc76a1e4002d0cf7b60bb6cbc03ec602c725d2fc6bc266103358620bd7e48e7d931c3e76d6f40116fe92279ed89ed6e706d4ba00a014", "private_key": "8b3bed3e7daf3301f7b36852d8c170d54f3878f9a56e1fba11c3b3dcc8ab9d8a"}}, "owner": 3}',
 *   VersionStages: [ 'AWSCURRENT' ],
 *   CreatedDate: 2020-02-19T05:55:21.105Z
 * }
 */

// Load the AWS SDK
let AWS = require("aws-sdk"),
  region = "us-east-2"
const config = require('./config/config')

async function getKeys(secretName) {
  // Create a Secrets Manager client
  let client = new AWS.SecretsManager({
    region: region,
    accessKeyId: config.awsAccessKey, //credentials for your IAM user ... should be in an .env file
    secretAccessKey: config.awsSecretKey
  })

  let keys

  // In this sample we only handle the specific exceptions for the 'GetSecretValue' API.
  // See https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
  // We rethrow the exception by default.
  const res = await client.getSecretValue({ SecretId: secretName }).promise()

  return JSON.parse(res.SecretString)
}

module.exports = getKeys
