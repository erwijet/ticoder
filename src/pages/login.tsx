import { Button, useStatStyles } from "@chakra-ui/react";
import { api } from "@lib/api";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { maybe } from "@tsly/maybe";
import { useUserStore } from "src/core/userStore";

export function Login() {
  const [shouldAuth, setShouldAuth] = useState(false);
  const { setToken } = useUserStore.getState();

  function auth() {
    setShouldAuth(true);
  }

  const { data } = useQuery({
    queryKey: [],
    staleTime: 0,
    enabled: shouldAuth,
    queryFn: () => api.query(["auth"]),
  });

  useEffect(() => {
    maybe(data?.url)?.take((url) => {
      window.location.replace(url);
    });
  }, [data]);

  return <Button onClick={() => auth()}>Continue with Google</Button>;
}
