import { useParams } from "react-router-dom";
import { Shell } from "src/components/shell";
import { User } from "src/core/userStore";
import { match, P } from "ts-pattern";
import { ProgramList } from "./program-list";
import { ProgramEditor } from "./program-editor";
import { err } from "@tsly/core";

export function ProgramPage(_props: { user: User }) {
  const params = useParams();

  return (
    <Shell>
      {match(params["id"])
        .with("list", () => <ProgramList />)
        .with(P.string, (id) => <ProgramEditor id={id} />)
        .otherwise(() => err("failed to match"))}
    </Shell>
  );
}
