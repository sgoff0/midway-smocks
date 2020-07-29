var formatData = require("./format-data");

module.exports = function (mocker) {
  return function (request, reply, respondWithConfig) {
    mocker.state.resetSessionVariantState(request);

    reply(respondWithConfig ? formatData(mocker, request) : {});
  };
};
