"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useBalance, useConnect } from "wagmi";
import { ClaimButton } from "thirdweb/react";
import { base } from "thirdweb/chains";
import { client } from "./providers";
import { sdk } from "@farcaster/miniapp-sdk";
import { createPublicClient, http } from "viem";
import { base as viemBase } from "viem/chains";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ⚠️ 换成你的 DropERC721 合约地址
const CONTRACT = "0xb18d766e6316a93B47338F1661a0b9566C16f979";

// —— 环境变量 —— //
const IPFS_GATEWAY = (process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io").replace(/\/+$/, "");
const IMG_CID = process.env.NEXT_PUBLIC_IMG_CID;
const IMG_COUNT = Number(process.env.NEXT_PUBLIC_IMG_COUNT ?? "8");
const IMG_LIST_RAW =
  process.env.NEXT_PUBLIC_IMG_LIST?.split(",").map((s) => s.trim()).filter(Boolean) || [];
const TOTAL_SUPPLY_FALLBACK = Number(process.env.NEXT_PUBLIC_TOTAL_SUPPLY ?? "100");

// 头像兜底（可选）：如果 context 拿不到头像，强制使用该 URL
const FORCE_PFP = process.env.NEXT_PUBLIC_FORCE_PFP || null;
// 将 ipfs:// 转 https 网关（兼容头像来源为 ipfs 的情况）
const PFP_GATEWAY = (process.env.NEXT_PUBLIC_PFP_GATEWAY || "https://ipfs.io").replace(/\/+$/, "");
function toHttp(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("ipfs://")) return `${PFP_GATEWAY}/ipfs/${url.slice("ipfs://".length)}`;
  return url;
}

// —— 链上读取 —— //
const publicClient = createPublicClient({
  chain: viemBase,
  transport: http("https://mainnet.base.org"),
});

async function tryReadUint(fn: string) {
  try {
    const out = await publicClient.readContract({
      address: CONTRACT as `0x${string}`,
      abi: [
        {
          name: fn,
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ type: "uint256", name: "" }],
        } as const,
      ],
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
      await tryReadUint("nextTokenIdToClaim")
    ) ?? 0n;

  const totalBn =
    preferNonZero(await tryReadUint("maxTotalSupply"), await tryReadUint("maxSupply")) ??
    BigInt(TOTAL_SUPPLY_FALLBACK);

  const minted = Number(mintedBn);
  const total = Number(totalBn || BigInt(TOTAL_SUPPLY_FALLBACK)) || TOTAL_SUPPLY_FALLBACK;
  return { minted, total };
}

// —— 轮播：支持 IMG_LIST（优先）或 IMG_CID —— //
function expandImgUrls(): string[] {
  if (IMG_LIST_RAW.length) {
    const urls: string[] = [];
    const isImage = (u: string) => /\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(u);
    for (const item of IMG_LIST_RAW) {
      if (isImage(item)) {
        urls.push(item);
      } else {
        // 给了“目录链接”则自动补 /1.png…N.png
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

export default function Home() {
  // 先 ready，保证 context 可用
  useEffect(() => {
    sdk.actions.ready().catch(() => {});
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

  // —— 头像：先 ready，再从 user / cast.author 读取；最后用 FORCE_PFP 兜底 —— //
  const [pfp, setPfp] = useState<string | null>(null);
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        await sdk.actions.ready().catch(() => {});
        const anySdk: any = sdk as any;
        const ctx = anySdk?.context || {};
        const user = ctx.user || {};
        const loc = ctx.location || {};
        const author = loc?.cast?.author || {};

        const candidates = [
          user?.pfpUrl, user?.pfp_url, user?.avatar_url,
          author?.pfpUrl, author?.pfp_url, author?.avatar_url,
          FORCE_PFP,
        ].filter(Boolean) as string[];

        for (const raw of candidates) {
          const url = toHttp(raw);
          if (url) { if (!stop) setPfp(url); return; }
        }
        if (!stop) setPfp(null);
      } catch {
        if (!stop) setPfp(FORCE_PFP ? toHttp(FORCE_PFP) : null);
      }
    })();
    return () => { stop = true; };
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 700, color: "#4b6bff" }}>
          {minted}/{total} minted
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {pfp ? (
            <img
              src={pfp}
              width={32}
              height={32}
              style={{ borderRadius: "50%", border: "2px solid #fff", boxShadow: "0 0 0 2px #aab6ff" }}
              alt="pfp"
              onError={() => setPfp(null)}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#8aa0ff",
                display: "grid",
                placeItems: "center",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {(address ?? "U").slice(2, 3).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* 标题 */}
      <h1
        style={{
          textAlign: "center",
          fontSize: 44,
          lineHeight: 1.05,
          margin: "8px 0 16px",
          background: "linear-gradient(90deg,#b05bff,#ff6ac6)",
          WebkitBackgroundClip: "text",
          color: "transparent",
          fontWeight: 900,
        }}
      >
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

      {/* Share / Mint（保持你原来的连接逻辑） */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 420, margin: "0 auto" }}>
        <button
          onClick={() =>
            sdk.actions.composeCast({
              text: "我刚在 Base 铸了一枚 NFT（0.001 ETH）#MintU",
              ...(appUrl ? { embeds: [appUrl] } : {}),
            })
          }
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            background: "#4d76ff",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            boxShadow: "0 6px 16px rgba(77,118,255,.35)",
          }}
        >
          Share
        </button>

        {isConnected ? (
          <ClaimButton
            client={client}
            chain={base}
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
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "#6a5cff",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              boxShadow: "0 6px 16px rgba(106,92,255,.35)",
            }}
          >
            Mint
          </ClaimButton>
        ) : (
          connectors.map((c) => (
            <button
              key={c.id}
              onClick={() => connect({ connector: c })}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: "#6a5cff",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                boxShadow: "0 6px 16px rgba(106,92,255,.35)",
              }}
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
            <b>
              {balance ? Number(balance.formatted).toFixed(4) : "--"} {balance?.symbol ?? "ETH"}
            </b>
          </p>
        ) : (
          <p style={{ opacity: 0.8 }}>请先连接钱包（在 Warpcast Mini App 中打开）</p>
        )}

        {txHash && (
          <p style={{ marginTop: 8 }}>
            交易成功：{" "}
            <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer">
              查看 Tx
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
