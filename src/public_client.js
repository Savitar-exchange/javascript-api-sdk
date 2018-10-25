var request = require('./request')

function PublicClient () {
}

PublicClient.prototype.timestamp = function () {
  return request('GET', '/timestamp', null, null)
}

PublicClient.prototype.currencies = function () {
  return request('GET', '/currencies', null, null)
}

PublicClient.prototype.getCurrency = function (currency) {
  return request('GET', '/currencies/' + currency, null, null)
}

PublicClient.prototype.getMarkets = function () {
  return request('GET', '/markets', null, null)
}

PublicClient.prototype.getMarketFees = function (m) {
  return request('GET', '/fees/trading', null, null)
}

PublicClient.prototype.getTicker = function (market) {
  return request('GET', '/tickers/' + market, null, null)
}

PublicClient.prototype.getAllTickers = function () {
  return request('GET', '/tickers', null, null)
}

PublicClient.prototype.getOrderBook = function (market) {
  return request('GET', '/order_book', { market: market }, null)
}

PublicClient.prototype.getDepth = function (market) {
  return request('GET', '/depth', { market: market }, null)
}

PublicClient.prototype.getTrades = function (market, options) {
  options = options || {}

  return request(
    'GET',
    '/trades',
    {
      market: market,
      timestamp: options.timestamp,
      from: options.from,
      to: options.to,
      order_by: options.order
    },
    null
  )
}

PublicClient.prototype.getCurrencyTrades = function (currency) {
  return request('GET', '/currency/trades', { currency: currency }, null)
}

module.exports = PublicClient
