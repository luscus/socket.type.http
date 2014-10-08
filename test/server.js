// testing
var Socket = require('../../service.lib.socket/lib/Socket'),
    zmqLib = require('../lib/socket.type.http'),
    service = {
      name: 'httpTest'
    },
    server = {
      name: 'server',
      type: 'http',
      pattern: 'responder',
      portRange: [22000, 22001]
    };



var socket = new Socket(server),
    responseCount = 0,
    maxResponse   = Math.floor(Math.random()*10);

socket.on('listen', function (url) {
  console.log('Process "' + process.pid + '" listening on ' + url + '\nmaxResponse = ' + maxResponse);
})

zmqLib(socket);


socket.bind(function (data, meta, raw) {
        //console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
        //console.log('raw: ', raw);
        //console.log('meta: ', meta);
        //console.log('data: ', data);

//   if (responseCount > maxResponse) {
//     console.log('KILLING PROCESS to simulate failure');
//     process.exit();
//   }

  if (data.target.replace('localhost', '*') !== socket.listener.url) {
    console.log('responding for disconnected server '+data.target);
  }

  data.responseTime = new Date().toISOString();
  data.responder = socket.listener.url;

  responseCount += 1;
  return data;
});
