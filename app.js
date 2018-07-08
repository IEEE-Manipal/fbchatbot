'use strict';
const PAGE_ACCESS_TOKEN = "EAADQjWZBVSGUBABqQErKICexF47WMjX3CT1Ekp7LMZAm9oudHOjx8xqrjUHcWhxZBguXUZCjmEJzGuejN3Y5w8czhZAnrK1KkQWz8MuFP4wzz3vC3DiQiKZAzkTtxTkiGUbXLEBj403X4re0zTfytEFTUvC17ZBgOJwvrhYVzfnDvvPcCGNNgP8";
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
    res.status(403).send("Verification Token Mismatch");
  }
});

/* Handling all messenges */
app.post('/webhook', (req, res) => {
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
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