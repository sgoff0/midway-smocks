module.exports = function (mocker) {
    return function (request, reply, respondWithConfig) {
      var key = request.params.key;
      mocker.state.resetSessionVariantStateByKey(request, key);
  
      reply(respondWithConfig ? formatData(mocker, request) : {});
    };
  };
  