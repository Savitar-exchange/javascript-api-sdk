import jsrsasign from 'jsrsasign';
import isomorphicUnfetch from 'isomorphic-unfetch';
import querystringEs3 from 'querystring-es3';
import secureRandom from 'secure-random';
import inherits from 'inherits';

var Utf8ArrayToStr = function (array) {
  var result = '';
  var value;

  for (var i = 0; i < array.length; i++) {
    value = array[i].toString(16);
    result += (value.length === 1 ? '0' + value : value);
  }

  return result
};

var ecdsaSign = function (payload, privateKey) {
  var ecdsaKey = new jsrsasign.ECDSA();

  ecdsaKey.setPrivateKeyHex(privateKey);

  return jsrsasign.jws.JWS.sign(null, { alg: 'ES256' }, payload, jsrsasign.KEYUTIL.getPEM(ecdsaKey, 'PKCS8PRV'))
};

var utils = {
	Utf8ArrayToStr: Utf8ArrayToStr,
	ecdsaSign: ecdsaSign
};

function cleanEmptyParams (params) {
  if (params === undefined || params === null || params === {}) {
    return null
  }

  Object.keys(params).map(function (key) {
    var value = params[key];
    if (value === undefined || value === null) {
      delete params[key];
    }
  });

  return params
}

var request = function (method, path, params, token) {
  var url = '';

  params = cleanEmptyParams(params);

  if (path === '/sessions/generate_jwt') {
    url = 'https://auth.savitar.io/api/v1' + path;
  } else {
    url = 'https://api.savitar.io/api/v2' + path;
  }

  var headers = {
    'Content-Type': 'application/json'
  };

  if (token !== null) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  var body = method === 'POST' ? JSON.stringify(params) : null;
  if (method === 'GET' && params !== null) {
    url = url + '?' + querystringEs3.stringify(params);
  }

  return isomorphicUnfetch(url, {
    method: method,
    body: body,
    headers: headers
  })
    .then(function (response) { return response.json() })
    .then(function (data) {
      if (data.error !== undefined) {
        throw data.error
      }

      return data
    })
};

function PublicClient () {
}

PublicClient.prototype.timestamp = function () {
  return request('GET', '/timestamp', null, null)
};

PublicClient.prototype.currencies = function () {
  return request('GET', '/currencies', null, null)
};

PublicClient.prototype.getCurrency = function (currency) {
  return request('GET', '/currencies/' + currency, null, null)
};

PublicClient.prototype.getMarkets = function () {
  return request('GET', '/markets', null, null)
};

PublicClient.prototype.getMarketFees = function (m) {
  return request('GET', '/fees/trading', null, null)
};

PublicClient.prototype.getTicker = function (market) {
  return request('GET', '/tickers/' + market, null, null)
};

PublicClient.prototype.getAllTickers = function () {
  return request('GET', '/tickers', null, null)
};

PublicClient.prototype.getOrderBook = function (market) {
  return request('GET', '/order_book', { market: market }, null)
};

PublicClient.prototype.getDepth = function (market) {
  return request('GET', '/depth', { market: market }, null)
};

PublicClient.prototype.getTrades = function (market, options) {
  options = options || {};

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
};

PublicClient.prototype.getCurrencyTrades = function (currency) {
  return request('GET', '/currency/trades', { currency: currency }, null)
};

var public_client = PublicClient;

var TOKEN_EXPIRATION_SECONDS = 1800; // 30 minutes
var TOKEN_EXPIRES_ALLOWANCE_SECONDS = 60; // 60 seconds

function AuthenticatedClient (applicationId, apiSecret) {
  public_client.call(this);

  this.applicationId = applicationId;
  this.apiSecret = apiSecret;
  this.token = null;
  this.tokenExpiresAt = null;
}

inherits(AuthenticatedClient, public_client);

AuthenticatedClient.prototype.buildJWTPayload = function () {
  var now = (Date.now() / 1000) | 0;

  return {
    iat: now,
    exp: now + TOKEN_EXPIRATION_SECONDS,
    sub: 'api_key_jwt',
    iss: 'external',
    jti: utils.Utf8ArrayToStr(secureRandom(12, { type: 'Uint8Array' })).substr(0, 12)
  }
};

AuthenticatedClient.prototype.getAuthToken = function () {
  var jwtPayload = this.buildJWTPayload();

  return request(
    'POST',
    '/sessions/generate_jwt',
    {
      jwt_token: utils.ecdsaSign(jwtPayload, this.apiSecret),
      kid: this.applicationId
    },
    null
  )
    .then(function (data) {
      this.token = data.token;
      this.tokenExpiresAt = jwtPayload.exp;

      return data
    }.bind(this))
};

AuthenticatedClient.prototype.isTokenExpired = function () {
  if (this.token === null) {
    return true
  }

  var now = (Date.now() / 1000) | 0;

  return now > (this.tokenExpiresAt - TOKEN_EXPIRES_ALLOWANCE_SECONDS)
};

AuthenticatedClient.prototype.ensureTokenIsValid = function () {
  if (this.isTokenExpired() === true) {
    return this.getAuthToken()
  }

  return Promise.resolve()
};

AuthenticatedClient.prototype.authorizedRequest = function (method, path, body) {
  return this.ensureTokenIsValid().then(function () {
    return request(method, path, body, this.token)
  }.bind(this))
};

AuthenticatedClient.prototype.getAccount = function () {
  return this.authorizedRequest('GET', '/members/me', null)
};

AuthenticatedClient.prototype.getDeposits = function (currency) {
  return this.authorizedRequest('GET', '/deposits', { currency: currency })
};

AuthenticatedClient.prototype.getOrders = function (market, options) {
  options = options || {};

  return this.authorizedRequest(
    'GET',
    '/orders',
    {
      market: market,
      state: options.state,
      page: options.page,
      order_by: options.orderBy
    }
  )
};

AuthenticatedClient.prototype.placeOrder = function (market, side, volume, price, orderType) {
  return this.authorizedRequest(
    'POST',
    '/orders',
    {
      market: market,
      side: side,
      volume: volume,
      price: price,
      ord_type: orderType
    }
  )
};

AuthenticatedClient.prototype.buy = function (market, volume, price, orderType) {
  return this.placeOrder(market, 'bid', volume, price, orderType)
};

AuthenticatedClient.prototype.sell = function (market, volume, price, orderType) {
  return this.placeOrder(market, 'sell', volume, price, orderType)
};

AuthenticatedClient.prototype.cancelOrder = function (orderId) {
  return this.authorizedRequest('POST', '/order/delete', { id: orderId })
};

AuthenticatedClient.prototype.getOrder = function (orderId) {
  return this.authorizedRequest('GET', '/order', { id: orderId })
};

AuthenticatedClient.prototype.cancelAllOrders = function (side) {
  return this.authorizedRequest('POST', '/orders/clear', { side: side })
};

var authenticated_client = AuthenticatedClient;

var AuthenticatedClient_1 = authenticated_client;
var PublicClient_1 = public_client;

var src = {
	AuthenticatedClient: AuthenticatedClient_1,
	PublicClient: PublicClient_1
};

export default src;
export { AuthenticatedClient_1 as AuthenticatedClient, PublicClient_1 as PublicClient };
