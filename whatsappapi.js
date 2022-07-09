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
    const msg_body = messages[0].text.body;
    const from = messages[0].from;
    return await handleMessage(from, msg_body);
}

async function handleButtonMessage(messages) {
    const msg_body = messages[0].button.payload;
    const from = messages[0].from;
    return await handleMessage(from, msg_body);
}

async function handleMediaMessage(messages) {
    const type = messages[0].type;
    const content = messages[0][type];
    const from = messages[0].from;
    const mediaInfo = await getMediaURL(content);
    const fileDownloadResponse = await downloadFile({...content, ...mediaInfo.data, from});
    console.log("Message Type ", type);
    console.log("fileDownloadResponse ", JSON.stringify(fileDownloadResponse));
    let conversion = getUserConversion(from);
    if (fileDownloadResponse.fileDownloaded) {
        conversion.msgs.push(`${fileDownloadResponse.name}.${fileDownloadResponse.ext} downloaded`);
    } else {
        conversion.msgs.push(`${fileDownloadResponse.name}.${fileDownloadResponse.ext} not downloaded`);
    }
    // if (fileDownloadResponse.fileDownloaded) {
    //     const fileUploadResponse = await whatsappAPI.uploadFileToBeSent(fileDownloadResponse);
    //     if (fileUploadResponse.status === 200) {
    //         const response = await whatsappAPI.sendMessage(from, fileUploadResponse.data.id, 'image');
    //     } else {
    //         const response = await whatsappAPI.sendMessage(from, "We ran into some error while downloading file, please send it again.");
    //     }
    // } else {
    //     const response = await whatsappAPI.sendMessage(from, "We ran into some error while downloading file, please send it again.");
    // }
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
  getFileName(mediaInfo);
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
        resolve({...mediaInfo, fileDownloaded: true, filePath: path});
    });
    writer.on('error', function(){
      resolve({...mediaInfo, fileDownloaded: false, filePath: path});
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

function emptyDataFolder() {
    const dataFolder = Path.resolve(__dirname, 'data');
    try {
        if (Fs.existsSync(dataFolder)) {
            Fs.unlinkSync(dataFolder);
            Fs.mkdirSync(dataFolder, { recursive: true });
        }
        console.log("data folder created");
    } catch(error) {
        console.log("error in emptyDataFolder", error);
    }
}

module.exports = {handleTextMessage, handleButtonMessage, handleMediaMessage, emptyDataFolder};
