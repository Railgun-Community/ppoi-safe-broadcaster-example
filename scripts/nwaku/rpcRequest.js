// const axios = require('axios')
const got = require('got');

// const { log } = console;

//const ax = axios.create({ baseURL: 'http://127.0.0.1:8546/' });

// const rpcRequest = async (method, params) => await ax.post('/', { 'jsonrpc': '2.0', method, 'id': 1, params }).then(r => r.data)
const rpcRequest = async (method, params) => got.post('http://127.0.0.1:8546/', { 
  json: { 'jsonrpc': '2.0', method, 'id': 1, params }}).json();
module.exports = { rpcRequest };
