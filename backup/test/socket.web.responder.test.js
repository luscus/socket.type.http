var service = {
      probe: {
        name: 'http.receiver.test'
      },
      logger: {
        warning: console.log
      }
    },
    Socket = require('../lib/com.timocom.service.socket.web')(service);


var socketConfig = {
  "name": "sender",
  "type": "web",
  "pattern": "rep",
  "port": 44444
};

// curl -X POST -H "Content-Type: application/json" -d "{\"test\":42}" http://localhost:44444
var socket = Socket.instanciate(socketConfig);
