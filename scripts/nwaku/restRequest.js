import { create } from 'axios';

const axios = create({
  baseURL: 'http://localhost:8546',
  timeout: 60 * 1000,
  headers: { 'Content-Type': 'application/json' },
});

const restPOSTRequest = async (path, params) => {
  const { data } = await axios.post(path, params);
  return data;
};

const restGETRequest = async (path) => {
  const { data } = await axios.get(path);
  return data;
};

export default { restPOSTRequest, restGETRequest };
