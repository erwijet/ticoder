import { Button, Checkbox, Container, Divider, Fieldset, rem, Space, Stack, Text, TextInput, Title } from "@mantine/core";
import { useField } from "@mantine/form";
import { createFileRoute, Link, redirect, useLoaderData, useNavigate } from "@tanstack/react-router";
import { alert } from "shared/alert";
import { api, trpc } from "shared/api";
import { Layout } from "shared/components/Layout";
import { runCatching } from "shared/fns";

function component() {
    const nav = useNavigate();
    const { session } = useLoaderData({ from: "/onboarding" });
    const name = useField({ initialValue: session.user.fullname });
    const agreedToTOS = useField({ type: "checkbox", initialValue: false });

    const { mutateAsync: createAccount } = trpc.account.create.useMutation();

    async function handleCreateAccount() {
        await createAccount({ displayName: name.getValue() }).catch(alert.error);
        nav({ to: "/" });
        alert.ok("Account created.");
    }

    return (
        <Container my="xl">
            <Stack gap="xl">
                <Stack>
                    <Title order={1}>Welcome to TiCoder!</Title>
                    <Text>Please finish creating your account.</Text>
                </Stack>

                <Fieldset legend="Personal Information">
                    <TextInput label="Display Name" {...name.getInputProps()} />
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

                <Button disabled={!agreedToTOS.getValue() || name.getValue().trim().length < 5} onClick={handleCreateAccount}>
                    Create Account
                </Button>
            </Stack>
        </Container>
    );
}

export const Route = createFileRoute("/onboarding")({
    component,
    async loader() {
        const session = await api.session.get.query();
        const account = await api.account.get.query();
        if (!!account) throw redirect({ to: "/" }); // if the user already has an account, bounce them

        return { session };
    },
});
