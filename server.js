const express = require('express');
const bodyParser = require('body-parser');

const verify_token = 'blue_panda';
const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())

app.get("/", function (request, response) {
    response.send('Simple WhatsApp Webhook tester</br>There is no front-end, see server.js for implementation!');
});

app.post("/webhook", function (request, response) {
    console.log('Incoming webhook: ' + JSON.stringify(request.body));
    console.log(JSON.stringify(request.body));
    response.sendStatus(200);
});

app.get("/webhook", function (request, response) {
    console.log("webhook get request");
    // Parse params from the webhook verification request
    let mode = request.query["hub.mode"];
    let token = request.query["hub.verify_token"];
    let challenge = request.query["hub.challenge"];

    // Check if a token and mode were sent
    if (mode && token) {
        // Check the mode and token sent are correct
        if (mode === "subscribe" && token === verify_token) {
            // Respond with 200 OK and challenge token from the request
            console.log("WEBHOOK_VERIFIED");
            response.status(200).send(challenge);
        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            response.sendStatus(403);
        }
    } else {
        response.sendStatus(403);
    }
});

var listener = app.listen(process.env.PORT || 3000, function () {
    console.log('Your app is listening on port ' + listener.address().port);
});
