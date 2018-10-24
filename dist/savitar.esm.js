import jsrsasign from 'jsrsasign';
import isomorphicUnfetch from 'isomorphic-unfetch';
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

var request = function (method, path, body, token) {
  var url = '';

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

  body = method === 'POST' ? JSON.stringify(body) : null;

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

PublicClient.prototype.getMarkets = function () {
  return request('GET', '/markets', null, null)
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

var authenticated_client = AuthenticatedClient;

var AuthenticatedClient_1 = authenticated_client;
var PublicClient_1 = public_client;

// var ecKeypair = jsrsasign.KEYUTIL.generateKeypair("EC", "secp256r1");
// console.log('PUB KEY', ecKeypair.prvKeyObj.pubKeyHex);
// console.log('PRIV KEY', ecKeypair.prvKeyObj.prvKeyHex);

// PUB KEY 043335674c78c029c38903dfd8ba770eba56d436fdcf908142b213a1861f92129ab1c3682f1bdeb18424d09e52b66aa49bf10fea5602add97a1b3e03419306d904
// PRIV KEY d27d8fa448a75e23d9fc8c2211358a47bceb9e2ca469d564c4b539dce090a0cf
// APP ID : 813e47a2-db17-41e2-a5b2-c92a6e8f47cf

var client = new authenticated_client('813e47a2-db17-41e2-a5b2-c92a6e8f47cf', 'd27d8fa448a75e23d9fc8c2211358a47bceb9e2ca469d564c4b539dce090a0cf');
var pubClient = new public_client();

client.getAccount().then(function (data) {
  console.log('getAccount', data);
});
client.getMarkets().then(function (data) {
  console.log('getMarkets auth', data);
});
pubClient.getMarkets().then(function (data) {
  console.log('getMarkets', data);
});

var src = {
	AuthenticatedClient: AuthenticatedClient_1,
	PublicClient: PublicClient_1
};

export default src;
export { AuthenticatedClient_1 as AuthenticatedClient, PublicClient_1 as PublicClient };
