import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { injected } from "wagmi/connectors";

// 统一导出的 Wagmi 配置
export const config = createConfig({
  chains: [base],
  // 使用默认公共 RPC（可按需换成自有 RPC）
  transports: { [base.id]: http() },
  // 服务端渲染下也能正常工作
  ssr: true,
  // 用 cookie 做持久化，避免刷新掉连接状态
  storage: createStorage({ storage: cookieStorage }),
  // 连接器顺序：先 Farcaster MiniApp，再浏览器注入（MetaMask/Rabby/OKX 等）
  connectors: [
    miniAppConnector(),
    injected({ shimDisconnect: true }),
  ],
});

// 让 TS 能推断 hooks 的 config 类型（可选，但推荐）
declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
