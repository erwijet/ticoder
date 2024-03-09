import { api } from "@lib/api";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "./components/shell";
import { User } from "./core/userStore";

export function App(props: { user: User }) {
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.query(["me"]),
  });

  return (
    <Shell>
      <pre>{JSON.stringify({ data })}</pre>
    </Shell>
  );
}
