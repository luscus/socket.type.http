var urlLib = require('url'),
    http = require('http'),
    bodyParser = require('body-parser'),
    tools = require('./tools'),
    express = require('express');

// HTTP event handlers
function onMessage (buffer) {

  var raw = buffer.toString(),
      data = JSON.parse(raw),
      meta = {};

  meta.bufferSize = buffer.length;
  meta.source = this.url;

  var response = this.parent.requestHandler(data, meta, raw);
  //response = this.parent.formatResponse(response, data);

  this.send(JSON.stringify(response));
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

    var url = this.config.protocol + '://',
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
      var _this = this,
          server = http.createServer(this),
          listener;
          
        listener = server.listen.apply(server, arguments)
          .on('error', function (error) {
            if (error.code === 'EADDRINUSE') {
              _this.parent.emit('portAlreadyInUse', _this.parent.config.port, _this.url, _this.parent);
            }
            else {
              _this.parent.emit('error', error, _this.url, _this.parent);
            }
          })
          .on('listening', function () {
            _this.parent.emit('listen', _this.url, _this.parent);
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
      this.emit('error', error, this.listener.url, this);
      
      response.writeHead(500, 'Internal Server Error', {'Content-Type': 'application/json'});
      response.charset = "utf-8";
      response.write(JSON.stringify({error: error.message, stack: error.stack}));
      response.end();

      console.error('Socket init error: ', error);
    });

    this.listener.on('request', onMessage);

    this.listener.listen(this.config.port);
  }
};


module.exports = httpServerTemplate;
