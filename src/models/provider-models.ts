type ProviderConfig = {
  priority: number;
  weight: number;
  provider: string;
  stallTimeout?: number;
};

export type FallbackProviderJsonConfig = {
  chainId: number;
  providers: ProviderConfig[];
};
