const amqp = require('amqplib/callback_api');

let connection;
let channel

const attemptConnection = async (retries = process.env.RABBITMQ_RETRY_CONNECTION_ATTEMPTS, delay = process.env.RABBITMQ_CONNECTION_RETRY_DELAY) => {
  return new Promise((resolve, reject) => {
      amqp.connect(`amqp://${process.env.RABBITMQ_HOST}`, (error, connectionObj) => {
          if (error) {
              if (retries === 0) {
                  return reject(new Error('Error connecting to RabbitMQ: ' + error));
              }
              console.error('Error connecting to RabbitMQ. Retrying...', error);
              setTimeout(() => {
                  attemptConnection(retries - 1, delay).then(resolve).catch(reject);
              }, delay);
          } else {
              console.log('Connected to RabbitMQ');
              connection = connectionObj;
              resolve(connectionObj);
          }
      });
  });
};


const initialize = async () => {
    console.debug('Initializing RabbitMQ');

    await attemptConnection();

    connection.createChannel((error, channelObj) => {
      if (error) {
        console.error('Error creating channel: ', error);
        throw error;
      }

      channel = channelObj
      console.debug('Created channel');
    }
)};


const sendGenerateThumbnailMessage = (bucketName, key) => {
    console.debug('Sending Generate Thumbnail Message');

    channel.sendToQueue('generateThumbnail', Buffer.from(JSON.stringify({ bucketName: bucketName, key: key })), (error) => {
        if (error) {
            console.error('Error publishing Generate Thumbnail Message: ', error);
            throw error;
        }
    })
};

const sendDeleteThumbnailMessage = async (bucketName, key) => {
    console.debug(`Sending Delete Thumbnail Message for Bucket: ${bucketName} and Key: ${key}`);
    await channel.sendToQueue('deleteThumbnail', Buffer.from(JSON.stringify({bucketName: bucketName, key: key })), (error) => {
        if (error) {
            console.error('Error publishing Delete Thumbnail Message: ', error);
            throw error;
        }
    })
};

module.exports = rabbit = {
    connect: attemptConnection,
    initialize: initialize,
    sendGenerateThumbnailMessage: sendGenerateThumbnailMessage,
    sendDeleteThumbnailMessage: sendDeleteThumbnailMessage,
    ping: async () => {
        console.debug('Pinging RabbitMQ');
        await channel.checkQueue('generateThumbnail');
        console.debug('RabbitMQ Ping Successful');
    }
}