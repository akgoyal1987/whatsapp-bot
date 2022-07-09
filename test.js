const axios = require('axios').default;
const Fs = require("fs");
const Path = require("path");

const options = {
    method: 'POST',
    url: 'https://qrcode-monkey.p.rapidapi.com/qr/custom',
    headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Host': 'qrcode-monkey.p.rapidapi.com',
        'X-RapidAPI-Key': 'c74e00b85amsh7e3bed95391d602p1e7298jsn9f65e7cbd0d9'
    },
    data: `{
        "data": "https://www.qrcode-monkey.com",
        "config":{
            "body":"dot",
            "eye":"frame2",
            "bodyColor":"#516079",
            "bgColor":"#FFFFFF",
            "eye1Color":"#516079",
            "eye2Color":"#516079",
            "eye3Color":"#516079",
            "logo":"https://i.iconlookup.com/app/images/qrlg1.png",
            "logoMode":"clean"
        },
        "size": 300,
        "download": false,
        "file": "png"
    }`
};

async function downloadImageAndCreateBase64String() {
    let path = Path.resolve(__dirname, 'qr-money', `qrmoney-logo.png`);
    let response = await axios({...options, responseType: 'arraybuffer'});
    let returnedB64 = Buffer.from(response.data).toString('base64');
    let data = "data:" + response.headers["content-type"] + ";base64," + returnedB64;
    console.log(data);
}
function downloadImageAndCreateBase64StringSync() {
    let path = Path.resolve(__dirname, 'qr-money', `qrmoney-logo.png`);
    axios({...options, responseType: 'arraybuffer'}).then(response => {
        let returnedB64 = Buffer.from(response.data).toString('base64');
        let data = "data:" + response.headers["content-type"] + ";base64," + returnedB64;
        console.log(data);
    });
}
async function downloadImage() {
    let path = Path.resolve(__dirname, 'qr-money', `qrmoney-logo.png`);
    let response = await axios({...options, responseType: 'stream'});
    const writer = Fs.createWriteStream(path);
    response.data.pipe(writer);
    writer.on('finish', function(){
        writer.close();
        console.log({fileDownloaded: true});
    })
    writer.on('error', function(){
        writer.close();
        console.log({fileDownloaded: false});
    })
}

downloadImageAndCreateBase64StringSync();
