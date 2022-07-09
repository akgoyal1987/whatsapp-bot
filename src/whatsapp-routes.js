const express = require('express');
const whatsappAPI = require("../whatsappapi");
const config = require("../config.json");
const router = express.Router();

router.get('/', async (req, res) => {
    console.log("webhook get req");
    // Parse params from the webhook verification req
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];
    if (mode && token) {
        if (mode === "subscribe" && token === config.verify_token) {
            console.log("WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(403);
    }
})

router.post('/', async (req, res) => {
    if (req.body.object) {
        if (req.body.entry && req.body.entry[0].changes && req.body.entry[0].changes[0].value.messages && req.body.entry[0].changes[0].value.messages[0]) {
            let msgType = req.body.entry[0].changes[0].value.messages[0].type;
            try {
                if (msgType === 'text') {
                    await whatsappAPI.handleTextMessage(req.body.entry[0].changes[0].value.messages);
                } else if (msgType === 'button') {
                    await whatsappAPI.handleButtonMessage(req.body.entry[0].changes[0].value.messages);
                }  else if (msgType === 'document' || msgType === 'image') {
                    await whatsappAPI.handleMediaMessage(req.body.entry[0].changes[0].value.messages);
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
