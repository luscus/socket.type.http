// testing
var Socket = require('../../service.lib.socket/lib/Socket'),
    zmqLib = require('../lib/socket.type.http'),
    service = {
      name: 'zmqTest'
    },
    client = {
      name: 'client',
      type: 'http',
      protocol: 'http',
      pattern: 'requester'
    },
    server = {
      name: 'server',
      type: 'http',
      protocol: 'http',
      pattern: 'responder',
      portRange: [22000, 22001]
    };



var socket = new Socket(server);

socket.on('listen', function (url) {
  console.log('Process "' + process.pid + '" listening on ' + url);
})

zmqLib(socket);

  
  
var responseCount = 0;

socket.bind(function (data, meta, raw) {
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('resquest: ', data);
  
  if (responseCount === 10) {
    process.exit();
  }
  
  responseCount += 1;
  return meta;
});
