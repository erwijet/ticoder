import { Box, Container, BoxComponentProps, Group, GroupProps, PolymorphicComponentProps, Stack, Title } from "@mantine/core";

import { createMarkerComponent, createSlots } from "shared/slots";

type LayoutProps = PolymorphicComponentProps<"div", BoxComponentProps>;

const LayoutAction = createMarkerComponent();
const LayoutTitle = createMarkerComponent();
const LayoutBleed = createMarkerComponent();

export const Layout = Object.assign(
    ({ children, ...rest }: LayoutProps) => {
        const Wrapper = Box;

        const slots = createSlots(children, {
            LayoutTitle,
            LayoutAction,
            LayoutBleed,
        });

        return (
            <Box w="100%" h="100%">
                <Box style={{ borderBottom: "solid 1px var(--mantine-color-default-border)" }}>
                    <Container>
                        <Box pos="sticky" top={0} w="100%" p="sm" bg="background" style={{ zIndex: 1e2 }}>
                            <Group w="100%" justify="space-between">
                                <Title order={1}>{slots.LayoutTitle}</Title>
                                <Group>{slots.LayoutAction}</Group>
                            </Group>
                        </Box>
                    </Container>
                </Box>
                <Wrapper {...rest}>
                    <Stack>{slots.LayoutBleed}</Stack>
                    <Container mt="xl">
                        <Stack>{slots.rest}</Stack>
                    </Container>
                </Wrapper>
            </Box>
        );
    },
    {
        Title: LayoutTitle,
        Action: LayoutAction,
        Bleed: LayoutBleed,
    },
);
