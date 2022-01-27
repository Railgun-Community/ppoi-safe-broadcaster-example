/* globals describe, before, it, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon, { SinonStub } from 'sinon';
import configDefaults from '../../config/config-defaults';
import { DebugLevel } from '../../models/debug-models';
import { logger } from '../logger';

chai.use(chaiAsPromised);
const { expect } = chai;

let consoleLogStub: SinonStub;
let consoleWarnStub: SinonStub;
let consoleErrorStub: SinonStub;

const testAllLogTypes = () => {
  logger.log('Test');
  logger.warn('Test');
  logger.error(new Error('Test'));
};

describe('logger', () => {
  beforeEach(() => {
    consoleLogStub = sinon.stub(console, 'log').returns();
    consoleWarnStub = sinon.stub(console, 'warn').returns();
    consoleErrorStub = sinon.stub(console, 'error').returns();
  });
  afterEach(() => {
    consoleLogStub.restore();
    consoleWarnStub.restore();
    consoleErrorStub.restore();
  });

  it('Should test Logs mode logs all types', () => {
    configDefaults.debugLevel = DebugLevel.Logs;
    testAllLogTypes();
    expect(consoleLogStub.calledOnce).to.be.true;
    expect(consoleWarnStub.calledOnce).to.be.true;
    expect(consoleErrorStub.calledOnce).to.be.true;
  });

  it('Should test Error mode logs warn and error types', () => {
    configDefaults.debugLevel = DebugLevel.Error;
    testAllLogTypes();
    expect(consoleLogStub.notCalled).to.be.true;
    expect(consoleWarnStub.calledOnce).to.be.true;
    expect(consoleErrorStub.calledOnce).to.be.true;
  });

  it('Should test Error mode logs warn and error types', () => {
    configDefaults.debugLevel = DebugLevel.None;
    testAllLogTypes();
    expect(consoleLogStub.notCalled).to.be.true;
    expect(consoleWarnStub.notCalled).to.be.true;
    expect(consoleErrorStub.notCalled).to.be.true;
  });
}).timeout(10000);
