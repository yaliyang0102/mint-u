import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { injected } from "@wagmi/connectors/injected"; // ✅ 关键！

export const config = createConfig({
  chains: [base],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: { [base.id]: http() },
  connectors: [
    miniAppConnector(),               // Farcaster Mini App 内置钱包
    injected({ shimDisconnect: true })// 浏览器兜底（Metamask/OKX/Bitget 等）
  ],
});
