/*
  Unit tests for the top-level Controllers index.js file
*/

// Public npm libraries
const assert = require("chai").assert;
const sinon = require("sinon");

// Local libraries
const Controllers = require("../../../src/controllers");

describe("#controllers", () => {
  let sandbox, uut;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    uut = new Controllers();
  });

  afterEach(() => sandbox.restore());

  describe("#hello world", () => {
    it("should do something", () => {
      uut.helloWorld();
    });
  });
});
