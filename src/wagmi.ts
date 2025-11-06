import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { injected } from "wagmi/connectors"; // 官方入口

export const config = createConfig({
  chains: [base],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: { [base.id]: http() },
  connectors: [
    miniAppConnector(),
    injected({ shimDisconnect: true }),
  ],
});
