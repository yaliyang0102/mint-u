import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// 用最稳妥的 injected 连接器（Warpcast Mini App 会注入 EIP-1193 provider）
export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http("https://mainnet.base.org"),
  },
  connectors: [injected()],
});
