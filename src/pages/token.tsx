import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRouter } from "src/core/router";
import { useUserStore } from "src/core/userStore";

export function Token() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const router = useRouter();

  const { setToken } = useUserStore.getState();

  useEffect(() => {
    if (!token) router.login.nav();
    else {
      setToken(token);
      router.root.nav();
    }
  }, [token]);

  return <>Loading...</>;
}
