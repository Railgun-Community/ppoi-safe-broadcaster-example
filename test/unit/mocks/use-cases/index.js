class FeeUseCaseMock {
  getFee() {
    return 10;
  }
}

class UseCasesMock {
  constructor(localConfig = {}) {
  }

  fee = new FeeUseCaseMock();

}

module.exports = UseCasesMock;
