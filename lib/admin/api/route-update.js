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
var formatData = require('./format-data');
var sessionManager = require('./util/session-manager');
var Logger = require('testarmada-midway-logger');
var _ = require('lodash');

module.exports = function(route, mocker) {

  return function(request, reply, respondWithConfig) {
    var payload = request.payload;
    var variantId = payload.variant;
    var input = payload.input;

    if (variantId) {
      var proxyApi = mocker.initOptions.proxyApi;
      if (proxyApi) {
        var sessionId = sessionManager.getSessionId(request.path);
        var routeNoSession = sessionManager.getRouteWithoutSession(route._path);
        proxyApi.setMockVariant({mockVariant: variantId, route: routeNoSession, sessionId: sessionId}, function (err) {
          if (err) {
            Logger.error('Error when updating mock variant for midway proxy' + err);
          } else {
            Logger.debug('Mock Variant for [' + sessionId + '] session and [' + request.path + '] route set to: '
              + variantId + ' in proxy api');
          }
        });
      }
    }
    selectVariant(reply, route, variantId, request);
    if (input) {
      copyProperties(input, route, request);
    }
    reply(respondWithConfig ? formatData(mocker, request) : {});
  };
};

function selectVariant(reply, route, variantId, request) {
  var returnObj = route.selectVariant(variantId, request);
  if (returnObj){
    reply(returnObj);
  }
}

function copyProperties(input, route, request) {
  if (input.route) {
    _.extend(route.selectedRouteInput(request), input.route);
  }
  if (input.variant) {
    _.extend(route.selectedVariantInput(route.getActiveVariant(request), request), input.variant);
  }
}