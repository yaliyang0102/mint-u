import { Providers } from "./providers";

export const metadata = {
  title: "Base NFT Mint",
  description: "Farcaster Mini App · Mint on Base (thirdweb)",
};

// src/app/layout.tsx（节选）
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const SITE = "https://mint-u.vercel.app/";
  const miniapp = {
    version: "1",
    imageUrl: `${SITE}/og.png`,
    button: {
      title: "Mint on Base",
      action: {
        type: "launch_miniapp",
        url: SITE,
        // 可选：自定义启动过渡图和底色
        // splashImageUrl: `${SITE}/og.png`,
        // splashBackgroundColor: "#10131a",
      },
    },
  };

  return (
    <html lang="zh-CN">
      <head>
        {/* Farcaster Mini App 的分享卡片（必需） */}
        <meta name="fc:miniapp" content={JSON.stringify(miniapp)} />
        {/* 兼容老客户端的回退标签（可选） */}
        <meta name="fc:frame" content={JSON.stringify({ ...miniapp, button: { ...miniapp.button, action: { ...miniapp.button.action, type: "launch_frame" } } })} />

        {/* 常规 OG / Twitter 预览（推荐） */}
        <meta property="og:title" content="Mint U — Base NFT Mini App" />
        <meta property="og:description" content="Mint U！在 Base 链一键铸造，并分享到 Farcaster。" />
        <meta property="og:image" content={`${SITE}/og.png`} />
        <meta property="og:url" content={SITE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${SITE}/og.png`} />
        <meta name="twitter:title" content="Mint U — Base NFT Mini App" />
        <meta name="twitter:description" content="Mint U！在 Base 链一键铸造，并分享到 Farcaster。" />
      </head>
      <body>{children}</body>
    </html>
  );
}

