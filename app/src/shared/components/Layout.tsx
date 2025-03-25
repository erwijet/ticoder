import { Box, BoxComponentProps, Group, GroupProps, PolymorphicComponentProps, Stack, Title } from "@mantine/core";

import { createMarkerComponent, createSlots } from "shared/slots";

type LayoutProps = PolymorphicComponentProps<"div", BoxComponentProps>;

const LayoutAction = createMarkerComponent();
const LayoutTitle = createMarkerComponent();

export const Layout = Object.assign(
    ({ children, ...rest }: LayoutProps) => {
        const Wrapper = Box;

        const slots = createSlots(children, {
            LayoutTitle,
            LayoutAction,
        });

        return (
            <Box w="100%" h="100%">
                <Box pos="sticky" top={0} w="100%" p="sm" mb="xl" bg="background" style={{ zIndex: 1e2 }}>
                    <Group w="100%" justify="space-between">
                        <Title order={1}>{slots.LayoutTitle}</Title>
                        <Group>{slots.LayoutAction}</Group>
                    </Group>
                </Box>
                <Wrapper {...rest}>
                    <Stack>{slots.rest}</Stack>
                </Wrapper>
            </Box>
        );
    },
    {
        Title: LayoutTitle,
        Action: LayoutAction,
    },
);
