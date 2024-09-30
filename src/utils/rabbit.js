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
    console.log('Initializing RabbitMQ');

    await attemptConnection();

    connection.createChannel((error, channelObj) => {
      if (error) {
        console.error('Error creating channel: ', error);
        throw error;
      }

      channel = channelObj
      console.log('Created channel');
    }
)};


const sendGenerateThumbnailMessage = (bucketName, key) => {
    console.log('Sending Generate Thumbnail Message');

    const message = {
        bucketName: bucketName,
        key: key
    }

    channel.sendToQueue('generateThumbnail', Buffer.from(JSON.stringify(message)), (error) => {
        if (error) {
            console.error('Error publishing Generate Thumbnail Message: ', error);
            throw error;
        }

        console.log('Published Generate Thumbnail Message');
    })
};

const sendDeleteThumbnailMessage = (bucketName, key) => {
    console.log('Sending Delete Thumbnail Message');

    const message = {
        bucketName: bucketName,
        key: key
    }

    channel.sendToQueue('deleteThumbnail', Buffer.from(JSON.stringify(message)))
};

module.exports = rabbit = {
    connect: attemptConnection,
    initialize: initialize,
    sendGenerateThumbnailMessage: sendGenerateThumbnailMessage,
    sendDeleteThumbnailMessage: sendDeleteThumbnailMessage
}