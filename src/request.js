var fetch = require('isomorphic-unfetch')

module.exports = function (method, path, body, token) {
  var url = ''

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

  body = method === 'POST' ? JSON.stringify(body) : null

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
