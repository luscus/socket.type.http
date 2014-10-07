// testing
var Socket = require('../../service.lib.socket/lib/Socket'),
    httpLib = require('../lib/socket.type.http'),
    service = {
      name: 'httpTest'
    },
    client = {
      name: 'client',
      type: 'http',
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

console.log(socket);

socket.on('message', function (data, clusterSource) {
  console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
  console.log('response: ', data);
});

socket.on('connected', function (url) {
  console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
  console.log('connected: ', url);
});

socket.on('disconnected', function (url) {
  console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
  console.log('disconnected: ', url);
});

socket.connect('http://localhost:'+server.port);
//socket.connect(server.protocol+'://localhost:'+22001);

setInterval(function () {
  socket.send({non_ascii: 'äöß', timestamp: new Date().toISOString()})
}, 1000);
