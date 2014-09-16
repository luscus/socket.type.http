var requester = require('request'),
    service;

var Socket = function Socket (socketConfig) {

  this.id     = socketConfig.id;
  this.status = true;
  this.config = socketConfig;
  this.name   = socketConfig.name;
};


Socket.prototype.close = function () {
  this.status = false;
};

Socket.prototype.send = function (data, urlPath, customCallback) {
  urlPath = urlPath || '';
  customCallback = (typeof customCallback === 'function' ? customCallback : undefined);



  function requestCallback (error, response, body) {
    body = body || {};

    if (error || body.error || /[4-5][0-9][0-9]/.test(response.statusCode)) {
      var message = 'request',
          customError = {};

      if (response) {
        customError.message  = response.request.uri.href;
      }

      customError.message += ' returned ';

      customError.error = error || body.error || 'HTTP STATUS CODE '+response.statusCode;

      // log error
      service.logger.warning(customError.message, customError.error);

      // put parsed error in the response body
      body.error = JSON.stringify(customError);
    }

    // return body to custom callback if provided
    if (customCallback) customCallback(body);
  }


  var targets = this.config.targets;

  for (var idx in targets) {
    var url = targets[idx] + urlPath;

    requester.post(
      {
        uri: url,
        json: data,
        headers: {
          'Content-type': 'application/json; charset=utf-8'
        }
      },
      requestCallback
    );
  }
};


module.exports = function (serviceObject) {
  service = serviceObject;

  return {
    instanciate: function (socketConfig) {
      return new Socket(socketConfig);
    }
  };
};
