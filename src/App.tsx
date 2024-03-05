import { Button } from "@chakra-ui/react";
import { api } from "@lib/api";
import { useQuery } from "@tanstack/react-query";
import { Protected } from "./core/router";
import { User } from "./core/userStore";

export function App(props: { user: User }) {
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.query(["me"]),
  });

  return (
    <div>
      <pre>{JSON.stringify({ data })}</pre>
      <Button
        onClick={() =>
          api
            .mutation(["mut", ["one", "two"]])
            .then((res) => alert(JSON.stringify({ res })))
        }
      >
        Click Me!
      </Button>
    </div>
  );
}