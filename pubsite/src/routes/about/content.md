# TiCoder 

If you have a question that isn't answered here, or are at all curious about anything else, feel free to [reach out](mailto://tyler@holewinski.dev).

## Motivation

The purpose of TiCoder is to provide a tool for students to kindle an interest in programming. By employing a block-based program editor, we provide
students a way to build programs without worrying about the underlying technical details of typical programming.

Additionally, an [open source tibasic lexer/compiler](https://crates.io/crates/tibrs) was developed in tandem and integrated directly into the web app to eliminate the need for students to download Texas Instruments propritary software— which often times would be simply incompatible with chromebooks or other low-powered student devices.

## TI-Basic

TI-Basic is a scripting langauge developed by Texas Instruments that can be used to automate calculator tasks on most TI graphing calculators, including the TI-83/84(p)(ce) series. Although this language can be powerful, there are a few issues that prevent specifically students from leveraging it.

First, to write such a program on the calculator itself required navigates vast and unweildy submenus with little room for error correction or revisions, as well as just simply having a screen that's not large enough for anything practical.

Further, what would be typical or "simple" operations in other languages almost always require esoteric workarounds and much research to implement. Although there is a solid community around sharing TI-Basic snippets, knowing what to look for in the first place can often be discouraging.

### The Solution

TiCoder solves both of these problems. By linking to the calculator, students can develop the application on their laptop and send the program to their calculator with the press of a button. No extra software. No drivers. No tiny menus.

Further, TiCoder introduces a level of abstraction around typical programming operations. Exposed to the students are various operations that read like typical english, but generate to optimized and community-sourced complex TI-Basic under the hood. The generated code is, of course, always visible to the student alongside the regular editor if they are curious as to what is actually powering their program.

## Google Blockly

Block-based programming lets users snap together visual blocks that each contain operations, rather than requiring students to type out commands via typical "programming". In the case of TI-Basic, this is especially valuable because TI-Basic has such unintuitive syntax and many undocumented "gotchas" that one must be aware of. TiCoder removes all of that from the student, and allows them to simply snap together visually colored blocks.

This "block-based programming" paradigm has been employed in other very successful projects, such as MIT's [scratch](https://scratch.mit.edu), which is widly used as a tool for teaching basic "flash-style animation and programming.

Google publishes [blockly](https://developers.google.com/blockly), which is a framework for developing such applications (including the aformentioned ones). TiCoder leverages this framework for the primary editor.
