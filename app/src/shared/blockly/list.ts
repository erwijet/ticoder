import { block } from "shared/blockly/core";

block("list_set_dim")
    .meta("category", "Lists")
    .meta("shadow-field:num", "size")
    .slot("size", {
        allow: "native-num",
        content: (v) =>
            v
                .text("set size of")
                .variable("var", { types: ["native-lst"] })
                .text("to"),
    })
    .impl(({ fields, resolve }) => `${resolve("size")}->dim(${fields.var}`);

block("list_add")
    .meta("category", "Lists")
    .meta("shadow-field:num", "item")
    .inline()
    .slot("item", { allow: "native-num", content: (v) => v.text("add") })
    .content((v) => v.text("to").variable("var", { types: ["native-lst"] }))
    .impl(({ fields, resolve }) => `${resolve("item")}->${fields.var}(dim(${fields.var})+1`);

block("list_delete")
    .meta("category", "Lists")
    .meta("shadow-field:num", "size")
    .inline()
    .slot("size", { allow: "native-num", content: (v) => v.text("delete first") })
    .content((v) => v.text("items from").variable("var", { types: ["native-lst"] }))
    .impl(
        ({ fields, resolve }) =>
            `seq(${fields.var}([theta]),[theta],1+${resolve("size")},dim(${fields.var})-${resolve("size")})->${fields.var}`,
    );

block("val_lst")
    .meta("category", "Lists")
    .content((v) => v.variable("var", { types: ["native-lst"] }))
    .outputs("native-lst")
    .impl(({ fields }) => fields.var);

block("list_delete_all")
    .meta("category", "Lists")
    .content((v) => v.text("delete all of").variable("var", { types: ["native-lst"] }))
    .impl(({ fields }) => `ClrList ${fields.var}`);

block("list_insert")
    .meta("category", "Lists")
    .meta("shadow", {
        item: { blockType: "val_num", fields: { value: 10 } },
        index: { blockType: "val_num", fields: { value: 1 } },
    })
    .slot("item", { allow: "native-num", content: (v) => v.text("insert") })
    .slot("index", { allow: "native-num", content: (v) => v.text("at") })
    .content((v) => v.text("of").variable("list", { types: ["native-lst"] }))
    .impl(
        ({ fields, resolve }) =>
            `augment(seq(${fields.list}([theta]),[theta],1,${resolve("index")}-1),augment({${resolve("item")}},seq(${
                fields.list
            }([theta]),[theta],${resolve("index")},dim(${fields.list}))))->${fields.list}`,
    );

block("list_replace")
    .meta("category", "Lists")
    .meta("shadow", {
        item: { blockType: "val_num", fields: { value: 10 } },
        index: { blockType: "val_num", fields: { value: 1 } },
    })
    .inline()
    .slot("index", { allow: "native-num", content: (v) => v.text("replace item") })
    .slot("item", {
        allow: "native-num",
        content: (v) =>
            v
                .text("of")
                .variable("list", { types: ["native-lst"] })
                .text("with"),
    })
    .impl(({ fields, resolve }) => `${resolve("item")}->${fields.list}(${resolve("index")}`);

block("val_list_item_at")
    .meta("category", "Lists")
    .meta("shadow-value:num", 1)
    .meta("shadow-field:num", "index")
    .slot("index", { allow: "native-num", content: (v) => v.text("item") })
    .content((v) => v.text("of").variable("list", { types: ["native-lst"] }))
    .outputs("native-num")
    .impl(({ resolve, fields }) => `${fields.list}(${resolve("index")})`);

block("val_list_index_of")
    .meta("category", "Lists")
    .meta("shadow-field:num", "item")
    .slot("item", { allow: "native-num", content: (v) => v.text("item # of") })
    .content((v) => v.text("in").variable("list", { types: ["native-lst"] }))
    .outputs("native-num")
    .impl(({ resolve, fields }) => `(1+(sum(not(cumSum(${fields.list}=${resolve("item")})))))`);

block("val_list_len")
    .meta("category", "Lists")
    .content((v) => v.text("size of").variable("list", { types: ["native-lst"] }))
    .outputs("native-num")
    .impl(({ fields }) => `dim(${fields.list})`);

block("val_list_contains")
    .meta("category", "Lists")
    .meta("shadow-field:num", "item")
    .slot("item", { allow: "native-num", content: (v) => v.variable("list", { types: ["native-lst"] }).text("contains") })
    .outputs("bool")
    .impl(({ fields, resolve }) => `max(not(${fields.list}-${resolve("item")}))`);

block("val_list_minmax")
    .meta("category", "Lists")
    .content((v) =>
        v
            .dropdown("op", ["min", "max"])
            .text("of")
            .variable("list", { types: ["native-lst"] }),
    )
    .outputs("native-num")
    .impl(({ fields }) => `${fields.op}(${fields.list})`);

block("list_copy")
    .meta("category", "Lists")
    .content((v) =>
        v
            .text("copy")
            .variable("from", { types: ["native-lst"] })
            .text("to")
            .variable("to", { types: ["native-lst"] }),
    )
    .impl(({ fields }) => `${fields.from}->${fields.to}`);

block("list_foreach")
    .meta("category", "Lists")
    .content((v) =>
        v
            .text("for each ")
            .variable("each-var", { types: ["native-num"] })
            .text("in")
            .variable("list-var", { types: ["native-lst"] }),
    )
    .stmt("body", { allow: "*" })
    .impl(
        ({ fields, resolve }) =>
            `For([theta],1,dim(${fields["list-var"]}))\n${fields["list-var"]}([theta]->${fields["each-var"]}\n${resolve("body")}\nEnd`,
    );

block("list_from_str")
    .meta("category", "Lists")
    .slot("str", {
        allow: "native-str",
        content: (v) =>
            v
                .text("set")
                .variable("list", { types: ["native-lst"] })
                .text("to letter values of"),
    })
    .impl(
        ({ fields, resolve }) =>
            `seq(inString({@@charmap},sub(${resolve("str")},[theta],1)),[theta],1,length(${resolve("str")}->${fields.list}`,
    );
