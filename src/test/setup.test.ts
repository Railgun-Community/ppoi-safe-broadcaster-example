/* globals describe, it, before, beforeEach, afterEach */
import configDefaults from '../config/config-defaults';
import { DebugLevel } from '../models/debug-models';

const setupTests = () => {
  configDefaults.debugLevel = DebugLevel.None;
};

before(() => {
  setupTests();
});
