import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon, { SinonStub } from 'sinon';
import configDefaults from '../../server/config/config-defaults';
import { DebugLevel } from '../../models/debug-models';
import { getDbgInstances, logger } from '../logger';

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
    const { dbgLog, dbgWarn, dbgError } = getDbgInstances();
    consoleLogStub = sinon.stub(dbgLog, 'call').returns();
    consoleWarnStub = sinon.stub(dbgWarn, 'call').returns();
    consoleErrorStub = sinon.stub(dbgError, 'call').returns();
  });
  afterEach(() => {
    consoleLogStub?.restore();
    consoleWarnStub?.restore();
    consoleErrorStub?.restore();
  });

  it('Should test None log mode sends no logs', () => {
    configDefaults.debug.logLevel = DebugLevel.None;
    testAllLogTypes();
    expect(consoleLogStub.notCalled).to.be.true;
    expect(consoleWarnStub.notCalled).to.be.true;
    expect(consoleErrorStub.notCalled).to.be.true;
  });

  it('Should test Logs mode logs all types', () => {
    configDefaults.debug.logLevel = DebugLevel.VerboseLogs;
    testAllLogTypes();
    expect(consoleLogStub.calledOnce).to.be.true;
    expect(consoleWarnStub.calledOnce).to.be.true;
    expect(consoleErrorStub.calledOnce).to.be.true;
  });

  it('Should test Warnings mode logs warn and error types', () => {
    configDefaults.debug.logLevel = DebugLevel.WarningsErrors;
    testAllLogTypes();
    expect(consoleLogStub.notCalled).to.be.true;
    expect(consoleWarnStub.calledOnce).to.be.true;
    expect(consoleErrorStub.calledOnce).to.be.true;
  });

  it('Should test Errors mode logs only error types', () => {
    configDefaults.debug.logLevel = DebugLevel.OnlyErrors;
    testAllLogTypes();
    expect(consoleLogStub.notCalled).to.be.true;
    expect(consoleWarnStub.notCalled).to.be.true;
    expect(consoleErrorStub.calledOnce).to.be.true;
  });
}).timeout(31000);
