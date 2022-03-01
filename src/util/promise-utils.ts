export const delay = (delayInMS: number): Promise<void> => {
  return new Promise((resolve) => {
    // eslint-disable-next-line no-promise-executor-return
    return setTimeout(resolve, delayInMS);
  });
};

export const throwErr = (err: any) => {
  throw err;
};
