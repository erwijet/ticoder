import { AppShell, Burger, Container } from "@mantine/core";
import { createFileRoute, Outlet, redirect, useNavigate, useRouteContext } from "@tanstack/react-router";
import { Navbar } from "shared/components/navbar";
import { session, SessionRenewer } from "shared/session";
import { api, qc } from "shared/api";

function component() {
    return (
        <>
            <SessionRenewer />
            <AppShell
                navbar={{
                    width: 60,
                    breakpoint: "sm",
                }}
            >
                <AppShell.Navbar>
                    <Navbar />
                </AppShell.Navbar>

                <AppShell.Main>
                    <Outlet />
                </AppShell.Main>
            </AppShell>
        </>
    );
}

export const Route = createFileRoute("/_auth")({
    component,
    beforeLoad: async () => {
        const token = session.getToken();
        if (!token) throw redirect({ to: "/login", search: { to: window.location.pathname } });

        // check for account
        const account = await api.account.self.get.query();
        if (!account) throw redirect({ to: "/onboarding" });

        return {
            session: await qc.ensureQueryData(session.queryOptions()),
            account,
        };
    },
});
