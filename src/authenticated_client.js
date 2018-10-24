var secureRandom = require('secure-random')
var utils = require('./utils')
var request = require('./request')
var PublicClient = require('./public_client')
var inherits = require('inherits')

var TOKEN_EXPIRATION_SECONDS = 1800 // 30 minutes
var TOKEN_EXPIRES_ALLOWANCE_SECONDS = 60 // 60 seconds

function AuthenticatedClient (applicationId, apiSecret) {
  PublicClient.call(this)

  this.applicationId = applicationId
  this.apiSecret = apiSecret
  this.token = null
  this.tokenExpiresAt = null
}

inherits(AuthenticatedClient, PublicClient)

AuthenticatedClient.prototype.buildJWTPayload = function () {
  var now = (Date.now() / 1000) | 0

  return {
    iat: now,
    exp: now + TOKEN_EXPIRATION_SECONDS,
    sub: 'api_key_jwt',
    iss: 'external',
    jti: utils.Utf8ArrayToStr(secureRandom(12, { type: 'Uint8Array' })).substr(0, 12)
  }
}

AuthenticatedClient.prototype.getAuthToken = function () {
  var jwtPayload = this.buildJWTPayload()

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
      this.token = data.token
      this.tokenExpiresAt = jwtPayload.exp

      return data
    }.bind(this))
}

AuthenticatedClient.prototype.isTokenExpired = function () {
  if (this.token === null) {
    return true
  }

  var now = (Date.now() / 1000) | 0

  return now > (this.tokenExpiresAt - TOKEN_EXPIRES_ALLOWANCE_SECONDS)
}

AuthenticatedClient.prototype.ensureTokenIsValid = function () {
  if (this.isTokenExpired() === true) {
    return this.getAuthToken()
  }

  return Promise.resolve()
}

AuthenticatedClient.prototype.authorizedRequest = function (method, path, body) {
  return this.ensureTokenIsValid().then(function () {
    return request(method, path, body, this.token)
  }.bind(this))
}

AuthenticatedClient.prototype.getAccount = function () {
  return this.authorizedRequest('GET', '/members/me', null)
}

module.exports = AuthenticatedClient
