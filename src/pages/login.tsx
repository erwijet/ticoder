import { Button } from "@chakra-ui/react";
import { api } from "@lib/api";
import { useQuery } from "@tanstack/react-query";
import { maybe } from "@tsly/maybe";
import { useEffect, useState } from "react";

export function Login() {
  const [shouldAuth, setShouldAuth] = useState(false);

  function auth() {
    setShouldAuth(true);
  }

  const { data } = useQuery({
    queryKey: [],
    staleTime: 0,
    enabled: shouldAuth,
    queryFn: () => api.query(["auth:get_oauth2_url"]),
  });

  useEffect(() => {
    maybe(data?.url)?.take((url) => {
      window.location.replace(url);
    });
  }, [data]);

  return <Button onClick={() => auth()}>Continue with Google</Button>;
}
