import { Stack } from "@chakra-ui/react";
import { ReactNode } from "react";
import { Navbar } from "./navbar";

export const Shell = (props: { children: ReactNode }) => (
  <Stack direction={"row"} gap={0}>
    <Navbar />
    <Stack gap={0}>{props.children}</Stack>
  </Stack>
);
