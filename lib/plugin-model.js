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

var Plugin = function(data, mocker) {
  this.onRequest = data.onRequest;
  this.onResponse = data.onResponse;
  this.plugin = data.plugin;
  this._input = data.input;
  this._id = data.id || _.uniqueId('plugin');
};
_.extend(Plugin.prototype, {

  id: function() {
    return this._id;
  },

  input: function() {
    return this._input;
  },

  selectedInput: function(request) {
    var state = smocksInstance.state.userState(request);
    var pluginState = state._pluginState = {};
    return pluginState[this._id];
  }
});

module.exports = Plugin;
