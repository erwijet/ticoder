import {
  Badge,
  Text,
  ButtonGroup,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  IconButton,
  Input,
  Stack,
  useEditableControls,
  FormControl,
  FormLabel,
  Kbd,
  Button,
  Divider,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuOptionGroup,
  MenuItemOption,
} from "@chakra-ui/react";
import { api } from "@lib/api";
import Monaco, { OnMount } from "@monaco-editor/react";
import {
  IconCalculator,
  IconCheck,
  IconChevronCompactDown,
  IconChevronDown,
  IconEdit,
  IconX,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { err } from "@tsly/core";
import { useWaitFor } from "@tsly/hooks";
import { initVimMode } from "monaco-vim";
import { run } from "node:test";
import { useEffect, useState } from "react";
import { Shell } from "src/components/shell";
import { User } from "src/core/userStore";
import { ticalc, tifiles } from 'ticalc-usb';
import { collapseTextChangeRangesAcrossMultipleVersions } from "typescript";

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

export function Editor(props: { user: User }) {
  const [name, setName] = useState("PROGRAM");
  const [blockly, setBlockly] = useState("");
  const [calc, setCalc] = useState<any>(null);
  const [didInit, setDidInit] = useState(false);

  const handleEditorDidMount: OnMount = (editor, _monaco) => {
    initVimMode(editor, null);
  };

  useEffect(() => {
    if (didInit) return;

    ticalc.init({ supportLevel: 'none' });

    ticalc.addEventListener('disconnect', (target: any) => {
      if (calc != target) return;
      setCalc(null);
    });

    ticalc.addEventListener('connect', async (target: any) => {
      if (await target.isReady()) { // <-- fails here
        setCalc(target);
      }
    });

    setDidInit(true);
  }, []);

  async function run() {
    await ticalc.choose();
  }

  return (
    <Shell>
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
            <Button onClick={() => run()}>Run</Button>
            <Menu closeOnSelect={false}>
              <MenuButton as={Button} rightIcon={<IconChevronDown size={16} />}>
                More
              </MenuButton>
              <MenuList>
                <MenuOptionGroup type="checkbox" title="Editor Settings">
                  <MenuItemOption value="vim">Vim Mode</MenuItemOption>
                </MenuOptionGroup>
              </MenuList>
            </Menu>
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
    </Shell>
  );
}
