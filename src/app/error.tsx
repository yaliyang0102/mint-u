"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error:", error);
  }, [error]);

  return (
    <div style={{ padding: 16 }}>
      <h2>页面出错了</h2>
      <p style={{ opacity: 0.8 }}>
        详细错误已写入浏览器控制台（DevTools → Console）。
      </p>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f6f8fa", padding: 12, borderRadius: 8 }}>
        {error.message}
      </pre>
      <button onClick={() => reset()} style={{ marginTop: 12 }}>
        重试
      </button>
    </div>
  );
}
