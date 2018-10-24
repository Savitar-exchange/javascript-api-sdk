var jsrsasign = require('jsrsasign')

module.exports.Utf8ArrayToStr = function (array) {
  var result = ''
  var value

  for (var i = 0; i < array.length; i++) {
    value = array[i].toString(16)
    result += (value.length === 1 ? '0' + value : value)
  }

  return result
}

module.exports.ecdsaSign = function (payload, privateKey) {
  var ecdsaKey = new jsrsasign.ECDSA()

  ecdsaKey.setPrivateKeyHex(privateKey)

  return jsrsasign.jws.JWS.sign(null, { alg: 'ES256' }, payload, jsrsasign.KEYUTIL.getPEM(ecdsaKey, 'PKCS8PRV'))
}
