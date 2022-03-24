/* eslint-disable no-redeclare */
// copied from js-waku 0.17
// removed toJSON because typescript handles this

const DefaultVersion = 0;

export interface WakuMessage {
  payload?: Uint8Array | undefined;
  contentTopic?: string | undefined;
  version?: number | undefined;
  timestamp?: number | undefined;
}

export interface Options {
  payload?: Uint8Array;
  contentTopic?: string;
  version?: number;
  timestamp?: number;
}

export class WakuMessage {
  constructor(opts: Options) {
    this.payload = opts.payload;
    this.contentTopic = opts.contentTopic;
    this.version = opts.version ?? DefaultVersion;
    this.timestamp = opts.timestamp ?? Date.now();
  }

  /**
   * Create Message with an utf-8 string as payload.
   */
  static fromUtf8String(
    utf8: string,
    contentTopic: string,
    opts?: Options,
  ): WakuMessage {
    const payload = Buffer.from(utf8, 'utf8');
    return WakuMessage.fromBytes(payload, contentTopic, opts);
  }

  /**
   * Create a Waku Message with the given payload.
   *
   * By default, the payload is kept clear (version 0).
   * If `opts.encPublicKey` is passed, the payload is encrypted using
   * asymmetric encryption (version 1).
   *
   * If `opts.sigPrivKey` is passed and version 1 is used, the payload is signed
   * before encryption.
   *
   * @throws if both `opts.encPublicKey` and `opt.symKey` are passed
   */
  static fromBytes(
    payload: Uint8Array,
    contentTopic: string,
    opts?: Options,
  ): WakuMessage {
    const timestamp = opts?.timestamp ?? new Date();

    // eslint-disable-next-line no-underscore-dangle
    const _payload = payload;
    const version = DefaultVersion;

    return new WakuMessage({
      payload: _payload,
      timestamp: timestamp.valueOf() * 1000,
      version,
      contentTopic,
    });
  }
}
