var tools = require('./tools'),
    merge = require('node.extend'),
    types = {};

types.client = require('./client');
types.server = require('./server');


module.exports = function (_socket) {
  
  if (_socket.config.type === 'http') {
    // Deep merge of the service and the socket lib template
    merge(true, _socket, types[_socket.config.side]);
  }
};
