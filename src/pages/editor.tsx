import { Shell } from "src/components/shell";
import { User } from "src/core/userStore";
import Monaco from '@monaco-editor/react';

export function Editor(props: { user: User }) {
  return (
    <Shell>
        <Monaco height={'90vh'} width={'80vw'} defaultLanguage="ruby" defaultValue="def main\n\tputs 'hello, world'\nend\n\n#run the program\nmain" />
    </Shell>
  );
}
