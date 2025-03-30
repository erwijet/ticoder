import { Box, BoxComponentProps, Container, Group, PolymorphicComponentProps, Stack, Title } from "@mantine/core";
import { createContext, RefObject, useContext, useRef } from "react";
import { just } from "shared/fp";

import { createMarkerComponent, createSlots } from "shared/slots";

type LayoutProps = PolymorphicComponentProps<"div", BoxComponentProps>;

const LayoutAction = createMarkerComponent();
const LayoutTitle = createMarkerComponent();
const LayoutBleed = createMarkerComponent();

const ctx = createContext<{ headingRef: RefObject<HTMLDivElement> } | undefined>(undefined);
export function useLayout() {
    return useContext(ctx)!;
}

export const Layout = Object.assign(
    ({ children, ...rest }: LayoutProps) => {
        const headingRef = useRef<HTMLDivElement>(null);
        const Wrapper = Box;

        const slots = createSlots(children, {
            LayoutTitle,
            LayoutAction,
            LayoutBleed,
        });

        return (
            <Box w="100%" h="100%">
                <div ref={headingRef}>
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
                </div>
                <ctx.Provider value={{ headingRef }}>
                    <Wrapper {...rest} mod={{ wrapper: true }}>
                        <Stack>{slots.LayoutBleed}</Stack>
                        {just(slots.rest)
                            .filter((it) => it.length > 0)
                            ?.take((rest) => (
                                <Container mt="xl">
                                    <Stack>{rest}</Stack>
                                </Container>
                            ))}
                    </Wrapper>
                </ctx.Provider>
            </Box>
        );
    },
    {
        Title: LayoutTitle,
        Action: LayoutAction,
        Bleed: LayoutBleed,
    },
);
