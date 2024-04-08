import { delay } from '@railgun-community/shared-models';
import axios from 'axios';

import debug from 'debug';

const dbg = debug('relayer:waku:poller');

export const waitForWaku = async (url: string) => {
  let retries = 0;
  const httpConfig = {
    timeout: 60000,
    headers: { 'Content-Type': 'application/json' },
  };
  const http = axios.create(httpConfig);
  dbg("Polling for Waku Connection...")
  while (retries < 30) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await http.get(`${url}/debug/v1/info`);
      if (response.status === 200) {
        dbg('Connected to Local Waku Node');
        return;
      }
      dbg('Error Response Status: ', response);
    } catch (e) {
      dbg("Waku Polling Error")
      dbg(e);
    }
    retries += 1;
    // eslint-disable-next-line no-await-in-loop
    await delay(1000)
  }
  throw new Error('Could not connect to Waku');
}
