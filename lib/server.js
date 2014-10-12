var urlLib = require('url'),
    http = require('http'),
    tools = require('./tools');

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
        url = 'http://',
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

    this.listener = http.createServer();

    this.listener.url = url;
    this.listener.parent = this;

    this.listener.on('error', function (error) {
      if (error.code === 'EADDRINUSE') {
        this.parent.emit('portAlreadyInUse', this.parent.config.port, this.url, this.parent);
      }
      else {
        _socket.parent.emit('error', error, this.url, this.parent);
      }
    })
    .on('listening', function () {
      this.parent.emit('listen', this.url, this.parent);
    });

    this.listener.on('request', function httpMessageHandler (request, response) {
      var chunk = '';

      request.on('data', function (buffer) {
        chunk += buffer.toString();
      });

      request.on('end', function () {
        var raw = chunk,
            data = JSON.parse(chunk),
            meta = {};

        meta.remoteIp = getRemoteIp(request);

        meta.bufferSize = request.socket.bytesRead;

        onMessage(raw, data, meta, response, _socket);
      });
    });

    this.listener.listen(this.config.port);

    return this.listener;
  },

  respond: function (data, response) {
    response.setTimeout(3000, function (socket) {
      socket.destroy();
    });

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
