import {
  FallbackProvider,
  StaticJsonRpcProvider,
  WebSocketProvider,
} from '@ethersproject/providers';
import { FallbackProviderJsonConfig } from '../../models/provider-models';

export const createFallbackProviderFromJsonConfig = (
  config: FallbackProviderJsonConfig,
): FallbackProvider => {
  const providers = config.providers.map((json) => {
    const isWebsocket = json.provider.startsWith('wss');
    const provider = isWebsocket
      ? new WebSocketProvider(json.provider, Number(config.chainId))
      : new StaticJsonRpcProvider(json.provider, Number(config.chainId));
    return {
      ...json,
      provider,
    };
  });
  const quorum = 1;
  return new FallbackProvider(providers, quorum);
};
