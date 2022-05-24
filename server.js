const express = require('express');
const bodyParser = require('body-parser');
const whatsappAPI = require('./whatsappapi');
const config = require('./config.json');
const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())

app.get("/", function (request, response) {
    response.send('Simple WhatsApp Webhook tester</br>There is no front-end, see server.js for implementation!');
});

app.post("/webhook", async function (req, res) {
    // console.log(req.body.entry[0].changes[0].value.messages);
    if (req.body.object) {
        if (req.body.entry && req.body.entry[0].changes && req.body.entry[0].changes[0].value.messages && req.body.entry[0].changes[0].value.messages[0]) {
            let from = req.body.entry[0].changes[0].value.messages[0].from;
            let msg_body = '';
            if (req.body.entry[0].changes[0].value.messages[0].type === 'text') {
                msg_body = req.body.entry[0].changes[0].value.messages[0].text.body;
                const response = await whatsappAPI.sendMessage(from, msg_body);
            } else {
                msg_body = req.body.entry[0].changes[0].value.messages[0][req.body.entry[0].changes[0].value.messages[0].type];
                const mediaInfo = await whatsappAPI.getMediaURL(msg_body);
                const fileDownloadResponse = await whatsappAPI.downloadFile({...msg_body, ...mediaInfo.data});
                if (fileDownloadResponse.fileDownloaded) {
                    const fileUploadResponse = await whatsappAPI.uploadFileToBeSent(fileDownloadResponse);
                    if (fileUploadResponse.status === 200) {
                        const response = await whatsappAPI.sendMessage(from, fileUploadResponse.data.id, 'image');
                    } else {
                        const response = await whatsappAPI.sendMessage(from, "We ran into some error while downloading file, please send it again.");
                    }
                } else {
                    const response = await whatsappAPI.sendMessage(from, "We ran into some error while downloading file, please send it again.");
                }
                // console.log({fileDownloadResponse, mediaInfo: mediaInfo.data, type: req.body.entry[0].changes[0].value.messages[0].type});
            }
            // console.log({response});
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(400);
    }
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
        if (mode === "subscribe" && token === config.verify_token) {
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

app.get('*', function(req, res) {
    res.sendStatus(404);
})

const listener = app.listen(process.env.PORT || 3000, function () {
    console.log('Your app is listening on port ' + listener.address().port);
});
