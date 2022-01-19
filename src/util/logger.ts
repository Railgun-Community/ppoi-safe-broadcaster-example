/* eslint-disable no-console */
export const logger = {
  log: (obj: any) => {
    console.log(JSON.stringify(obj));
  },
  warn: (obj: any) => {
    console.warn(JSON.stringify(obj));
  },
  error: (error: Error) => {
    console.error(error.message);
    console.log(error.stack);
  },
};
