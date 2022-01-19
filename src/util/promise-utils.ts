export const delay = (delayInMS: number): Promise<void> => {
  return new Promise((resolve) => {
    // eslint-disable-next-line no-promise-executor-return
    return setTimeout(resolve, delayInMS);
  });
};

export async function poll<T>(
  fn: () => Promise<T>,
  passCondition: (result: T) => boolean,
  delayInMS: number,
  allowedAttempts: number = 1,
): Promise<T> {
  let result = await fn();
  let attempts = 1;
  while (!passCondition(result) && attempts <= allowedAttempts) {
    // eslint-disable-next-line no-await-in-loop
    await delay(delayInMS);
    // eslint-disable-next-line no-await-in-loop
    result = await fn();
    attempts += 1;
  }
  return result;
}

export function promiseTimeout<T>(promise: Promise<T>, ms: number) {
  // Create a promise that rejects in <ms> milliseconds
  const timeout = new Promise((_resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`Timed out in ${ms} ms.`));
    }, ms);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout]);
}
