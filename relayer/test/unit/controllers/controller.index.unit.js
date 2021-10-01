/*
  Unit tests for the top-level Controllers index.js file
*/

// Public npm libraries
const assert = require("chai").assert;
const sinon = require("sinon");

// Local libraries
const Controllers = require("../../../src/controllers");
const adapters = require("../mocks/adapters");

describe("#controllers", () => {
  let sandbox, uut;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    uut = new Controllers({ adapters });
  });

  afterEach(() => sandbox.restore());

  describe("#constructor", () => {
    it("should throw an error if adapters are not passed in", () => {
      try {
        uut = new Controllers();

        assert.fail("Unexpected code path");
      } catch (err) {
        assert.include(
          err.message,
          "Instance of Adapters library required when instantiating Controllers."
        );
      }
    });
  });

  describe("#hello world", () => {
    it("should do something", () => {
      uut.helloWorld();
    });
  });
});
