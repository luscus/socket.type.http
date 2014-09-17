var urlLib = require('url'),
    http = require('http'),
    bodyParser = require('body-parser'),
    tools = require('./tools'),
    express = require('express');

// HTTP event handlers
function onMessage (raw, data, meta, response, socket) {
  
  meta.source = socket.listener.url;
  
  var data;
  
  try {
    data = socket.requestHandler(data, meta, raw);
    //response = this.parent.formatResponse(response, data);
  }
  catch (ex) {
    data = {error: ex.message, stack: ex.stack};
  }

  socket.respond(data, response);
}


var httpServerTemplate = {
  _this: this,
  listener: null,
  requestHandler: null,

  close: function () {
    this.listener.close();
  },

  bind: function (_callback, _options) {
    _options = _options || {
      limit: '50mb'
    };
  
    this.requestHandler = _callback;

    var _socket = this,
        url = this.config.protocol + '://',
        port;

    if (! this.config.port && ! this.config.portRange) {
      throw {
        name: 'ServerBindException',
        message: 'You have to specify either:' +
        '\n  - a property "port" with a Number => port: 20000' +
        '\n  - a property "portRange" with an Array => portRange: [20000, 20002]\n\n'
      };
    }

    if (! this.config.port && this.config.portRange) {
      this.config.port = this.config.portRange[0];
    }

    if (this.config.bind) {
      url += this.config.bind + ':' + this.config.port;
    }
    else {
      url += '*' + ':' + this.config.port;
    }

    this.listener = express();
    
    this.listener.listen = function(){
      var _listener = this,
          server = http.createServer(this),
          listener;
          
        listener = server.listen.apply(server, arguments)
          .on('error', function (error) {
            if (error.code === 'EADDRINUSE') {
              _listener.parent.emit('portAlreadyInUse', _listener.parent.config.port, _listener.url, _listener.parent);
            }
            else {
              _listener.parent.emit('error', error, _listener.url, _listener.parent);
            }
          })
          .on('listening', function () {
            _listener.parent.emit('listen', _listener.url, _listener.parent);
          });
      
      return listener;
    };
    
    this.listener.url = url;
    this.listener.parent = this;

    this.listener.use(function(req, res, next) {
      var data = '';
      req.on('data', function(chunk) {
        data += chunk;
      });
      req.on('end', function() {
        req.rawBody = data;
      });

      next();
    });
    this.listener.use(bodyParser.json({limit: _options.limit}));
    this.listener.use(bodyParser.urlencoded({extended: true, limit: _options.limit}));
    this.listener.use(function(error, request, response, next){
      _socket.emit('error', error, _socket.listener.url, _socket);
      
      response.writeHead(500, 'Internal Server Error', {'Content-Type': 'application/json'});
      response.charset = "utf-8";
      response.write(JSON.stringify({error: error.message, stack: error.stack}));
      response.end();

      console.error('Socket init error: ', error);
    });
      
      
    this.listener.post('*', function httpMessageHandler (request, response) {
      var data = request.body,
          raw = request.rawBody,
          meta = {};

      meta.remoteIp = getRemoteIp(request);

      meta.bufferSize = request.socket.bytesRead;

  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('raw: ', raw);
  console.log('meta: ', meta);
  console.log('data: ', data);
      onMessage(raw, data, meta, response, _socket);
    });

    this.listener.listen(this.config.port);
    
    return this.listener;
  },
  
  respond: function (data, response) {

    if (data.error) {
      response.writeHead(500, 'Internal Server Error', {'Content-Type': 'application/json'});
    }
    else {
      response.writeHead(200, 'OK', {'Content-Type': 'application/json'});
    }

    response.charset = "utf-8";
    response.write(JSON.stringify(data));
    response.end();
  }
};


function getRemoteIp (request) {
  var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;

  if (ip) {
    ip = ip.match(/[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}/)[0];
  }

  return ip;
}


module.exports = httpServerTemplate;
