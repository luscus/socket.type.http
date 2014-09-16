var auroraConfig = require('com.timocom.aurora.config'),
    bodyParser = require('body-parser'),
    socketIo = require('socket.io'),
    http = require('http'),
    q = require('q'),
    express = require('express'),
    service;


var Socket = function Socket (socketConfig) {
  var _this = this;
  this.status = true;
  this.config = socketConfig;
  this.name = socketConfig.name;

  this.server = http.createServer(express());
  this.socket = socketIo.listen(this.server);

  this.messageHandler = function (data, meta) {
    var message = {
      error: 'YOU HAVE TO IMPLEMENT AN HANDLER FOR THIS RECEIVER SOCKET',
      data: data,
      meta: meta
    };

    return message;
  };
};

Socket.prototype.send = function (data) {
  var type = data.type || 'default';

  this.socket.emit(type, data);
};


Socket.prototype.close = function () {
  this.status = false;
  //this.socket.disconnect();
};

Socket.prototype.setMessageHandler = function (handler) {
  if (typeof handler === 'function') {
    this.messageHandler = handler;
  }
};


function instanciate (socketConfig) {
  var instance = new Socket(socketConfig);

  //   instance.server.use(function(req, res, next) {
  //     var data = '';
  //     req.on('data', function(chunk) {
  //       data += chunk;
  //     });
  //     req.on('end', function() {
  //       req.rawBody = data;
  //     });

  //     next();
  //   });
  //   instance.server.use(bodyParser.json({limit: '50mb'}));
  //   instance.server.use(bodyParser.urlencoded({limit: '50mb'}));
  //   instance.server.use(function(err, request, response, next){
  //     response.writeHead(500, 'Internal Server Error', {'Content-Type': 'application/json'});
  //     response.charset = "utf-8";
  //     response.write(JSON.stringify({error: err.message, stack: err.stack}));
  //     response.end();

  //     service.logger.warning(err);
  //   });

  instance.server.listen(instance.config.port);


  // Set Socket.io logging to WARNING
  instance.socket.set('log level', 1);


  // Dirty hack because Socket.io
  // does not support global subscriptions
  // source: http://stackoverflow.com/a/9674248/3323331
  (function() {
    var emit = instance.socket.emit;
    instance.socket.emit = function() {

      // console.log('>> OUTGOING >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      // console.log(arguments);
      // console.log('***','emit', Array.prototype.slice.call(arguments));

      emit.apply(instance.socket, arguments);
    };
    var $emit = instance.socket.$emit;
    instance.socket.$emit = function() {
      // console.log('<< INCOMMING <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
      // console.log(arguments);
      // console.log('***','on',Array.prototype.slice.call(arguments));
      var meta = {};
      meta.source = instance.id;
      meta.bufferSize = Buffer.byteLength(arguments[1], 'utf8');


      instance.messageHandler(arguments[1], meta);
      $emit.apply(instance.socket, arguments);
    };
  })();

  return instance;
}


module.exports = function (serviceObject) {
  service = serviceObject;

  return {
    instanciate: function (socketConfig) {
      return instanciate(socketConfig);
    }
  };
};
