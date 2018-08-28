/**
* MIT License
*
* Copyright (c) 2018-present, Walmart Inc.,
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*
*/
var smocks = require('../index');
var Wreck = require('wreck');
var Logger = require('testarmada-midway-logger');

smocks.plugin({
  onRequest: function(request, reply, next) {
    var proxyConfig = smocks.state.routeState(request).__proxy;
    if (proxyConfig) {
      var proxyOptions = getProxyOptions(proxyConfig, request);
      if (!proxyOptions) {
        return next();
      }

      var requestErr = proxyRequest(proxyOptions, request, reply);
      if (requestErr) {
        reply({error: requestErr}).code(500);
      }
      return;
    }
    next();
  }
});

function getProxyOptions (config, request) {
  var proxyOptions;
  var urlData = smocks.initOptions.proxy[config];
  if (typeof urlData === 'string') {
    proxyOptions = urlData + request.path;
  } else {
    proxyOptions = urlData(request);
  }
  if (typeof proxyOptions === 'string') {
    proxyOptions = {
      url: proxyOptions
    };
  }
  if (!proxyOptions) {
    return false;
  }

  var queryValues = [];
  for (var key in request.query) {
    if (request.query.hasOwnProperty(key)) {
      var queryVal = request.query[key];
      if (typeof queryVal === 'string') {
        queryValues.push({key: key, value: queryVal});
      } else if (Array.isArray(queryVal)) {
        for (var i = 0; i < queryVal.length; i++) {
          queryValues.push({key: key, value: queryVal[i]});
        }
      }
    }
  }

  var query = queryValues.map(function (val) {
    return val.key + '=' + encodeURIComponent(val.value);
  }).join('&');

  proxyOptions.url = query ? (proxyOptions.url + '?' + query) : proxyOptions.url;

  return proxyOptions;
}

function proxyRequest (proxyOptions, request, reply) {
  var url = proxyOptions.url;
  Logger.info('proxy to: ' + url);
  var method = request.method || 'GET';
  var urlMatch = /^(https?)\:\/\/([^\/]+):?([0-9]*)(\/.*)$/;
  var match = url.match(urlMatch);
  if (!match) {
    return 'proxy URL must be fully qualified: ' + url;
  }

  var protocol = match[1];
  var host = match[2];
  var port = parseInt(match[3] || '0', 10);
  var path = match[4];
  port = port || protocol === 'http' ? 80 : 443;

  request.headers.host = url.match('^[^:]*:\/\/([^/\]*)')[1];
  var options = {
      payload: request.payload && JSON.stringify(request.payload),
      headers: request.headers,
      redirects: 1,
      timeout:   10000,
      rejectUnauthorized: false,
      downstreamRes: null
  };

  Wreck.request(method, url, options, function (error, response, body) {
    if (error) {
      return reply({
        proxyUrl: url,
        proxyMethod: method,
        proxyHeaders: request.headers,
        message: 'proxy error: ' + error.message,
        code: error.code
      }).code(500);
    }
    var headers = response.headers;
    var setCookie = headers['set-cookie'];
    delete headers['set-cookie'];
    var cookies;
    var responseMutator = proxyOptions.responseMutator;
    if (responseMutator) {
      var responseMutatorOptions = {
        url: url,
        method: method,
        headers: request.headers
      };
      response = responseMutator.response ? responseMutator.response(response, responseMutatorOptions) : response;
      headers = responseMutator.headers ? responseMutator.headers(headers, responseMutatorOptions) : headers;
      cookies = responseMutator.cookies && responseMutator.cookies(setCookie, responseMutatorOptions);
    }
    if (!cookies && setCookie) {
      cookies = convertToCookieState(setCookie);
    }

    var _response = reply(response).hold();
    for (var key in headers) {
      _response.header(key, headers[key]);
    }
    if (cookies) {
      for (var i = 0; i < cookies.length; i++) {
        var cookieValue = cookies[i];
        _response.state(cookieValue[0], cookieValue[1], cookieValue[2] || false);
      }
    }
    _response.code(response.statusCode);
    _response.send();
  });
}

function convertToCookieState (cookies) {
  if (!cookies) { return []; }
  if (typeof cookies === 'string') {
    cookies = [cookies];
  }
  return cookies.map(function (cookie) {
    // 1st param is value, 2nd param is options
    var match = cookie.match(/^([^=]*)=([^;]*)\s*;?(.*)/);
    return [match[1], match[2], {}];
  });
}
