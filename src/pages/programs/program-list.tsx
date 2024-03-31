import {
  Badge,
  Button,
  ButtonGroup,
  Divider,
  HStack,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Kbd,
  Link,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Spinner,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { Program } from "@codegen/api";
import { api } from "src/shared/api";
import { timeAgo } from "src/shared/datetime";
import { downloadBlob } from "src/shared/download";
import { useKey } from "src/shared/react-keys";
import { useTiCalc } from "src/shared/react-ticalc";
import {
  IconCopy,
  IconFileCode,
  IconFileDigit,
  IconFileDownload,
  IconMenu2,
  IconSearch,
  IconTransfer,
  IconTrash,
  IconWorldCancel,
  IconWorldUpload,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { toast } from "sonner";
import { paths, useRouter } from "src/core/router";
import { tifiles } from "ticalc-usb";

export function ProgramList() {
  const [search, setSearch] = useState("");

  function applySearch(each: Program): boolean {
    if (!search) return true;
    return each.name.toLocaleLowerCase().includes(search.toLocaleLowerCase());
  }

  const router = useRouter();

  const {
    data: programs,
    isLoading: isLoadingPrograms,
    refetch: refetchPrograms,
  } = useQuery({
    queryKey: ["programs"],
    queryFn: () => api.query(["program:list"]),
    select: (programs) =>
      programs
        .filter(applySearch)
        .toSorted((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
  });

  const { mutate: createProgram, isPending } = useMutation({
    mutationFn: () =>
      api.mutation(["program:create", { name: "Untitled", blockly: "" }]),
    onSuccess(data) {
      toast.success("Created new program");
      router.programs.nav(data.id);
    },
  });

  const searchRef = useRef(null);
  useKey("/", { action: "focus", ref: searchRef });
  useKey("Escape", { action: "blur", ref: searchRef });

  const { calc, choose, queueFile } = useTiCalc();

  //

  function handleSendToCalc(prgm: Program) {
    toast.promise(
      new Promise<void>((resolve, reject) => {
        choose()
          .then(() => {
            api
              .query(["program:compile", { program_id: prgm.id }])
              .then((res) => {
                if (res.status == "Err") {
                  toast.error("Failed to compile: \n" + res.reason);
                  return reject();
                }

                const buf = new Uint8Array(res.buffer);
                queueFile(tifiles.parseFile(buf), resolve);
              })
              .catch(reject);
          })
          .catch(reject);
      }),
      {
        loading: "Sending to calculator...",
        success: () => "Sent to " + (calc?.name ?? "Calculator"),
        error: (e) => "Interrupted. Please try again",
      }
    );
  }

  async function handleDuplicate(prgm: Program) {
    const { id } = await api.mutation([
      "program:create",
      { name: prgm.name + " (copy)", blockly: prgm.blockly ?? "" },
    ]);

    toast.success(`Successfully duplicated '${prgm.name}'`);
    router.programs.nav(id);
  }

  function handleDownloadTxt(prgm: Program) {
    downloadBlob(prgm.blockly ?? "", {
      name: prgm.name + ".txt",
      type: "text/plain",
    });
  }

  function handleDownload8xp(prgm: Program) {
    toast.promise(
      async () => {
        const res = await api.query([
          "program:compile",
          { program_id: prgm.id },
        ]);

        if (res.status == "Err") throw res.reason;

        downloadBlob(new Uint8Array(res.buffer), {
          name: prgm.name.toUpperCase().slice(0, 8) + ".8xp",
          type: "application/octet-stream",
        });
      },
      {
        loading: `Compiling '${prgm.name}'...`,
        success: `Downloaded '${prgm.name}' 8xp binary`,
        error: "Failed to compile.",
      }
    );
  }

  async function handlePublish(prgm: Program) {
    await api.mutation([
      "program:update",
      { ...prgm, blockly: prgm.blockly ?? "", public: true },
    ]);

    toast.success(`Published '${prgm.name}' successfully.`);
    refetchPrograms();
  }

  async function handleUnpublish(prgm: Program) {
    await api.mutation([
      "program:update",
      { ...prgm, blockly: prgm.blockly ?? "", public: false },
    ]);

    toast.success(`Unpublished '${prgm.name}' successfully.`);
    refetchPrograms();
  }

  async function handleDelete(prgm: Program) {
    if (!confirm(`Are you sure you want to delete '${prgm.name}'?`)) return;

    await api.mutation(["program:delete", prgm.id]);
    toast.success(`Deleted '${prgm.name}' successfully.`);
    refetchPrograms();
  }

  //

  return (
    <Stack h={"100vh"} position={"relative"}>
      <Stack w={"100%"} h={"65px"} gap={0} justifyContent={"space-between"}>
        <div />

        <HStack justifyContent={"space-between"} sx={{ px: 4 }}>
          <Heading as={"h2"} size="lg" justifySelf={"center"}>
            My Programs
          </Heading>

          <HStack>
            <InputGroup size={"md"}>
              <InputLeftElement>
                <IconSearch />
              </InputLeftElement>
              <Input
                ref={searchRef}
                variant={"filled"}
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <InputRightElement>
                <Kbd>/</Kbd>
              </InputRightElement>
            </InputGroup>

            <Button isLoading={isPending} onClick={() => createProgram()}>
              Create
            </Button>
          </HStack>
        </HStack>

        <Divider />
      </Stack>

      {isLoadingPrograms ? (
        <Stack
          sx={{
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            position: "absolute",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spinner />
        </Stack>
      ) : (
        <Stack sx={{ gap: 2 }}>
          {programs?.map((each) => (
            <Stack sx={{ py: 2, px: 4 }} w="100%">
              <HStack w={"100%"} justifyContent={"space-between"}>
                <Stack>
                  <HStack>
                    {
                      <Link
                        as={RouterLink}
                        to={paths.programs.get(each.id)}
                        color="blue.700"
                        fontWeight={700}
                      >
                        {each.name}
                      </Link>
                    }
                    <Badge colorScheme={each.public ? "purple" : undefined}>
                      {each.public ? "public" : "private"}
                    </Badge>
                  </HStack>
                  <Text fontSize={"xs"}>
                    Created {timeAgo(new Date(each.createdAt))}
                  </Text>
                </Stack>
                <ButtonGroup>
                  <Tooltip label="Edit">
                    <IconButton aria-label="edit" variant={"ghost"}>
                      <IconFileCode />
                    </IconButton>
                  </Tooltip>

                  <Menu>
                    <MenuButton
                      as={IconButton}
                      aria-label="options"
                      icon={<IconMenu2 />}
                      variant={"ghost"}
                    />
                    <MenuList>
                      <MenuItem
                        onClick={() => handleSendToCalc(each)}
                        icon={<IconTransfer />}
                      >
                        Send to Calculator
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleDuplicate(each)}
                        icon={<IconCopy />}
                      >
                        Duplicate
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleDownloadTxt(each)}
                        icon={<IconFileDownload />}
                      >
                        Download .txt
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleDownload8xp(each)}
                        icon={<IconFileDigit />}
                      >
                        Download .8xp
                      </MenuItem>
                      {each.public ? (
                        <MenuItem
                          onClick={() => handleUnpublish(each)}
                          icon={<IconWorldCancel />}
                        >
                          Unpublish
                        </MenuItem>
                      ) : (
                        <MenuItem
                          onClick={() => handlePublish(each)}
                          icon={<IconWorldUpload />}
                        >
                          Publish
                        </MenuItem>
                      )}
                      <MenuDivider />
                      <MenuItem
                        onClick={() => handleDelete(each)}
                        icon={<IconTrash />}
                      >
                        Delete
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </ButtonGroup>
              </HStack>
              <Divider />
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
