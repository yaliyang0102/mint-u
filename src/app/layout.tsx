import type { Metadata } from "next";
import { Providers } from "./providers";

const miniapp = {
  version: "1",
  imageUrl: "https://mint-u.vercel.app/og.png",
  button: {
    title: "Mint now",
    action: {
      type: "launch_miniapp",
      url: "https://mint-u.vercel.app/",
      name: "Mint U!",
      splashImageUrl: "https://mint-u.vercel.app/splash.png",
      splashBackgroundColor: "#0b0f1a",
    },
  },
} as const;

export const metadata: Metadata = {
  other: {
    "fc:miniapp": JSON.stringify(miniapp),
    "fc:frame": JSON.stringify({
      ...miniapp,
      button: { ...miniapp.button, action: { ...miniapp.button.action, type: "launch_frame" } },
    }),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
