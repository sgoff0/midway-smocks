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

module.exports = formatData;

function formatData(mocker, request) {
  return {
    id: mocker.id(),
    routes: formatRoutes(mocker, request),
    globalInput: formatPluginInput(mocker),
    globalInputValues: mocker.plugins.getInput(request),
    profiles: formatProfiles(mocker),
    actions: formatActions(mocker.actions.get(), mocker, request),
    proxies: mocker.initOptions && mocker.initOptions.proxy && _.map(mocker.initOptions.proxy,
        function (value, key) { return key; }),
    selectedProxy: mocker.state.routeState(request).__proxy
  };
}

function formatProfiles(mocker) {
  var rtn = [];
  var profiles = mocker.profiles.get();
  _.each(profiles, function(data, id) {
    rtn.push(id);
  });
  return rtn;
}

function formatPluginInput(mocker) {
  var rtn = [];
  var plugins = mocker.plugins.get();
  _.each(plugins, function(plugin) {
    if (plugin.input) {
      rtn.push({
        id: plugin.id(),
        input: plugin.input()
      });
    }
  });
  return rtn;
}

function formatRoutes(mocker, request) {
  var routes = mocker.routes.get();
  return _.compact(_.map(routes, function(route) {
    if (!route.hasVariants()) {
      return undefined;
    }

    return {
      id: route.id(),
      path: route.path(),
      group: route.group(),
      method: route.method(),
      label: route.label(),
      display: route.getDisplayValue(request),
      variants: formatVariants(route, mocker, request),
      actions: formatActions(route.actions.get(), mocker, request),
      input: formatInput(route.input(), mocker),
      selections: formatSelections(route, request),
      activeVariant: route.activeVariant(request)
    };
  }));
}

function formatSelections(route, request) {
  var variantSelections = {};
  _.each(route.variants(), function(variant) {
    var input = route.selectedVariantInput(variant, request);
    if (!isEmptyObject(input)) {
      variantSelections[variant.id()] = input;
    }
  });
  var rtn = {};
  var input = route.selectedRouteInput(request);
  if (!isEmptyObject(input)) {
    rtn.route = input;
  }
  if (!isEmptyObject(variantSelections)) {
    rtn.variants = variantSelections;
  }
  if (!isEmptyObject(rtn)) {
    return rtn;
  }
}

function formatActions(actions, mocker, request) {
  var rtn = [];
  _.each(actions, function(action, id) {
    rtn.push({
      id: id,
      label: action.label,
      input: formatInput(action.input, mocker, request)
    });
  });
  return rtn;
}

function formatVariants(route, mocker, request, type) {
  return _.map(route.variants(), function(variant) {
    return {
      id: variant.id(),
      label: variant.label(),
      input: formatInput(variant.input(), mocker, request)
    };
  });
}

function formatInput(input, mocker, request) {
  var rtn = {};
  _.each(input, function(data, key) {
    rtn[key] = _.clone(data);
    rtn[key].id = key;
  });
  return rtn;
}

function isEmptyObject(obj) {
  for (var name in obj) {
    if (obj.hasOwnProperty(name)) {
      return false;
    }
  }
  return true;
}
