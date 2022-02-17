import debug from 'debug';

// Simple wrapper for stubbing debug() functions
// which don't have objects.
export default class DebugWrapper {
  dbg: debug.Debugger;

  constructor(namespace: string) {
    this.dbg = debug(namespace);
  }

  call(obj: any) {
    this.dbg(obj);
  }
}
