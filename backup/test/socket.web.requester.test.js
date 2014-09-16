var service = {
      probe: {
        name: 'http.sender.test'
      },
      logger: {
        warning: console.log
      }
    },
    Socket = require('../lib/com.timocom.service.socket.web')(service);

/* Start http.receiver.test.js in an other window */
var socketConfig = {
  "type": "web",
  "pattern": "req",
  "targets": ['http://localhost:44444']
};


var data = {
  test: 'my little test'
};


// curl -X POST -H "Content-Type: application/json" -d "{\"test\":42}" http://localhost:44444
var socket = Socket.instanciate(socketConfig);

socket.send(data);
setInterval(function () {
  data.timestamp = new Date();

  socket.send(data);
  process.exit();
}, 1000);
