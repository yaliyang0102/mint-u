// src/app/thirdweb.ts
import { createThirdwebClient } from "thirdweb";

export function getThirdwebClient() {
  const id = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
  if (!id) return null;
  try {
    return createThirdwebClient({ clientId: id });
  } catch {
    return null;
  }
}
