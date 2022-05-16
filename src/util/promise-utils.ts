export const delay = (delayInMS: number): Promise<void> => {
  return new Promise((resolve) => {
    // eslint-disable-next-line no-promise-executor-return
    return setTimeout(resolve, delayInMS);
  });
};

export const throwErr = (err: any) => {
  throw err;
};

/*
 * Creates a promise that rejects in <ms> milliseconds
 */
export function promiseTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise((_resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`Timed out in ${ms} ms.`));
    }, ms);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout])
    .then((result) => result as T)
    .catch((err) => {
      throw err;
    });
}
