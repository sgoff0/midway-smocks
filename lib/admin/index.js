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
var formatData = require('./api/format-data');
var MIDWAY_API_PATH = require('../constants').MIDWAY_API_PATH;
var fs = require('fs');
var Path = require('path');
var _ = require('lodash');
var Logger = require('testarmada-midway-logger');
var MIME_TYPES = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.ttf': 'font/ttf',
  '.eot': 'font/eot',
  '.otf': 'font/otf',
  '.woff': 'font/woff'
};

module.exports = function(server, mocker) {

  var connection = server;

  if (mocker.connection()) {
    connection = server.select(mocker.connection());
  }

  connection.route({
    method: 'GET',
    path: '/_admin',
    handler: ensureInitialized(function (request, reply) {
      Logger.info('Received /admin request. Redirecting to /midway');
      reply.redirect('/midway');
    })
  });

  connection.route({
    method: 'GET',
    path: '/midway',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      fs.readFile(__dirname + '/config-page.html', {encoding: 'utf8'}, function(err, html) {
        if (err) {
          Logger.error(err);
          reply(err);
        } else {
          var data = formatData(mocker, request);
          html = html.replace('{data}', JSON.stringify(data));
          reply(html);
        }
      });
    })
  });

  connection.route({
    method: 'POST',
    path: MIDWAY_API_PATH + '/route/{id}',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      var id = request.params.id;
      var route = mocker.findRoute(id);
      require('./api/route-update')(route, mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'POST',
    path: MIDWAY_API_PATH + '/action',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      var id = request.params.id;
      var route = mocker.findRoute(id);

      require('./api/execute-action')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'POST',
    path: MIDWAY_API_PATH + '/state/reset',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/reset-state')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: "POST",
    path: MIDWAY_API_PATH + "/sessionVariantState/reset",
    handler: ensureInitialized(function (request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require("./api/reset-session-variant-state")(mocker)(
        request,
        reply,
        respondWithConfig
      );
    }),
  });

  connection.route({
    method: "POST",
    path: MIDWAY_API_PATH + "/sessionVariantState/reset/{key}",
    handler: ensureInitialized(function (request, reply, respondWithConfig) {
       reply = wrapReply(request, reply);
      require("./api/reset-session-variant-state-by-key")(mocker)(
        request,
        reply,
        respondWithConfig
      );
    }),
  });

  connection.route({
    method: "POST",
    path: MIDWAY_API_PATH + "/sessionVariantState/set/{key}",
    handler: ensureInitialized(function (request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require("./api/set-session-variant-state-by-key")(mocker)(
        request,
        reply,
        respondWithConfig
      );
    }),
  });


  connection.route({
    method: 'POST',
    path: MIDWAY_API_PATH + '/input/reset',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/reset-input')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'POST',
    path: MIDWAY_API_PATH + '/global/input/{pluginId}',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/global-input')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'GET',
    path: MIDWAY_API_PATH + '/profile',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/calculate-profile')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'POST',
    path: MIDWAY_API_PATH + '/profile',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/select-local-profile')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'POST',
    path: MIDWAY_API_PATH + '/profile/{name}',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/select-remote-profile')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'PUT',
    path: MIDWAY_API_PATH + '/profile/{name}',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/select-remote-profile')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'POST',
    path: MIDWAY_API_PATH + '/proxy',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/set-proxy')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'GET',
    path: '/midway/lib/{name*}',
    handler: function(request, reply) {
      try {
        var buffer = fs.readFileSync(__dirname + '/lib/' + request.params.name);
        var ext = Path.extname(request.params.name);
        reply(buffer)
          .header('Content-Type', MIME_TYPES[ext])
          .header('Cache-Control', 'max-age=31556926');
      } catch (e) {
        reply().code(404);
      }
    }
  });

  var compiledSource;
  connection.route({
    method: 'GET',
    path: '/midway/app.js',
    handler: function(request, reply) {
      if (!compiledSource) {
        var source = fs.readFileSync(__dirname + '/config-page.js', {encoding: 'utf-8'});
        compiledSource = require('babel-core').transform(source, {presets: [require('babel-preset-react')]}).code;
      }
      reply(compiledSource);

      // when developing config page, uncomment below
      // compiledSource = undefined;
    }
  });

  connection.route({
    method: 'GET',
    path: '/midway/inputs.js',
    handler: function(request, reply) {
      reply(getInputPlugins(mocker));
    }
  });

  function ensureInitialized(func) {
    return function(request, reply) {

      function doInit () {
        _.each(mocker.routes.get(), function(route) {
          route.resetRouteVariant(request);
          route.resetSelectedInput(request);
        });
        mocker.plugins.resetInput(request);
        var initialState = JSON.parse(JSON.stringify(mocker.initOptions.initialState || {}));
        mocker.state.resetUserState(request, initialState)
      }
      mocker.state.initialize(request, function (err, performInitialization) {
        if (performInitialization) {
          doInit();
        }
        var returnConfig = request.query.returnConfig;
        func.call(this, request, reply, !!returnConfig);
      });
    }
  }

  function wrapReply(request, reply) {
    var rtn = function(payload) {
      var response = reply.call(this, payload).hold();
      if (mocker.state.onResponse) {
        mocker.state.onResponse(request, response);
      }
      return response.send();
    }
    rtn.file = function() {
      var response = reply.file.apply(reply, arguments).hold();
      if (mocker.state.onResponse) {
        mocker.state.onResponse(request, response);
      }
      return response.send();
    }
    return rtn;
  }
};

function getInputPlugins(mocker) {
  var inputs = mocker.inputs.get();
  var script = '';
  _.each(inputs, function(data, id) {
    script = script + 'input["' + id + '"] = ' + data.ui + '\n';
  });
  script = 'var _inputs = function(input) {\n' + script + '\n};';
  return script;
}
