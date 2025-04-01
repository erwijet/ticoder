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
                    width: 200,
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
        if (!token) throw redirect({ to: "/login" });

        // check for account
        if (!(await api.account.get.query())) throw redirect({ to: "/onboarding" });

        return {
            session: await qc.ensureQueryData(session.queryOptions()),
        };
    },
});
