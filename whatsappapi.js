const axios = require('axios').default;
const moment = require('moment');
const config = require('./config.json');
const Fs = require('fs')
const Path = require('path')
const FormData = require('form-data');


async function sendMessage(to, msg_body, type) {
    const data = {
        recipient_type: "individual",
        messaging_product: config.messaging_product,
        to
    };
    if (type) {
        data.type = type;
        data[type] = { id: msg_body, caption: 'ack' }
    } else {
        data.text = {body: 'ack : ' + msg_body}
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
  let path = Path.resolve(__dirname, 'data', `${mediaInfo.name}.${mediaInfo.ext}`);
  while (Fs.existsSync(path)) {
    console.log(moment().format('YYYYMMDD_hhmmss'));
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
  return new Promise((resolve, reject) => {
    writer.on('finish', function(){
        resolve({...mediaInfo, fileDownloaded: true});
    })
    writer.on('error', function(){
      resolve({...mediaInfo, fileDownloaded: false});
    })
  })
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
module.exports = {sendMessage, getMediaURL, downloadFile, uploadFileToBeSent};
