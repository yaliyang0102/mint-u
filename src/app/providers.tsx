"use client";

import { ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useReconnect } from "wagmi";
import { config } from "../wagmi";
import { sdk } from "@farcaster/miniapp-sdk";
import { ThirdwebProvider } from "thirdweb/react"; // ✅ v5: 只负责提供 QueryClient，不传任何 props

const queryClient = new QueryClient();

function AutoReconnect() {
  const { reconnect } = useReconnect();
  useEffect(() => {
    (async () => {
      try { await sdk.actions.ready(); } catch {}
      reconnect();
    })();
  }, [reconnect]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <ThirdwebProvider>
          <AutoReconnect />
          {children}
        </ThirdwebProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
