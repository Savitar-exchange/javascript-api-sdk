var request = require('./request')

function PublicClient () {
}

PublicClient.prototype.getMarkets = function () {
  return request('GET', '/markets', null, null)
}

module.exports = PublicClient
