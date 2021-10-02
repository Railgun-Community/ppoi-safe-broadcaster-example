// Ripped from https://github.com/koajs/koa/blob/master/test/helpers/context.js
// Solution courtesy of user @fl0w. See: https://github.com/koajs/koa/issues/999#issuecomment-309270599
// Take from this gist: https://gist.github.com/emmanuelnk/f1254eed8f947a81e8d715476d9cc92c

// if you want more comprehensive Koa Context object to test stuff like Cookies etc
// then use https://www.npmjs.com/package/@shopify/jest-koa-mocks (requires Jest)

// INSTRUCTIONS:
// Import in test file as below:
//
// const mockContext = require('./mocks/ctx-mock').context
// const ctx = mockContext()
// ...

const Stream = require('stream')
const Koa = require('koa')

const context = (req, res, app) => {
  const socket = new Stream.Duplex()

  req = Object.assign(
    { headers: {}, socket },
    Stream.Readable.prototype,
    req || {}
  )
  res = Object.assign(
    { _headers: {}, socket },
    Stream.Writable.prototype,
    res || {}
  )
  req.socket.remoteAddress = req.socket.remoteAddress || '127.0.0.1'
  app = app || new Koa()
  res.getHeader = k => res._headers[k.toLowerCase()]
  res.setHeader = (k, v) => (res._headers[k.toLowerCase()] = v)
  res.removeHeader = (k, v) => delete res._headers[k.toLowerCase()]

  const retApp = app.createContext(req, res)

  return retApp
}

const request = (req, res, app) => context(req, res, app).request

const response = (req, res, app) => context(req, res, app).response

module.exports = {
  context,
  request,
  response
}
