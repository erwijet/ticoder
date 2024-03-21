import { api } from "@lib/api";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "./components/shell";
import { User } from "./core/userStore";

export function App(props: { user: User }) {
  return (
    <Shell>
      <span>Home</span>
    </Shell>
  );
}
