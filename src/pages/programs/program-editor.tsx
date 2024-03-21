import {
  Button,
  ButtonGroup,
  Divider,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  HStack,
  IconButton,
  Input,
  Spinner,
  Stack,
  useEditableControls
} from "@chakra-ui/react";
import { api } from "@lib/api";
import { useTiCalc } from "@lib/react-ticalc";
import Monaco, { OnMount } from "@monaco-editor/react";
import {
  IconCheck,
  IconEdit,
  IconX
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { err } from "@tsly/core";
import { initVimMode } from "monaco-vim";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { tifiles } from "ticalc-usb";

function ProgramTitleControls() {
  const {
    isEditing,
    getSubmitButtonProps,
    getCancelButtonProps,
    getEditButtonProps,
  } = useEditableControls();

  return isEditing ? (
    <ButtonGroup justifyContent={"center"} size="sm">
      <IconButton
        aria-label="submit"
        icon={<IconCheck />}
        {...getSubmitButtonProps()}
      />
      <IconButton
        aria-label="cancel"
        icon={<IconX />}
        {...getCancelButtonProps()}
      />
    </ButtonGroup>
  ) : (
    <Flex justifyContent={"center"}>
      <IconButton
        aria-label="edit"
        size={"sm"}
        icon={<IconEdit />}
        {...getEditButtonProps()}
      />
    </Flex>
  );
}

export function ProgramEditor(props: { id: string }) {
  const [name, setName] = useState("PROGRAM");
  const [blockly, setBlockly] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["program", props.id],
    queryFn: () =>
      api.query(["program:get", { program_id: parseInt(props.id) }]),
  });

  useEffect(() => {
    if (!data) return;

    setBlockly(data.blockly ?? "");
    setName(data.name);
  }, [data]);

  const handleEditorDidMount: OnMount = (editor, _monaco) => {
    initVimMode(editor, null);
  };

  const { calc, choose, queueFile } = useTiCalc();

  async function run() {
    if (!data) return;
    const { public: isPublic, id } = data;
    await api.mutation([
      "program:update",
      { id, public: isPublic, name, blockly },
    ]);

    await choose();
    const compiled = await api.query(["program:compile", { program_id: id }]);

    if (compiled.status == "Err") return err(compiled.reason);

    const file = tifiles.parseFile(new Uint8Array(compiled.buffer));

    await new Promise<void>((resolve) => {
      queueFile(file, resolve);
    });
  }

  async function save() {
    if (!data) return;
    const { public: isPublic, id } = data;

    await api
      .mutation(["program:update", { id, public: isPublic, name, blockly }])
      .then(() => {
        toast.success(name + " saved");
      });
  }

  return isLoading ? (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Spinner />
    </div>
  ) : (
    <>
      <Stack w={"100%"} h={"65px"} gap={0}>
        <Stack
          direction={"row"}
          w="100%"
          h="100%"
          px={8}
          alignItems={"center"}
          justifyContent={"space-between"}
        >
          <HStack>
            <Editable
              value={name}
              onChange={(v) => setName(v)}
              defaultValue="PROGRAM"
              display={"flex"}
              gap={1}
              alignItems={"center"}
            >
              <Button size={"sm"}>
                <EditablePreview />
              </Button>
              <Input as={EditableInput} />
              <ProgramTitleControls />
            </Editable>
          </HStack>

          <HStack>
            <Button
              onClick={() =>
                toast.promise(run(), {
                  loading: "Sending to calculator...",
                  success: () => "Sent to " + (calc?.name ?? "Calculator"),
                  error: (e) => "Interrupted. Please try again",
                })
              }
            >
              Run
            </Button>
            <Button onClick={() => save()}>Save</Button>
          </HStack>
        </Stack>

        <Divider />
      </Stack>
      <Monaco
        value={blockly}
        onChange={(v) => setBlockly(v ?? "")}
        height={"calc(100vh - 81px)"}
        width={"100%"}
        options={{
          minimap: {
            enabled: false,
          },
        }}
        onMount={handleEditorDidMount}
        defaultLanguage="ruby"
      />
      <div id="statusbar" />
    </>
  );
}
