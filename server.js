const express = require('express');
const bodyParser = require('body-parser');
const whatsappAPI = require('./whatsappapi');
const config = require('./config.json');
const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())
app.use(express.static(__dirname + '/public'));

const whatsapp = require('./src/whatsapp-routes');
app.use("/webhook", whatsapp);
app.get("/", function (request, response) {
    response.send('Simple WhatsApp Webhook tester</br>There is no front-end, see server.js for implementation!');
});

app.get('*', function(req, res) {
    res.sendStatus(404);
})

const listener = app.listen(process.env.PORT || 3000, function () {
    console.log('Your app is listening on port ' + listener.address().port);
    whatsappAPI.emptyDataFolder();
});
