var urlLib = require('url'),
    tools = require('./tools'),
    requester = require('request');
    
    
console.log('requester: ', requester);

// HTTP event handlers
function onConnect () {
  this.parent.emit('connected', this.url, this.parent);
}


function _send (_connection) {
  var data = _connection.queue.shift();
  
  if (data) {
    var options = {
      uri: _connection.url,
      json: data,
      headers: {
        'Content-type': 'application/json; charset=utf-8'
      }
    };
    
    var request = requester.post(options, _connection.callback);
    console.log('request: ', request);
    request.on('error', console.error);
    
    if (_connection.queue.length > 0) {
      setTimeout(function () {
        _send(_connection);
      }, 15);
    }
  }
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
        url;

    switch (typeof target) {
      case 'string':
        var parts = urlLib.parse(target);

        if (parts.hostname) {
          url = target;
        }
        break;
      case 'object':
        break;
    }

    this.connections[url] = {};
    this.connections[url].url = url;
    this.connections[url].parent = this;
    this.connections[url].queue = [];
    
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
    requester.post(options, function (error, response, body) {
      if (error || response.statusCode >= 400 || body.error) {
        _this.connections[url].parent.emit('disconnected', _this.connections[url].url, _this.connections[url].parent);
      }
      else {
        _this.connections[url].parent.emit('connected', _this.connections[url].url, _this.connections[url].parent);
      }
    });
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
