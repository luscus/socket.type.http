(function() {

  var bidirectional,
      receiver,
      sender;

  function instanciate (socketConfig) {
    socketConfig.protocol = (socketConfig.pattern === 'ws') ? 'ws' : socketConfig.protocol;

    socketConfig.protocol = socketConfig.protocol || 'http';
    socketConfig.host     = socketConfig.host || 'localhost';

    switch (socketConfig.pattern) {
      case 'req':
        return sender.instanciate(socketConfig);

      case 'rep':
        return receiver.instanciate(socketConfig);

      case 'ws':
        return bidirectional.instanciate(socketConfig);

      default:
        throw new Error('HTTP sockets do not support following pattern: ' + socketConfig.pattern);
    }
  }



  function getUrl (socketConfig) {
    socketConfig.protocol = socketConfig.protocol || 'http';
    socketConfig.host     = socketConfig.host || 'localhost';

    return socketConfig.protocol + '://' + socketConfig.host + ':' + socketConfig.port;
  }


  module.exports = function (serviceObject) {
    service = serviceObject;

    bidirectional = require ('./types/bidirectional')(service);
    receiver = require ('./types/receiver')(service);
    sender = require ('./types/sender')(service);

    return {
      instanciate: function (socketConfig) {
        return instanciate(socketConfig);
      },
      getUrl: function (socketConfig) {
        return getUrl(socketConfig);
      }
    };
  };
}).call(this);
