"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAccount, useBalance, useConnect } from "wagmi";
import { ClaimButton } from "thirdweb/react";
import { base as thirdwebBase } from "thirdweb/chains";
import { createThirdwebClient } from "thirdweb";
import { sdk } from "@farcaster/miniapp-sdk";
import { createPublicClient, http, type Address } from "viem";
import { base as viemBase } from "viem/chains";


const CONTRACT = "0xb18d766e6316a93B47338F1661a0b9566C16f979";


const IPFS_GATEWAY = (process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io").replace(/\/+$/, "");
const IMG_CID = process.env.NEXT_PUBLIC_IMG_CID;
const IMG_COUNT = Number(process.env.NEXT_PUBLIC_IMG_COUNT ?? "8");
const IMG_LIST_RAW = process.env.NEXT_PUBLIC_IMG_LIST?.split(",").map(s => s.trim()).filter(Boolean) || [];
const TOTAL_SUPPLY_FALLBACK = Number(process.env.NEXT_PUBLIC_TOTAL_SUPPLY ?? "100");

// —— 链上读取 —— //
const publicClient = createPublicClient({
  chain: viemBase,
  transport: http("https://mainnet.base.org"),
});

async function tryReadUint(fn: string) {
  try {
    const out = await publicClient.readContract({
      address: CONTRACT as Address, // ✅ 改成 Address，避免 SWC 解析模板字面量类型
      abi: [
        {
          name: fn,
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ type: "uint256", name: "" }],
        },
      ] as const,
      functionName: fn as any,
    });
    return BigInt(out as any);
  } catch {
    return null;
  }
}

function preferNonZero(...vals: Array<bigint | null | undefined>): bigint | null {
  for (const v of vals) if (v != null && v !== 0n) return v;
  return null;
}

async function fetchMintProgress() {
  const mintedBn =
    preferNonZero(
      await tryReadUint("totalMinted"),
      await tryReadUint("totalSupply"),
      await tryReadUint("nextTokenIdToClaim"),
    ) ?? 0n;

  const totalBn =
    preferNonZero(await tryReadUint("maxTotalSupply"), await tryReadUint("maxSupply")) ??
    BigInt(TOTAL_SUPPLY_FALLBACK);

  return { minted: Number(mintedBn), total: Number(totalBn) || TOTAL_SUPPLY_FALLBACK };
}

// —— 轮播：支持 IMG_LIST（优先）或 IMG_CID —— //
function expandImgUrls(): string[] {
  if (IMG_LIST_RAW.length) {
    const urls: string[] = [];
    const isImage = (u: string) => /\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(u);
    for (const item of IMG_LIST_RAW) {
      if (isImage(item)) urls.push(item);
      else {
        const dir = item.replace(/\/+$/, "");
        for (let i = 1; i <= IMG_COUNT; i++) urls.push(`${dir}/${i}.png`);
      }
    }
    return urls;
  }
  if (IMG_CID) {
    return Array.from({ length: IMG_COUNT }, (_, i) => `${IPFS_GATEWAY}/ipfs/${IMG_CID}/${i + 1}.png`);
  }
  return [];
}

