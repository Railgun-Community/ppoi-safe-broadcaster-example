type ProviderConfig = {
  priority: number;
  weight: number;
  provider: string;
};

export type FallbackProviderJsonConfig = {
  chainId: number;
  providers: ProviderConfig[];
};
