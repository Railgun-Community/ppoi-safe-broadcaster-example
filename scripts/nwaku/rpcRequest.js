const axios = require('axios')

// const { log } = console;

const ax = axios.create({ baseURL: 'http://127.0.0.1:8546/' });
const rpcRequest = async (method, params) => await ax.post('/', { 'jsonrpc': '2.0', method, 'id': 1, params }).then(r => r.data)
module.exports = { rpcRequest };
