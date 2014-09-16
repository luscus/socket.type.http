var urlLib = require('url'),
    tools = require('./tools'),
    requester = require('request');

// HTTP event handlers
function onConnect () {
  this.parent.emit('connected', this.url, this.parent);
}

function onDisconnect () {
  this.parent.emit('disconnected', this.url, this.parent);
}

function onError (error) {
  this.parent.emit('error', error, this.url, this.parent);
}

function onMessage (buffer) {
  this.parent.emit('message', JSON.parse(buffer.toString()), this.url);
}


function _send (_connection) {
  var data = _connection.queue.shift();
  console.log(_connection);
  
  if (data) {
    var options = {
      url: _connection.url,
      body: data
    };
    
    requester.post(options, _connection.callback);
    
    if (_connection.queue.length > 0) {
      setTimeout(function () {
        _send(_connection);
      }, 20);
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
          connection.parent.emit('error', error, connection.url, connection.parent);
        }
        else {
          connection.parent.emit('message', JSON.parse(body), connection.url);
        }
      };
    })(this.connections[url]);
    
    this.initStats(url);
    
    console.log(this);
    
    var options = {
      url: url,
      body: 'CONNTEST'
    };
    requester.post(options, function () {
      _this.connections[url].parent.emit('connected', _this.connections[url].url, _this.connections[url].parent);
    });
    // this.connections[url].on('error', onError);
    // this.connections[url].on('connect', onConnect);
    // this.connections[url].on('disconnect', onDisconnect);
    // this.connections[url].on('message', onMessage);
  },

  send: function (data) {
    if (this.pool.length) {
      var target = this.pool[Math.floor(Math.random()*this.pool.length)];

      this.updateStats(target, data);
      
      this.connections[target].queue.push(JSON.stringify(data));
      _send(this.connections[target]);
    }
  },

  getQueue: function (url) {
    return this.connections[url].queue;
  },

  parseQueueEntry: function (entry) {
    return JSON.parse(entry);
  },

  close: function (url) {
    //return this.connections[url].close();
  }
};


module.exports = httpClientTemplate;
