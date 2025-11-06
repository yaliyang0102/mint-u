// ✅ 建议写法：懒创建 + 容错
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
