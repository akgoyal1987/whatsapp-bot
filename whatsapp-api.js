const axios = require('axios').default;
const config = require('./config.json');
const access_token = 'EAAKm1gKWd0IBAPiOB4XTA1qRG8xoLmDedZB3xVrAGrgOCAEaUfnZAmKCnz8l6Y9qm3OZBcn6Sf6RSL1Q7zIZCB1hKRTHSC9BdyNI0It5wpu4IpPB8xVWK23CxDba99QITZBPS7uZAK2faPoHQheT2ygsgTruBki3gvqljoWe9WVk541dTWEi08Smhz957ct1oRHnvUk0yYfZAjG1fl9IazD';
const business_id = 138726015414337;
const phone_number_id = 102664625798707;
const graphAPIBaseURL = 'https://graph.facebook.com/v12.0/';
const messageURL = graphAPIBaseURL+phone_number_id+'/messages?access_token='+access_token;

async function messagesHandler(from, msg_body) {
    return await axios({
        method: 'POST',
        url: `${config.graphAPIBaseURL}/${config.graphAPIVersion}/${config.phone_number_id}/${config.messageEndPoint}?access_token=${config.access_token}`,
        data: {
            messaging_product: config.messaging_product,
            to: from,
            text: { body : 'ack : ' + msg_body}
        },
        headers: {
            'Content-Type': 'application/json'
        }
    });

}

module.exports = {messagesHandler: messagesHandler};
