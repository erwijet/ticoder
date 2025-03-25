import { AppShell, Burger, Container } from "@mantine/core";
import { createFileRoute, Outlet, redirect, useNavigate, useRouteContext } from "@tanstack/react-router";
import { Navbar } from "src/components/navbar";
import { useEffect } from "react";
import { session, SessionRenewer } from "shared/session";
import { qc } from "shared/api";

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

        return {
            session: await qc.ensureQueryData(session.queryOptions()),
        };
    },
});
