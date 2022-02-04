export const sanitizeError = (err: any): Error => {
  if (err && err.message) {
    const lowercaseMsg = err.message.toLowerCase();
    if (
      lowercaseMsg.includes('quorum') ||
      lowercaseMsg.includes('call revert exception') ||
      lowercaseMsg.includes('could not connect to')
    ) {
      return new Error('Could not connect.');
    }
    if (lowercaseMsg.includes('missing revert data')) {
      return new Error('Possible bad address.');
    }
    if (lowercaseMsg.includes('replacement fee too low')) {
      return new Error(
        'Currently processing a transaction with this nonce. Please wait for the current transaction to complete or increase your network fee to replace the current transaction.',
      );
    }
    return err;
  }

  return new Error('Unknown error. Please try again.');
};
