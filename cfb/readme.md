## TiCoder Flavored TiBasic (CFB)

A partial superset of TiBasic, which aims to provide more concice, modern features to TiBasic.

> Please note that not all language/syntax features of TiBasic proper exist in CFB. Implementation of more esotaric instructions is deferred for the time being. Please see [tibrs](https://github.com/erwijet/tibrs) for fully-compliant tibasic tooling.


## Core Features

- [Extended Syntax](#extended-syntax)
- [Lexer/Parser](#lexing-and-parsing)
- [Cross-Blockly Support](#blockly-support)
  - [CFB to Blockly](#to-blockly)
  - [Blockly to CFB](#from-blockly)

---

### Extended Syntax

CFB introduces the following syntax abstractions:

- [menu statments](docs/menu.md)
- [c-style macros](docs/define.md)
- [named variables](docs/variables.md)
  - [1d vectors](docs/variables.md#vec-types)
  - [left-assign operator](docs/variables#assign-operator)
- [alternate while loop syntax](docs/while.md)
- [alternate for loop syntax](docs/for.md)
- [alternate if syntax](docs/if.md)
- [named blocks](docs/named-blocks.md)



Over time, new synatx abstractions are planned to be introduced as well. As it currently stands, though, these are the syntax features of CFB.
