var sockets;

function resolvePattern (config) {

  switch (config.pattern) {
    case 'responder':
      return 'rep';

    case 'requester':
      return 'req';
  }
}


function resolveSocketUrl (socketConfig, targetHost) {
  socketConfig.host = socketConfig.host || '0.0.0.0';

  var protocol = socketConfig.protocol;

  switch (protocol) {
    case 'tcp':
      var port = (socketConfig.port) ? ':' + socketConfig.port : '';

      return targetHost || protocol + '://' + socketConfig.host + port;

    case 'inproc':

    default:
      throw new Error('ZMQ protocol "'+protocol+'" is unknown');
  }
}



module.exports = {
  resolvePattern: function (config) {
    return resolvePattern(config);
  },
  resolveSocketUrl: function (socketConfig) {
    return resolveSocketUrl(socketConfig);
  }
};
