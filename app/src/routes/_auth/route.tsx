import { AppShell, Burger, Container } from "@mantine/core";
import { createFileRoute, Outlet, redirect, useNavigate, useRouteContext } from "@tanstack/react-router";
import { Navbar } from "src/components/navbar";
import { useEffect } from "react";
import { session, SessionRenewer } from "shared/session";
import { api, qc } from "shared/api";
import { runCatching } from "shared/fns";

function component() {
    return (
        <>
            <SessionRenewer />
            <AppShell
                navbar={{
                    width: 200,
                    breakpoint: "sm",
                }}
            >
                <AppShell.Navbar>
                    <Navbar />
                </AppShell.Navbar>

                <AppShell.Main>
                    <Container>
                        <Outlet />
                    </Container>
                </AppShell.Main>
            </AppShell>
        </>
    );
}

export const Route = createFileRoute("/_auth")({
    component,
    beforeLoad: async () => {
        const token = session.getToken();
        if (!token) throw redirect({ to: "/login" });

        // check for account
        if (!(await api.account.get.query())) throw redirect({ to: "/onboarding" });

        return {
            session: await qc.ensureQueryData(session.queryOptions()),
        };
    },
});
