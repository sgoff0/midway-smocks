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
/**
 * Exposes ability to get mock request content using an API without actually starting a server
 */
var smocks = require('./lib');
var _ = require('lodash');
var initialized = false;

function initialize (options) {
  if (!initialized) {
    var smocks = require('./lib');
    options = options || {};

    smocks._sanityCheckRoutes();
    options = smocks._sanitizeOptions(options);
    smocks.initOptions = options;
    initialized = true;
  } else {
    throw new Error('smocks has already been initialized');
  }
}

/**
 * Return a response as if the mock server were executed
 * routeId: the route id to identify the route handler
 * variantId: id of variant *only if something other than default is required*
 * context: optional context if route config and/or state is required for the response (see Config object)
 *
 */
function handler(routeId/*, variantId, options*/) {
  if (!initialized) {
    throw new Error('You must call `init` before executing API actions');
  }

  var variantId, options;
  for (var i = 1; i < arguments.length; i++) {
    arg = arguments[i];
    if (_.isString(arg)) {
      variantId = arg;
    } else {
      options = arg;
    }
  }
  options = options || {};

  var route = smocks.routes.get(routeId);
  if (!route) {
    throw new Error('invalid route: ' + routeId);
  }
  var variant = route.getVariant(variantId || 'default');
  if (!variant) {
    throw new Error('invalid variant: ' + (variantId || 'default') + ' for route: ' + routeId);
  }

  var context = new Context({
    route: route,
    variant: variant,
    input: options.input,
    state: options.state
  });

  var request = new Request(options);
  var reply = Reply();
  variant.handler.call(context, request, reply);

  return reply.payload;
}


function Request(options) {
  this.payload = options.payload;
  this.params = options.params;
  this.query = options.query;
}

function Reply() {
  var rtn = function(payload) {
    rtn.payload = payload;
    return {
      code: function(code) {
        rtn.code = code;
      }
    }
  }
  rtn.code = 200;
  return rtn;
}


function Context(options) {
  this._input = options.input || {};
  this._state = options.state || {};
  this.route = options.route;
  this.variant = options.variant;
}
_.extend(Context.prototype, {
  __Context: true,
  state: function (key, value) {
    if (_.isUndefined(value)) {
      return this._state[key];
    } else {
      this._state[key] = value;
    }
  },
  input: function (key) {
    return this._input[key];
  },
  meta: function (key) {
    return (this.route.meta() || {})[key];
  }
});

module.exports = {
  init: initialize,
  get: handler
};
