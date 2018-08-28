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

smocks.plugin({
  onRequest: function(request, reply, next) {
    var method = request.method.toUpperCase();
    var harData = this.state('__har');
    if (!harData) {
      return next();
    }

    var harIndex = Math.max(harData.startIndex, 0);
    var calls = harData.calls;
  
    // see if we can find a call math *after the current index*
    var path = request.path;
    var available = false;
    for (var i=harIndex; i<calls.length; i++) {
      var call = calls[i];
      available = available || !call.responded;
      if (!call.responded && call.path === path && call.method === method) {
        // we've got a match
        forceReply(reply, calls[i]);
        harIndex = i;
        return;
      }
    }

    if (!available) {
      this.state('__har', undefined);
    }

    next();
  }
});

function forceReply(reply, data) {
  data.responded = true;
  setTimeout(function() {
    reply(data.response.content.text).code(data.response.status).type(data.type);
  }, data.time);
}
