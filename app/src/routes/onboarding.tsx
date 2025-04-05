import {
    AppShell,
    Avatar,
    Button,
    Center,
    Checkbox,
    Container,
    Divider,
    Fieldset,
    Group,
    Image,
    Menu,
    Paper,
    rem,
    Space,
    Stack,
    Text,
    TextInput,
    Title,
} from "@mantine/core";
import { useField } from "@mantine/form";
import { createFileRoute, Link, redirect, useLoaderData, useNavigate } from "@tanstack/react-router";
import { alert } from "shared/alert";
import { api, trpc } from "shared/api";
import brand from "src/public/brand.png";

function component() {
    const nav = useNavigate();
    const { session } = useLoaderData({ from: "/onboarding" });
    const name = useField({ initialValue: session.user.fullname });
    const username = useField({
        initialValue: session.user.fullname.replaceAll(/\s/g, "").toLocaleLowerCase() + "-" + Math.round(Math.random() * 100),
    });
    const agreedToTOS = useField({ type: "checkbox", initialValue: false });

    const { mutateAsync: createAccount } = trpc.account.create.useMutation();

    async function handleCreateAccount() {
        await createAccount({ displayName: name.getValue(), handle: username.getValue() }).catch(alert.error);
        nav({ to: "/" });
        alert.ok("Account created.");
    }

    return (
        <AppShell>
            <AppShell.Header>
                <Group w="100%" h="52px" px="xl" justify="space-between">
                    <Group gap={"xs"}>
                        <Image src={brand} h={40} w={40} fit="contain" />
                        <Title order={2}>TiCoder</Title>
                    </Group>
                    <Menu>
                        <Menu.Target>
                            <Avatar />
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item component={Link} to="/logout">
                                Logout
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            </AppShell.Header>
            <Center h="100dvh">
                <Paper withBorder shadow="xl" px="xl">
                    <Container my="xl">
                        <Stack gap="xl">
                            <Stack gap="xs">
                                <Title order={1}>Welcome to TiCoder!</Title>
                                <Text c="dimmed" mt="-xs">
                                    Please finish creating your account.
                                </Text>
                            </Stack>

                            <Fieldset legend="Personal Information">
                                <TextInput label="Display Name" {...name.getInputProps()} />
                                <TextInput leftSection={<Text c="dimmed">@</Text>} label="Username" {...username.getInputProps()} />
                            </Fieldset>

                            <Checkbox
                                {...agreedToTOS.getInputProps()}
                                label={
                                    <Text>
                                        By creating this account you agree to the <Link to="/">Terms of Service</Link> and the{" "}
                                        <Link to="/">Privicy Policy</Link> of TiCoder.
                                    </Text>
                                }
                            />

                            <Button
                                disabled={!agreedToTOS.getValue() || name.getValue().trim().length < 5}
                                onClick={handleCreateAccount}
                                ml="auto"
                            >
                                Create Account
                            </Button>
                        </Stack>
                    </Container>
                </Paper>
            </Center>
        </AppShell>
    );
}

export const Route = createFileRoute("/onboarding")({
    component,
    async loader() {
        const session = await api.session.get.query();
        const account = await api.account.self.get.query();
        if (!!account) throw redirect({ to: "/" }); // if the user already has an account, bounce them

        return { session };
    },
});
