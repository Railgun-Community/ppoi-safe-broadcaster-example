// eslint-disable-next-line import/no-mutable-exports
export let testConfig = {
  // OVERRIDES - override using test-config-overrides.ts

  // API Key for 0x API.
  zeroXApiKey: process.env.ZERO_X_API_KEY ?? '',
};

try {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-member-access
  const overrides = require('./test-config-overrides.test').default;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  testConfig = { ...testConfig, ...overrides };
  // eslint-disable-next-line no-empty
} catch {
  // eslint-disable-next-line no-console
  console.error('Could not load test-config-overrides.');
}
