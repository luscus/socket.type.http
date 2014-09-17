// testing
var Socket = require('../../service.lib.socket/lib/Socket'),
    httpLib = require('../lib/socket.type.http'),
    service = {
      name: 'httpTest'
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
      port: 22000
    };



var socket = new Socket(client);

httpLib(socket);

socket.on('message', function (data, clusterSource) {
  console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
  console.log('response: ', data);
});

socket.connect(server.protocol+'://localhost:'+server.port);
//socket.connect(server.protocol+'://localhost:'+22001);

setInterval(function () {
  socket.send({timestamp: new Date().toISOString()})
}, 1000);
