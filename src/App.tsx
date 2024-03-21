import { Shell } from "./components/shell";
import { User } from "./core/userStore";

export function App(props: { user: User }) {
  return (
    <Shell>
      <span>Home</span>
    </Shell>
  );
}
