var urlLib = require('url'),
    tools = require('./tools'),
    http = require('http');


// HTTP event handlers
function onConnectionError (_connection, data) {

  if (data.type !== 'HTTP_CONNECTION_TEST') {
    _connection.queue.push(data);
  }

  _connection.parent.emit('hanging', _connection.url, _connection.parent);
}


function _send (_connection, _callback) {
  var data = _connection.queue.shift();

  if (data) {
    _callback = _callback || function (response) {
      response.setEncoding('utf8');
      response.on('data', function (chunk) {
        _connection.callback(null, response, JSON.parse(chunk));
      });
    };

    var packet = {meta:{}};
    packet.meta.timeSended = Date.now();

    if (packet.meta.target) {
      packet.meta.retryTarget = _connection.url;
    }
    else {
      packet.meta.target = _connection.url;
    }

    if (!data.target) {
      data.target = _connection.url;
    }
    packet.data = data;

    var timeout = _connection.parent.config.timeout || 15000,
        post = http.request(_connection.options, _callback);

    post.setTimeout(timeout, function () {
      console.log('TIMEOUT: ', _connection.url);
      onConnectionError(_connection, data);
    });

    post.on('error', function (error) {
      console.log('ERROR: ', _connection.url);
      onConnectionError(_connection, data);
    });

    post.write(JSON.stringify(data));
    post.end();

    if (_connection.queue.length > 0) {
      setTimeout(function () {
        _send(_connection);
      }, 1);
    }
  }
}


function _test (_connection) {
  _connection.queue.push({
    type:'HTTP_CONNECTION_TEST',
    target: _connection.url
  });

  _send(_connection, function (response) {
    response.setEncoding('utf8');
    response.on('data', function (chunk) {

      if (response.statusCode >= 400) {
        _connection.parent.emit('disconnected', _connection.url, _connection.parent);
      }
      else {
        _connection.parent.emit('connected', _connection.url, _connection.parent);
      }
    });
  });
}

function _buildUrl (config, port) {
  var host = config.host || 'localhost';
  return 'http://' + host + ':' + port;
}

var httpClientTemplate = {
  connect: function (target) {
    var _this = this,
        host,
        port,
        url;

    switch (typeof target) {
      case 'string':
        var parts = urlLib.parse(target);

        if (parts.hostname) {
          url = target;
          host = parts.hostname;
          port = parts.port || 80;
        }
        break;
      case 'object':
        if (target.port) {
          url = _buildUrl(target, target.port);
        }
        else if (target.portRange) {
          target.portRange.forEach(function (port, index) {
            url = _buildUrl(target, port);

            console.log('URL: ', url);
            _this.connect(url);
          });

          return;
        }
        break;
    }

    this.connections[url] = {};
    this.connections[url].url = url;
    this.connections[url].parent = this;
    this.connections[url].queue = [];


    this.connections[url].options = {
      hostname: host,
      port: port || 80,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    };

    this.connections[url].callback = (function (connection) {
      return function (error, response, body) {

        if (error) {
          connection.parent.emit('disconnect', connection.url, connection.parent);
        }
        else {
          connection.parent.emit('message', body, connection.url);
        }
      };
    })(this.connections[url]);

    this.initStats(url);

    _test(this.connections[url]);
  },

  send: function (data) {
    if (this.pool.length) {
      var target = this.pool[Math.floor(Math.random()*this.pool.length)];

      this.updateStats(target, data);

      this.connections[target].queue.push(data);
      _send(this.connections[target]);
    }
  },

  reconnect: function () {
    var _this = this,
        urls  = Object.keys(this.connections),
        index = urls.length,
        isTrying = false,
        now = Date.now(),
        connection;

    while (index--) {
      connection = this.connections[urls[index]];

console.log('----');
            console.log(connection.url+' connected? ', connection.connected, connection.nextReconnectOffset, connection.nextReconnect, now);
      if (!connection.connected && connection.nextReconnect < now) {

        if (connection.nextReconnectOffset < 900000) {
          connection.nextReconnectOffset *= 2;
        }

        connection.nextReconnect = now + connection.nextReconnectOffset;
      console.log('\n\n\nRECONNECT TO: ', connection.url);
      console.log('connection.nextReconnectOffset: ', connection.nextReconnectOffset);
      console.log('connection.nextReconnect: ', connection.nextReconnect, '\n\n\n');

        _test(connection);
        isTrying = true;
      }
    }

    if (isTrying) {
      setTimeout(function () {
        _this.reconnect();
      }, 1000);
    }
  },

  getQueue: function (url) {
    return this.connections[url].queue;
  },

  getQueueLength: function (url) {
    return this.connections[url].queue.length;
  },

  parseQueueEntry: function (entry) {
    return entry;
  },

  close: function (url) {
    //return this.connections[url].close();
  }
};


module.exports = httpClientTemplate;
