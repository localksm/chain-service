const EventEmitter = require("events");
const Sequelize = require("sequelize");
const fetch = require("node-fetch");
const chain = require("./chain");
const getKeys = require("./kms");

class RemittancesPoller extends EventEmitter {
  /**
   * @param {int} timeout how long should we wait after the poll started?
   */
  constructor(timeout = 180000) {
    super();

    this.timeout = timeout;
    this.db = new Sequelize(
      process.env.POSTGRES_DB,
      process.env.POSTGRES_USER,
      process.env.POSTGRES_PASS,
      {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        dialect: "postgres",

        pool: {
          max: 5,
          min: 0,
          idle: 10000,
        },
      }
    );
  }

  poll = () => {
    setTimeout(() => this.emit("poll"), this.timeout);
  };

  onPoll = (cb) => {
    this.on("poll", cb);
  };

  processScheduledRemittances = async () => {
    console.log("Processing scheduled remittances");
    try {
      // 1. Get all scheduled remittances
      const scheduledRemittances = await this.__getScheduledRemittances();
      let receivers = scheduledRemittances.map(({ email }) => `'${email}'`);

      // 2. Get the remittance to be sent
      const remittances = await this.__getRemittancesTxData(receivers);

      // 3. Send tx
      await this.__sendRemittance(remittances);
    } catch (e) {
      throw new Error(`Process failed: ${e}`);
    }
  };

  __sendRemittance = async (remittances) => {
    remittances.forEach(async ({ remittance }) => {
      const receiverKmsKey = remittance.receiverData.kms_key;
      const senderKmsKey = remittance.makerData.kms_key;
      try {
        const senderKeys = await getKeys(senderKmsKey);
        const receiverKeys = await getKeys(receiverKmsKey);


        const secret =
          senderKeys["keys"][
            "celo"
          ]["private_key"];

        const fromAddress = senderKeys["keys"][
          "celo"
        ]["public_key"];
        const to =
          receiverKeys["keys"][
            "celo"
          ]["public_key"];

          // Send transaction
          await chain.send(
          to,
          remittance.requestAmount,
          remittance.requestAsset,
          secret,
          fromAddress
        );

        /*const secret =
          senderKeys["keys"][
            remittance.requestAsset === "native" ? "stellar" : "binance"
          ]["private_key"];
        const to =
          receiverKeys["keys"][
            remittance.requestAsset === "native" ? "stellar" : "binance"
          ]["public_key"];

          // Send transaction
          await chain.send(
          to,
          remittance.requestAmount,
          remittance.requestAsset,
          secret
        );*/
        remittance["success"] = "sent";

        // Insert remittance
        await this.__insertRemittance(remittance);

        // Delete remittance from schedule
        await this.__deleteSentRemittanceFromSchedule(remittance.id);

        // Send email notifiaction
        await this.__sendEmailNotification({
          name: remittance.receiverData.name,
          emailMaker: remittance.makerData.email,
          emailReceiver: remittance.receiverData.email,
          amount: remittance.requestAmount,
          date: new Date(Date.now()),
        });
      } catch (e) {
        console.log(e);
        remittance["success"] = "failed";

        //await this.__insertRemittance(remittance);
      }
    });
  };

  __getScheduledRemittances = async () => {
    const transaction = await this.db.transaction();
    try {
      const query = await this.db.query(
        `
                  SELECT
                    distinct sr.remittance_receiver_email as email
                  FROM platform.scheduled_remittances sr;
              `,
        { transaction }
      );

      await transaction.commit();
      return query[1].rows;
    } catch (e) {
      await transaction.rollback();
      throw new Error(e);
    }
  };

  __getRemittancesTxData = async (emails) => {
    const transaction = await this.db.transaction();
    try {
      const query = await this.db.query(
        `
            select * from f_get_remittance_data(array[${emails}]);
        `,
        { transaction }
      );

      await transaction.commit();
      return query[1].rows.filter(({ remittance }) => remittance !== null);
    } catch (e) {
      await transaction.rollback();
      throw new Error(e);
    }
  };

  __insertRemittance = async (remittance) => {
    const transaction = await this.db.transaction();
    try {
      const query = await this.db.query(
        `
           INSERT INTO platform.remittances (
            "from",
            "to",
            asset,
            success,
            amount,
            proposal_id
           ) VALUES (
            ${remittance.makerData.id},
            '${remittance.receiverData.id}',
            '${remittance.requestAsset}',
            '${remittance.success}',
            ${remittance.requestAmount},
            ${remittance.proposalId}
           );
        `,
        { transaction }
      );

      await transaction.commit();
      return query;
    } catch (e) {
      await transaction.rollback();
      throw new Error(e);
    }
  };

  __sendEmailNotification = async (data) => {
    try {
      const aux = await fetch(
        "http://\"\":3000/api/user/receivedRemittance",
        {
          method: "post",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" },
        }
      );
      const res = await aux.json();

      return res;
    } catch (e) {
      return {
        success: false,
        error: e.message,
      };
    }
  };

  __deleteSentRemittanceFromSchedule = async (id) => {
    const transaction = await this.db.transaction();
    try {
      const query = await this.db.query(
        `
           DELETE FROM platform.scheduled_remittances WHERE id=${id};
        `,
        { transaction }
      );

      await transaction.commit();
      return query;
    } catch (e) {
      await transaction.rollback();
      throw new Error(e);
    }
  };
}

module.exports = RemittancesPoller;
