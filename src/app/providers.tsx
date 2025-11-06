"use client";

import { ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useReconnect } from "wagmi";
import { config } from "../wagmi";
import { sdk } from "@farcaster/miniapp-sdk";

const queryClient = new QueryClient();

function AutoReconnect() {
  const { reconnect } = useReconnect();
  useEffect(() => {
    (async () => {
      try { await sdk.actions.ready(); } catch {}
      reconnect(); // Mini App 环境里触发一次重连
    })();
  }, [reconnect]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <AutoReconnect />
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  );
}
