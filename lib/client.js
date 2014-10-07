var urlLib = require('url'),
    tools = require('./tools'),
    http = require('http');


// HTTP event handlers
function onConnect () {
  this.parent.emit('connected', this.url, this.parent);
}


function _send (_connection) {
  var data = _connection.queue.shift();

  if (data) {
    var data = JSON.stringify(data);
    //_connection.options.headers['Content-Length'] = data.length;

    var post = http.request(_connection.options, function (response) {
      console.log('STATUS: ' + response.statusCode);
      console.log('HEADERS: ' + JSON.stringify(response.headers));
      response.setEncoding('utf8');
      response.on('data', function (chunk) {
        console.log('BODY: ' + chunk);

        _connection.callback(null, response, JSON.parse(chunk));
      });
    });

    post.write(JSON.stringify(data));
    post.end();

    //     var request = requester.post(options, _connection.callback);
    //     console.log('request: ', request);
    //     request.on('error', console.error);

    if (_connection.queue.length > 0) {
      setTimeout(function () {
        _send(_connection);
      }, 15);
    }
  }
}


function _test (_connection) {
  var data = JSON.stringify(_connection.options);
  _connection.options.headers['Content-Length'] = data.length;

  var post = http.request(_connection.options, function (response) {
    console.log('STATUS: ' + response.statusCode);
    console.log('HEADERS: ' + JSON.stringify(response.headers));
    response.setEncoding('utf8');
    response.on('data', function (chunk) {
      console.log('BODY: ' + chunk);

      if (response.statusCode >= 400) {
        _connection.parent.emit('disconnected', _connection.url, _connection.parent);
      }
      else {
        _connection.parent.emit('connected', _connection.url, _connection.parent);
      }
    });
  });

  post.write(data);
  post.end();
}


function _callback (error, response, body) {
  console.log('_callback::error: ', error);
  console.log('_callback::body: ', body);

  if (error) {
  }
  else {
  }
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
          port = parts.port;
        }
        break;
      case 'object':
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
    console.log('this.connections["'+url+'"].options: ', this.connections[url].options);

    this.connections[url].callback = (function (connection) {
      return function (error, response, body) {
        console.log(connection.url+'::callback::error: ', error);
        console.log(connection.url+'::callback::body: ', body);

        if (error) {
          connection.parent.emit('disconnect', connection.url, connection.parent);
        }
        else {
          connection.parent.emit('message', body, connection.url);
        }
      };
    })(this.connections[url]);

    this.initStats(url);

    var options = {
      url: url,
      body: 'CONNTEST'
    };

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

  getQueue: function (url) {
    return this.connections[url].queue;
  },

  parseQueueEntry: function (entry) {
    return entry;
  },

  close: function (url) {
    //return this.connections[url].close();
  }
};


module.exports = httpClientTemplate;
