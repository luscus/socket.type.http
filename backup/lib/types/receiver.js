var auroraConfig = require('com.timocom.aurora.config'),
    bodyParser = require('body-parser'),
    q = require('q'),
    util = require('util'), // TODO: remove this as soon as workaround is removed
    express = require('express'),
    service;

var Socket = function Socket (socketConfig) {
  var _this = this;
  this.status = true;
  this.config = socketConfig;
  this.name = socketConfig.name;

  this.socket = express();

  this.messageHandler = function (data, meta) {
    var message = {
      error: 'YOU HAVE TO IMPLEMENT AN HANDLER FOR THIS RECEIVER SOCKET',
      data: data,
      meta: meta
    };

    return message;
  };
};


Socket.prototype.close = function () {
  this.status = false;
  this.socket.disable();
};

Socket.prototype.setMessageHandler = function (handler) {
  if (typeof handler === 'function') {
    this.messageHandler = handler;
  }
};

function getRemoteIp (request) {
  var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;

  if (ip) {
    ip = ip.match(/[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}/)[0];
  }

  return ip;
}

function instanciate (socketConfig) {
  var instance = new Socket(socketConfig);

  instance.socket.use(function(req, res, next) {
    var data = '';
    req.on('data', function(chunk) {
      data += chunk;
    });
    req.on('end', function() {
      req.rawBody = data;
    });

    next();
  });
  instance.socket.use(bodyParser.json({limit: '50mb'}));
  instance.socket.use(bodyParser.urlencoded({limit: '50mb'}));
  instance.socket.use(function(err, request, response, next){
    response.writeHead(500, 'Internal Server Error', {'Content-Type': 'application/json'});
    response.charset = "utf-8";
    response.write(JSON.stringify({error: err.message, stack: err.stack}));
    response.end();

    service.logger.warning(err);
  });

  instance.socket.post('*', function httpMessageHandler (request, response) {
    var data = request.body,
        meta = {},
        result = {};

    meta.remoteIp = getRemoteIp(request);

    //meta.remoteIp = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    // -- TODO: end
    meta.bufferSize = request.socket.bytesRead;
    meta.source = instance.id;

    try {
      result = instance.messageHandler(data, meta, request.rawBody);

      result = service.Socket.formatResponse(result, data);
    }
    catch (exception) {
      result = service.Socket.formatResponse(result, data, exception);
    }

    if (result.statusCode && result.status) {
      response.writeHead(result.statusCode, result.status, {'Content-Type': 'application/json'});
    }
    else if (result.error) {
      response.writeHead(500, 'Internal Server Error', {'Content-Type': 'application/json'});
    }
    else {
      response.writeHead(200, 'OK', {'Content-Type': 'application/json'});
    }

    response.charset = "utf-8";
    response.write(JSON.stringify(result));
    response.end();
  });

  instance.socket.listen(instance.config.port);

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
