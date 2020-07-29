var formatData = require("./format-data");

module.exports = function (mocker) {
  return function (request, reply, respondWithConfig) {
    var key = request.params.key;
    var payload = request.payload;
    mocker.state.setSessionVariantStateByKey(request, key, payload);

    reply(respondWithConfig ? formatData(mocker, request) : {});
  };
};
