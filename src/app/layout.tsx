// src/app/layout.tsx
import type { Metadata } from "next"

const miniapp = {
  version: "1",
  imageUrl: "https://mint-u.vercel.app/og.png", // 3:2 的图
  button: {
    title: "Mint now",
    action: {
      type: "launch_miniapp",
      url: "https://mint-u.vercel.app/",         // 打开的小程序页
      name: "Base NFT Mint",
      splashImageUrl: "https://mint-u.vercel.app/splash.png",
      splashBackgroundColor: "#0b0f1a"
    }
  }
} as const

export const metadata: Metadata = {
  other: {
    "fc:miniapp": JSON.stringify(miniapp),
    "fc:frame":   JSON.stringify({ ...miniapp, button:{...miniapp.button, action:{...miniapp.button.action, type:"launch_frame"}} }) // 兼容旧客户端
  }
}
