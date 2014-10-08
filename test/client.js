// testing
var Socket = require('../../service.lib.socket/lib/Socket'),
    httpLib = require('../lib/socket.type.http'),
    service = {
      name: 'httpTest'
    },
    client = {
      name: 'client',
      type: 'http',
      timeout: 2000,
      pattern: 'requester'
    },
    server = {
      name: 'server',
      type: 'http',
      pattern: 'responder',
      portRange: [22000, 22001]
    };



var socket = new Socket(client);

httpLib(socket);

console.log(socket);

socket.on('message', function (data, clusterSource) {
  console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
  console.log('response: ', data);
});

socket.on('connected', function (url) {
  console.log('++++++++++++++++++++++++++++++++++++++');
  console.log('connected: ', url);
});

socket.on('disconnected', function (url) {
  console.log('--------------------------------------');
  console.log('disconnected: ', url);
});

socket.on('pool_update', function (url, status) {
  console.log('pool: ', this.pool);
});

socket.connect(server);
//socket.connect(server.protocol+'://localhost:'+22001);

setInterval(function () {
  socket.send({non_ascii: 'äöß', timestamp: new Date().toISOString()})
}, 1000);
