import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [base],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [base.id]: http(), // 可改为自有 RPC
  },
  connectors: [
    miniAppConnector(),                // Farcaster Mini App 内置钱包（自动连接）
    injected({ shimDisconnect: true }),// 浏览器兜底（Metamask 等）
  ],
});
