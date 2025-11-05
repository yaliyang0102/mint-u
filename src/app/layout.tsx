import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Mint U",
  description: "Base NFT Mini App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

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

