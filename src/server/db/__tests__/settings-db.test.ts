/* globals describe, before, it, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  clearSettingsDB,
  getSettingsBytes,
  getSettingsNumber,
  getSettingsString,
  initSettingsDB,
  storeSettingsBytes,
  storeSettingsNumber,
  storeSettingsString,
  uninitSettingsDB,
} from '../settings-db';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('settings-db', () => {
  it('Should test settings db', async () => {
    initSettingsDB();
    await clearSettingsDB();
    expect(await getSettingsString('str')).to.equal(undefined);
    expect(await getSettingsBytes('byt')).to.equal(undefined);
    expect(await getSettingsNumber('num')).to.equal(undefined);
    await storeSettingsString('str', 'val');
    await storeSettingsBytes('byt', '00a1');
    await storeSettingsNumber('num', 12500);
    expect(await getSettingsString('str')).to.equal('val');
    expect(await getSettingsBytes('byt')).to.equal('00a1');
    expect(await getSettingsNumber('num')).to.equal(12500);
  });

  it('Should test settings db errors', async () => {
    uninitSettingsDB();
    await storeSettingsString('str', 'val');
    await storeSettingsBytes('byt', 'val');
    await storeSettingsNumber('str', 12500);
    expect(await getSettingsString('str')).to.equal(undefined);
    expect(await getSettingsBytes('byt')).to.equal(undefined);
    expect(await getSettingsNumber('num')).to.equal(undefined);
  });
}).timeout(10000);
