/* eslint-disable no-console */
export const logger = {
  log: (obj: any) => {
    console.log(JSON.stringify(obj));
  },
  warn: (obj: any) => {
    console.warn(JSON.stringify(obj));
  },
  error: (obj: any) => {
    console.error(JSON.stringify(obj));
  },
};
