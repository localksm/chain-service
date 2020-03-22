//TODO make a separate config file for the consumer
//In production set addresses to externally available ip
const argv = require('yargs').argv

const hostConfig = {
    port: argv.port || 3000,
    chain: argv.chain || 'stellar',
    network: argv.network || 'testnet',
    awsRegion: argv.region,
    kmsKeyID: argv.kmsKeyID,
    awsAccessKey: argv.awsAccessKey,
    awsSecretKey: argv.awsSecretKey,
    stellarFundingAccount: argv.stellarAccount
}
module.exports = hostConfig
