const amqp = require('amqplib/callback_api');

const initialize = async () => {
    console.log('Initializing RabbitMQ');

    amqp.connect('amqp://localhost', (error, connection) => {
      if (error) {
        console.error('Error connecting to RabbitMQ: ', error);
        throw error;
      }

      console.log('Connected to RabbitMQ');
      connection.createChannel((error, channel) => {
        if (error) {
          console.error('Error creating channel: ', error);
          throw error;
        }

        console.log('Channel created');
        channel.assertQueue('thumbnailer', {
          durable: true,
          arguments: {
            'single-active-consumer': true
          }
        });

        channel.sendToQueue('thumbnailer', Buffer.from('generate thumbnail'));
      });
    })

};

module.exports = rabbit = {
    initialize: initialize
}