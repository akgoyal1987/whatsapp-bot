const axios = require('axios').default;
const moment = require('moment');
const config = require('./config.json');
const Fs = require('fs')
const Path = require('path')
const FormData = require('form-data');
const conversions = {};


function getUserConversion(mobileNo) {
    if (!conversions[mobileNo]) {
        conversions[mobileNo] = {
            state : 'initial',
            msgs : []
        }
    }
    return conversions[mobileNo];
}

function updateConversionState(conversion, message) {
    conversion.msgs.push(message);
    conversion.state = config.stateReplyMessages[conversion.state].next;
}


async function handleTextMessage(messages) {
    let msg_body = messages[0].text.body;
    let from = messages[0].from;
    return await handleMessage(from, msg_body);
}

async function handleButtonMessage(messages) {
    let msg_body = messages[0].button.payload;
    let from = messages[0].from;
    return await handleMessage(from, msg_body);
}

async function handleDocumentMessage(messages) {
    let msg_body = messages[0].text.body;
    let from = messages[0].from;
}

async function handleImageMessage(messages) {
    let msg_body = messages[0].text.body;
    let from = messages[0].from;
}

async function handleMessage(from, messages) {
    let conversion = getUserConversion(from);
    let stateReply = config.stateReplyMessages[conversion.state];
    try {
        if (conversion.state === 'completed') {
            return await sendMessage(from, 'Thank you for contacting us again!', 'text');
        } else {
            updateConversionState(conversion, messages);
            let response = await sendMessage(from, stateReply.message, stateReply.type);
            if (conversion.state === 'completed') {
                let res = await sendMessage(from, JSON.stringify(conversion.msgs), 'text');
            }
            return response;
        }
    } catch (error) {
        console.log(error);
        return
    }
}

async function sendMessage(to, msg, type, parameters) {
    const data = {
        // recipient_type: "individual",
        messaging_product: config.messaging_product,
        to
    };
    if (type !== 'text') {
        data.type = type;
        if (type === 'template') {
            data[type] = {
                name: msg,
                language: {
                    code: 'en_US'
                },
                "components": [{
                    "type": "body",
                    "parameters": parameters
                }]
            };
        } else {
            data[type] = { id: msg, caption: '' }
        }
    } else {
        data.text = {body: msg}
    }
    return axios({
        method: 'POST',
        url: `${config.graphAPIBaseURL}/${config.graphAPIVersion}/${config.phone_number_id}/${config.messageEndPoint}`,
        data: data,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': config.authorization
        }
    });
}

async function getMediaURL(attachmentInfo) {
    // console.log({attachmentInfo});
    return axios({
        method: 'GET',
        url: `${config.graphAPIBaseURL}/${config.graphAPIVersion}/${attachmentInfo.id}`,
        headers: {
            'Authorization': config.authorization
        }
    });
}

async function downloadFile(mediaInfo) {
  mediaInfo = getFileName(mediaInfo);
  const userFolderPath = Path.resolve(__dirname, 'data', mediaInfo.from);
  if (!Fs.existsSync(userFolderPath)) {
    Fs.mkdirSync(userFolderPath, { recursive: true });
  }
  let path = Path.resolve(userFolderPath, `${mediaInfo.name}.${mediaInfo.ext}`);
  while (Fs.existsSync(path)) {
    mediaInfo.name = `${mediaInfo.name}_${moment().format('YYYYMMDD_HHMMss')}`;
    path = Path.resolve(__dirname, 'data', `${mediaInfo.name}.${mediaInfo.ext}`);
  }
  const writer = Fs.createWriteStream(path);
  const response = await axios({
    method: 'GET',
    url: mediaInfo.url,
    responseType: 'stream',
    headers: {
        'Authorization': config.authorization
    }
  });
  response.data.pipe(writer);
  let result = await new Promise((resolve, reject) => {
    writer.on('finish', function(){
        resolve({...mediaInfo, fileDownloaded: true});
    });
    writer.on('error', function(){
      resolve({...mediaInfo, fileDownloaded: false});
    });
  })
  return result;
}

function getFileName(mediaInfo) {
    if (mediaInfo.filename) {
        const nameParts = mediaInfo.filename.split('.');
        if (nameParts.length > 0) {
            mediaInfo.ext = nameParts.pop();
        }
        mediaInfo.name = nameParts.join('.');
    } else if (mediaInfo.mime_type === 'image/jpeg') {
        mediaInfo.name = mediaInfo.id;
        mediaInfo.ext = 'jpg';
    }
    return mediaInfo;
}

async function uploadFileToBeSent(mediaInfo) {
    const path = Path.resolve(__dirname, 'data', `${mediaInfo.name}.${mediaInfo.ext}`);
    const form = new FormData();
    const file = Fs.readFileSync(path);
    form.append(`file`, file, path);
    form.append('messaging_product', 'whatsapp');
    // When using axios in Node.js, you need to set the Content-Type header with the form boundary
    // by using the form's `getHeaders()` method
    const url = `${config.graphAPIBaseURL}/${config.graphAPIVersion}/${config.phone_number_id}/${config.mediaEndPoint}`;
    const response = await axios.post(url, form, {
        headers: {
            ...form.getHeaders(),
            'Authorization': config.authorization
        },
    });
    // console.log(response);
    return response;
}
module.exports = {handleTextMessage, handleButtonMessage, handleDocumentMessage, handleImageMessage, sendMessage, getMediaURL, downloadFile, uploadFileToBeSent, handleMessage};
