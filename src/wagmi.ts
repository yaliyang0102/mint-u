// wagmi.ts
import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
// 可选：给浏览器访问时的兜底连接器
import { injected } from "wagmi/connectors"; 
// import { walletConnect } from "wagmi/connectors"; // 如需再加 WC

export const config = createConfig({
  chains: [base],
  ssr: true, // Next.js App Router 推荐开启
  storage: createStorage({ storage: cookieStorage }), // 持久化连接状态（可选）
  transports: {
    [base.id]: http(), // 用默认 RPC；也可换成你自己的 RPC
  },
  connectors: [
    miniAppConnector(),            // ✅ Farcaster Mini App 内置钱包（自动连接）
    injected({ shimDisconnect: true }), // ⛑️ 浏览器访问的兜底（Metamask 等）
    // walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_ID! }),
  ],
});
