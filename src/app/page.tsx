"use client";

import { useAccount, useConnect } from "wagmi";
import { ClaimButton } from "thirdweb/react";
import { base } from "thirdweb/chains";
import { client } from "./providers";
import { sdk } from "@farcaster/miniapp-sdk";
import { useState } from "react";

// ⚠️ 换成你的 DropERC721 合约地址
const CONTRACT = "0xYourDropERC721Address";

export default function Home() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const [txHash, setTxHash] = useState<string | null>(null);

  return (
    <main style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Base NFT Mint</h1>
      <p style={{ opacity: 0.8, marginBottom: 24 }}>
        价格：<b>0.001 ETH</b> · 网络：<b>Base</b>
      </p>

      {!isConnected ? (
        <>
          <p style={{ marginBottom: 12 }}>在 Farcaster Mini App 中打开，点击下方按钮连接钱包：</p>
          {connectors.map((c) => (
            <button
              key={c.id}
              onClick={() => connect({ connector: c })}
              style={{
                marginRight: 8,
                marginBottom: 8,
                padding: "10px 14px",
                borderRadius: 12,
                background: "#1d1f2b",
                color: "#fff",
                border: "1px solid #2f3242",
                cursor: "pointer"
              }}
            >
              连接 {c.name}
            </button>
          ))}
        </>
      ) : (
        <>
          <p style={{ wordBreak: "break-all", marginBottom: 16 }}>已连接：{address}</p>

          <ClaimButton
            client={client}
            chain={base}
            contractAddress={CONTRACT}
            onTransactionConfirmed={(tx) => {
              setTxHash(tx.transactionHash);
              sdk.actions.composeCast({
                text: "我刚在 Base 铸了一枚 NFT（0.001 ETH）#IceBrain",
                embeds: [{ url: typeof window !== "undefined" ? window.location.href : "" }]
              });
            }}
            onError={(e) => alert(`交易失败：${(e as Error).message}`)}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "#6a5cff",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Mint（0.001 ETH）
          </ClaimButton>

          {txHash && (
            <p style={{ marginTop: 12 }}>
              交易成功：<a href={`https://basescan.org/tx/${txHash}`} target="_blank">查看 Tx</a>
            </p>
          )}
        </>
      )}
    </main>
  );
}
