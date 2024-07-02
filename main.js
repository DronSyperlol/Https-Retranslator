const axios = require('axios');
const https = require('https');
const fs = require('fs');

const host = '0.0.0.0';
const port = 3129;

const server = https
    .createServer(
        {
            key: fs.readFileSync('./cert/key.pem'),
            cert: fs.readFileSync('./cert/cert.pem'),
        },
        connectionHandler
    )
    .listen(port, host, function () {
        console.log(
            `Server listens https://${host}:${port}`
        );
    });


function connectionHandler(request, result) {
    var requestData = '';
    request.on('data', (chunk) => {
        requestData += chunk;
    });
    request.on('end', () => {
        console.log(`Request from ${request.socket.remoteAddress} : ${requestData.length > 0 ? requestData : "<empty>"}`);
        routing(requestData).then((responseData) => {
            console.debug(`Routing ended`);
            result.end(responseData);
        }).catch((error) => {
            console.log(`Routing error: ${error}`);
            result.statusCode = 500;
            result.end();
        });
    })
}

async function routing(message) {
    try {
        var msg = JSON.parse(message);
    }
    catch {
        return 'Bad data';
    }
    if (!'url' in msg) return 'Missing required field (url)';
    if (!'headers' in msg) return 'Missing required field (headers)';
    if (!msg.url.includes('https://') && !msg.url.includes('http://')) msg.url = "http://" + msg.url;
    try {
        var response = await axios.get(msg.url, {
            headers: msg.headers
        });
    }
    catch (ex) {
        console.error(ex);
        return 'Execute error';
    }
    return typeof response.data == "string" ? response.data : JSON.stringify(response.data);
}