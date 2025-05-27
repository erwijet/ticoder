import { Center, Stack, Loader, Text } from "@mantine/core";

export const PageLoader = () => (
    <Center h="100vh" w="100pw">
        <Stack align="center">
            <Loader type="bars" />
            <Text size="sm">Getting Everything Ready...</Text>
        </Stack>
    </Center>
);
