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
} from "@chakra-ui/react";
import Monaco, { OnMount } from "@monaco-editor/react";
import { IconCheck, IconEdit, IconX } from "@tabler/icons-react";
import { initVimMode } from "monaco-vim";
import { Shell } from "src/components/shell";
import { User } from "src/core/userStore";

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
  const handleEditorDidMount: OnMount = (editor, _monaco) => {
    initVimMode(editor, null);
  };

  return (
    <Shell>
      <Stack direction={"row"} w="100%" h="64px" alignItems={"center"}>
        <Editable
          defaultValue="PROGRAM"
          display={"flex"}
          gap={4}
          mx={8}
          alignItems={"center"}
        >
          <Button>
            <EditablePreview />
          </Button>
          <Input as={EditableInput} />
          <ProgramTitleControls />
        </Editable>
      </Stack>
      <Divider mb={4} />
      <Monaco
        height={"calc(100vh - 81px)"}
        width={"100%"}
        onMount={handleEditorDidMount}
        defaultLanguage="ruby"
        defaultValue=""
      />
      <div id="statusbar" />
    </Shell>
  );
}
