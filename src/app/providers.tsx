"use client";

import { ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useReconnect } from "wagmi";
import { ThirdwebProvider } from "thirdweb/react";
import { base as thirdwebBase } from "thirdweb/chains";
import { config } from "../wagmi";
import { sdk } from "@farcaster/miniapp-sdk";
+ import { getThirdwebClient } from "./thirdweb";

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
+  const client = getThirdwebClient();

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
-       <ThirdwebProvider
-         clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
-         activeChain={thirdwebBase}
-       >
-         <AutoReconnect />
-         {children}
-       </ThirdwebProvider>
+       {client ? (
+         <ThirdwebProvider client={client} activeChain={thirdwebBase}>
+           <AutoReconnect />
+           {children}
+         </ThirdwebProvider>
+       ) : (
+         <>
+           <AutoReconnect />
+           {children}
+         </>
+       )}
      </WagmiProvider>
    </QueryClientProvider>
  );
}
