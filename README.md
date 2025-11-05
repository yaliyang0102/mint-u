# mint-u
Farcaster Mini App: Base NFT Mint (Next.js + thirdweb)
# Base NFT Mint · Farcaster Mini App

Next.js (App Router) + thirdweb v5 + wagmi + Farcaster Mini App SDK

## 快速开始
1. 在 Vercel 添加环境变量：
   - `NEXT_PUBLIC_THIRDWEB_CLIENT_ID=<your thirdweb client id>`
2. 在 `src/app/page.tsx` 把 `CONTRACT` 改为你的 DropERC721 合约地址（Base 主网）。
3. 部署域名后，完善 `public/.well-known/farcaster.json`：
   - 在 Warpcast → Settings → Developer → Domains 生成 `accountAssociation`
   - 将 `iconUrl/homeUrl` 指向你的域名
4. Warpcast 开发者面板 **Verify Manifest** 即可作为 Mini App 打开。

## 本地开发
```bash
npm i
npm run dev


---

### `.gitignore`（你说稍后网页端新建，这里给内容）
```gitignore
# Next.js / Node
node_modules
.next
out
dist
.cache

# env（不要把真实密钥放仓库）
.env
.env.local
.env.*.local

# OS & editor
.DS_Store
*.log
*.swp
