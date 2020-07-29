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
var _ = require('lodash');

var doInitialize = true;
var ROUTE_STATE = {};
var USER_STATE = {};
var SESSION_VARIANT_STATE = {};

module.exports = {
  initialize: function(request, callback) {
    var _doInitialize = doInitialize;
    doInitialize = false;
    callback(undefined, _doInitialize);
  },

  userState: function(request) {
    return USER_STATE;
  },

  resetUserState: function(request, initialState) {
    USER_STATE = initialState;
  },

  routeState: function(request) {
    return ROUTE_STATE;
  },

  resetRouteState: function(request) {
    ROUTE_STATE = {};
  },

  sessionVariantState: function (request) {
    return SESSION_VARIANT_STATE;
  },

  resetSessionVariantState: function (request) {
    SESSION_VARIANT_STATE = {};
  },

  resetSessionVariantStateByKey: function (request, key) {
    delete SESSION_VARIANT_STATE[key];
  },

  setSessionVariantStateByKey: function (request, key, payload) {
    SESSION_VARIANT_STATE[key] = payload;
  },

  onResponse: function(request, reply) {
    reply.state('__smocks_state', 'static', { encoding: 'none', clearInvalid: true, path: '/' });
  },
};
