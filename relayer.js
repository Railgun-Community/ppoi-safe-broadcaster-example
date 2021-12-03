/*
  This is a wrapper for the top-level index.js library.
  It starts the Relayer daemon.
*/

const Relayer = require('./index.js');

const relayer = new Relayer();

relayer.startRelayer();
