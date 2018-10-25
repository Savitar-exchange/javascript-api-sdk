var fetch = require('isomorphic-unfetch')
var querystring = require('querystring-es3')

function cleanEmptyParams (params) {
  if (params === undefined || params === null || params === {}) {
    return null
  }

  Object.keys(params).map(function (key) {
    var value = params[key]
    if (value === undefined || value === null) {
      delete params[key]
    }
  })

  return params
}

module.exports = function (method, path, params, token) {
  var url = ''

  params = cleanEmptyParams(params)

  if (path === '/sessions/generate_jwt') {
    url = AUTH_API_URL + path
  } else {
    url = API_URL + path
  }

  var headers = {
    'Content-Type': 'application/json'
  }

  if (token !== null) {
    headers['Authorization'] = 'Bearer ' + token
  }

  var body = method === 'POST' ? JSON.stringify(params) : null
  if (method === 'GET' && params !== null) {
    url = url + '?' + querystring.stringify(params)
  }

  return fetch(url, {
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
}
