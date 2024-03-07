import { Button } from "@chakra-ui/react";
import { api } from "@lib/api";
import { useQuery } from "@tanstack/react-query";
import { Protected } from "./core/router";
import { User } from "./core/userStore";
import Navbar from "./components/navbar";

export function App(props: { user: User }) {
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.query(["me"]),
  });

  return (
    <div>
      <Navbar />
      <pre>{JSON.stringify({ data })}</pre>
    </div>
  );
}
