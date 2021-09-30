/*
  Top level file for starting the Relayer daemon.
*/

// Local libraries.
const Controllers = require('./src/controllers');

async function startRelayer() {
  try {
    console.log('Starting Relays Daemon...');

    const controllers = new Controllers();
    controllers.helloWorld();
  } catch (err) {
    console.error(err);
  }
}
startRelayer();
