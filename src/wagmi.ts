// src/wagmi.ts
import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";

// 只保留 Farcaster 内置连接器（你的需求）
// 如果你需要调试其它钱包，可在 connectors 数组里再追加其它 connector。
export const config = createConfig({
  chains: [base],
  connectors: [farcasterMiniApp()],
  transports: {
    [base.id]: http("https://mainnet.base.org"),
  },
  // 让 wagmi 在 Next SSR/SSG 环境下更稳
  ssr: true,
});
