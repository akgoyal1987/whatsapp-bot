const express = require('express');
const whatsappAPI = require("../whatsappapi");
const config = require("../config.json");
const router = express.Router();

router.get('/', async (request, response) => {
    console.log("webhook get request");
    // Parse params from the webhook verification request
    let mode = request.query["hub.mode"];
    let token = request.query["hub.verify_token"];
    let challenge = request.query["hub.challenge"];
    if (mode && token) {
        if (mode === "subscribe" && token === config.verify_token) {
            console.log("WEBHOOK_VERIFIED");
            response.status(200).send(challenge);
        } else {
            response.sendStatus(403);
        }
    } else {
        response.sendStatus(403);
    }
})

router.post('/', async (request, response) => {
    if (req.body.object) {
        if (req.body.entry && req.body.entry[0].changes && req.body.entry[0].changes[0].value.messages && req.body.entry[0].changes[0].value.messages[0]) {
            let msgType = req.body.entry[0].changes[0].value.messages[0].type;
            try {
                if (msgType === 'text') {
                    const response = await whatsappAPI.handleTextMessage(req.body.entry[0].changes[0].value.messages);
                } else if (msgType === 'button') {
                    const response = await whatsappAPI.handleButtonMessage(req.body.entry[0].changes[0].value.messages);
                }  else if (msgType === 'document' || msgType === 'image') {
                    const response = await whatsappAPI.handleMediaMessage(req.body.entry[0].changes[0].value.messages);
                }
                res.sendStatus(200);
            } catch (error) {
                console.log(error);
                res.sendStatus(400);
            }
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(400);
    }
})


module.exports = router
