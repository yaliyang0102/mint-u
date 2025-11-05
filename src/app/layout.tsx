export const metadata = {
  title: "Base NFT Mint",
  description: "Farcaster Mini App · Mint on Base (thirdweb)"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body style={{ fontFamily: "ui-sans-serif, system-ui", background: "#0b0b0d", color: "#fff" }}>
        {children}
      </body>
    </html>
  );
}
