import { createBlockBuilder } from "better-blockly";

import { cfbGenerator } from "./generator";
import { hues } from "./hues";

const block = createBlockBuilder({
  generator: cfbGenerator,
  customTypes: ["list", "array"],
});

//

block("while-alt")
  .hue(hues.ctrl)
  .slot("check", {
    allow: "Boolean",
    content: (view) => view.text("While"),
  })
  .stmt("body", {
    allow: "*",
  })
  .impl(({ resolve }) => `While ${resolve("check")}\n${resolve("body")}\nEnd`);
