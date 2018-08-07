'use strict';
const PAGE_ACCESS_TOKEN = "EAADQjWZBVSGUBAALZCFXVfNP7YZCp9haYt2zBVCrOKOdj3fQwCVqiDahfOQXez6DShZA3J7UeEaYnU9Aldi2rCRfXtZCZAs9LNemghmULHGhXqF9TF06Y5x8LMEPXnEGUMusD1l4CRbQrKhJJldds2ZCWhbPTECN3PJzMu9hGuzmAZDZD";
const APIAI_TOKEN = "8103a2d936e84c66a402e331d4c824c6";

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const apiai = require('apiai');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening', server.address().port, app.settings.env);
});

const apiaiApp = apiai(APIAI_TOKEN);

app.get('/', (req, res) => {
  res.status(200).send('Hello from IEEE-SBM!');
})

/* For Facebook Validation */
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'verify_bot_token') {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});

/* Handling all messenges */
app.post('/webhook', (req, res) => {
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          console.log(event);
          receivedMessage(event);
        }
      });
    });
    res.status(200).end();
  }
});

/* GET query from API.ai */

function receivedMessage(event) {
  let sender = event.sender.id;
  let text = event.message.text;

  let apiai = apiaiApp.textRequest(text, {
    sessionId: 'tabby_cat'
  });

  apiai.on('response', (response) => {
    let aiText = response.result.fulfillment.speech;
    console.log(aiText);
    prepareSendAiMessage(sender, aiText);
  });

  apiai.on('error', (error) => {
    console.log(error);
  });

  apiai.end();
}

function sendMessage(messageData) {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: messageData
  }, (error, response) => {
    if (error) {
        console.log('Error sending message: ', error);
    } else if (response.body.error) {
        console.log('Error: ', response.body.error);
    }
  });
}

function prepareSendAiMessage(sender, aiText) {
  let messageData = {
    recipient: {id: sender},
    message: {text: aiText}
  };
  sendMessage(messageData);
}