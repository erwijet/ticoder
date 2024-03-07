import { useEffect } from "react";
import { useRouter } from "src/core/router";
import { useUserStore } from "src/core/userStore";

export function Logout() {
  const { clearToken } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    clearToken();
    router.root.nav();
  }, []);

  return null;
}
