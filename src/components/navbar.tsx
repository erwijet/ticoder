import {
  Box,
  Button,
  Divider,
  Heading,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  VStack,
  useToken,
} from "@chakra-ui/react";
import { css } from "@emotion/css";
import { err } from "@tsly/core";
import { Link, useLocation } from "react-router-dom";
import { User, useUserStore } from "src/core/userStore";
import Brand from "../public/brand.svg?react";
import { RouterPath, paths, router, useRouter } from "src/core/router";
import { IconCode, IconHome } from "@tabler/icons-react";

// const items = [paths.root, paths.editor] satisfies RouterPath[];

export const Navbar = () => {
  const user: User = useUserStore((s) => s.user) ?? err("user data not set");
  const { pathname } = useLocation();
  const [fill] = useToken("colors", ["gray.300"]);

  return (
    <Box bg="gray.800" h="100vh" w="200px">
      <VStack
        h="100%"
        alignItems={"center"}
        justify={"space-between"}
        spacing={4}
      >
        <Stack gap={0} w="100%">
          <Stack
            direction={"row"}
            justifyContent={"center"}
            p={4}
            gap={2}
            w="100%"
          >
            <Box h={8} w={8}>
              <Brand
                className={css`
                  height: 100%;
                  width: 100%;

                  & * {
                    stroke: ${fill} white;
                    fill: ${fill} !important;
                  }
                `}
              />
            </Box>
            <Heading
              fontFamily={"Rubik"}
              size={"md"}
              color="white"
              alignSelf={"center"}
              textColor="gray.300"
            >
              Ti Coder
            </Heading>
          </Stack>
          <Divider />

          <Stack gap={2} mt={8} mx={4}>
            <Button
              colorScheme="blackAlpha"
              color={"white"}
              variant={pathname == "/" ? "solid" : "ghost"}
              as={Link}
              to={"/"}
              leftIcon={<IconHome size={16} />}
            >
              Home
            </Button>
            <Button
              colorScheme="blackAlpha"
              color={"white"}
              variant={pathname.startsWith("/program") ? "solid" : "ghost"}
              as={Link}
              to={paths.programs.get()}
              leftIcon={<IconCode size={16} />}
            >
              Programs
            </Button>
          </Stack>
        </Stack>

        <Menu>
          <MenuButton w="100%" bg="gray.700" p={4}>
            <Stack direction={"row"} align="center" w="100%">
              <Image
                h={8}
                w={8}
                borderRadius={"100%"}
                src={user.picture}
                referrerPolicy="no-referrer"
              />
              <Heading
                color="white"
                size={"xs"}
                overflow={"hidden"}
                textOverflow={"ellipsis"}
                style={{ textWrap: "nowrap" }}
              >
                My Account
              </Heading>
            </Stack>
          </MenuButton>
          <MenuList>
            <MenuItem>Profile</MenuItem>
            <MenuItem>Settings</MenuItem>
            <MenuItem as={Link} to={"/logout"}>
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </VStack>
    </Box>
  );
};