export default function HomeClient() {
  // 全局错误监听（便于定位运行时异常）
  useEffect(() => {
    const onErr = (e: ErrorEvent) => console.error("GlobalError:", e.message, e.error);
    const onRej = (e: PromiseRejectionEvent) => console.error("UnhandledRejection:", e.reason);
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  useEffect(() => {
    sdk.actions.ready().catch(() => {});
  }, []);

  // 懒创建 thirdweb client（缺 env 时不崩页）
  const client = useMemo(() => {
    const id = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
    if (!id) {
      console.warn("Missing NEXT_PUBLIC_THIRDWEB_CLIENT_ID");
      return null;
    }
    try {
      return createThirdwebClient({ clientId: id });
    } catch (e) {
      console.error("thirdweb client init failed:", e);
      return null;
    }
  }, []);

  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();

  const { data: balance } = useBalance({
    address,
    chainId: 8453,
    query: { refetchInterval: 15000, refetchOnWindowFocus: false },
  });

  const [txHash, setTxHash] = useState<string | null>(null);

  // —— 已铸/总量 —— //
  const [{ minted, total }, setProgress] = useState<{ minted: number; total: number }>({
    minted: 0,
    total: TOTAL_SUPPLY_FALLBACK,
  });

  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const p = await fetchMintProgress();
        if (!stop) setProgress(p);
      } catch {}
    };
    load();
    const t = setInterval(load, 20000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);

  // —— 头像（先尝试 context.user，再尝试 cast.author） —— //
  const [pfp, setPfp] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        await sdk.actions.ready();
        const anySdk: any = sdk as any;
        const u = anySdk?.context?.user;
        const loc = anySdk?.context?.location;
        const fromUser = u?.pfpUrl || u?.pfp_url || u?.avatar_url;
        const fromCast =
          (loc?.type === "cast_embed" || loc?.type === "cast_share") ? loc?.cast?.author?.pfpUrl : undefined;
        setPfp(fromUser || fromCast || null);
      } catch {}
    })();
  }, []);

  // —— 轮播 —— //
  const allImgs = useMemo(() => expandImgUrls(), []);
  const [badSet, setBadSet] = useState<Set<string>>(new Set());
  const imgs = useMemo(() => allImgs.filter((u) => !badSet.has(u)), [allImgs, badSet]);

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!imgs.length) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % imgs.length), 2500);
    return () => clearInterval(t);
  }, [imgs.length]);

  const appUrl = typeof window !== "undefined" ? window.location.href : undefined;

  return (
    <main
      style={{
        minHeight: "100svh",
        padding: 16,
        background: "linear-gradient(180deg,#c9dcff 0%,#b8d0ff 30%,#a9c7ff 100%)",
      }}
    >
      {/* 顶部条 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: "#4b6bff" }}>{minted}/{total} minted</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {pfp ? (
            <img src={pfp} width={32} height={32} style={{ borderRadius: "50%", border: "2px solid #fff", boxShadow: "0 0 0 2px #aab6ff" }} alt="pfp" />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#8aa0ff", display: "grid", placeItems: "center", color: "#fff", fontWeight: 700 }}>
              {(address ?? "U").slice(2, 3).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* 标题 */}
      <h1 style={{ textAlign: "center", fontSize: 44, lineHeight: 1.05, margin: "8px 0 16px", background: "linear-gradient(90deg,#b05bff,#ff6ac6)", WebkitBackgroundClip: "text", color: "transparent", fontWeight: 900 }}>
        Mint U！
      </h1>

      <p style={{ textAlign: "center", color: "#375", opacity: 0.8, marginBottom: 16 }}>
        your cute onchain companions · generative collection on Base
      </p>

      {/* 主图卡片 */}
      <div
        style={{
          maxWidth: 420,
          margin: "0 auto 16px",
          background: "#bfe6ff",
          borderRadius: 16,
          height: 360,
          display: "grid",
          placeItems: "center",
          boxShadow: "0 10px 20px rgba(85,120,255,.25)",
          border: "1px solid rgba(80,110,255,.3)",
        }}
      >
        {imgs.length ? (
          <img
            key={imgs[idx]}
            src={imgs[idx]}
            alt="collection"
            style={{ width: "82%", height: "82%", objectFit: "cover", borderRadius: 12 }}
            onError={() =>
              setBadSet((prev) => {
                const ns = new Set(prev);
                ns.add(imgs[idx]);
                return ns;
              })
            }
          />
        ) : (
          <div style={{ opacity: 0.6, fontWeight: 600, color: "#557", padding: 12, textAlign: "center" }}>
            图片加载失败或未配置。请在 Vercel 设置
            <br />
            <b>NEXT_PUBLIC_IMG_LIST</b>（逗号分隔完整图片 URL）
            <br />或 <b>NEXT_PUBLIC_IMG_CID</b> + <b>NEXT_PUBLIC_IMG_COUNT</b>
          </div>
        )}
      </div>

      {/* Share / Mint */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 420, margin: "0 auto" }}>
        <button
          onClick={() =>
            sdk.actions.composeCast({
              text: "我刚在 Base 铸了一枚 NFT（0.001 ETH）#MintU",
              ...(appUrl ? { embeds: [appUrl] } : {}),
            })
          }
          style={{ padding: "12px 16px", borderRadius: 12, background: "#4d76ff", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, boxShadow: "0 6px 16px rgba(77,118,255,.35)" }}
        >
          Share
        </button>

        {isConnected ? (
          client ? (
            <ClaimButton
              client={client}
              chain={thirdwebBase}
              contractAddress={CONTRACT}
              claimParams={{ type: "ERC721" as const, quantity: 1n }}
              onTransactionConfirmed={(tx) => {
                setTxHash(tx.transactionHash);
                if (appUrl) {
                  sdk.actions.composeCast({
                    text: "我刚在 Base 铸了一枚 NFT（0.001 ETH）#MintU",
                    embeds: [appUrl],
                  });
                }
              }}
              onError={(e) => alert(`交易失败：${(e as Error).message}`)}
              style={{ padding: "12px 16px", borderRadius: 12, background: "#6a5cff", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, boxShadow: "0 6px 16px rgba(106,92,255,.35)" }}
            >
              Mint
            </ClaimButton>
          ) : (
            <button
              onClick={() => alert("缺少 NEXT_PUBLIC_THIRDWEB_CLIENT_ID，去 Vercel → Settings → Environment Variables 添加后再部署")}
              style={{ padding: "12px 16px", borderRadius: 12, background: "#6a5cff", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, boxShadow: "0 6px 16px rgba(106,92,255,.35)" }}
            >
              配置后可 Mint
            </button>
          )
        ) : (
          connectors.map((c) => (
            <button
              key={c.id}
              onClick={() => connect({ connector: c })}
              style={{ padding: "12px 16px", borderRadius: 12, background: "#6a5cff", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, boxShadow: "0 6px 16px rgba(106,92,255,.35)" }}
            >
              连接 {c.name}
            </button>
          ))
        )}
      </div>

      {/* 下方：余额 + 成功提示 */}
      <div style={{ maxWidth: 420, margin: "12px auto 0", textAlign: "center", color: "#334" }}>
        {isConnected ? (
          <p>
            Base 余额：{" "}
            <b>{balance ? Number(balance.formatted).toFixed(4) : "--"} {balance?.symbol ?? "ETH"}</b>
          </p>
        ) : (
          <p style={{ opacity: 0.8 }}>请先连接钱包（在 Warpcast Mini App 中打开）</p>
        )}
        {txHash && (
          <p style={{ marginTop: 8 }}>
            交易成功： <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer">查看 Tx</a>
          </p>
        )}
      </div>
    </main>
  );
}
