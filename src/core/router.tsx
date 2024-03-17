import { obj } from "@tsly/obj";
import { FC, ReactNode, useEffect } from "react";
import { createBrowserRouter, useNavigate } from "react-router-dom";
import { App } from "src/App";
import { Login } from "src/pages/login";
import { Token } from "src/pages/token";
import { User, useUserStore } from "src/core/userStore";
import { Logout } from "src/pages/logout";
import { maybe } from "@tsly/maybe";
import { ProgramPage } from "src/pages/programs/program-page";

export type RouterPath =
  | {
      get: (...args: any[]) => string;
      path: string;
      component: FC<{}>;
      name: string;
    }
  | {
      get: (...args: any[]) => string;
      path: string;
      component: FC<{ user: User }>;
      protected: true;
      name: string;
    };

export const paths = {
  root: {
    get: () => "/",
    path: "/",
    protected: true,
    component: App,
    name: "Home",
  },
  programs: {
    get: (id?: number) =>
      "/program" + (maybe(id?.toString())?.take((it) => "/" + it) ?? "/list"),
    path: "/program/:id",
    protected: true,
    component: ProgramPage,
    name: "Programs",
  },
  login: {
    get: () => "/login",
    path: "/login",
    component: Login,
    name: "-",
  },
  logout: {
    get: () => "/logout",
    path: "/logout",
    component: Logout,
    name: "-",
  },
  token: {
    get: () => "/token",
    path: "/token",
    component: Token,
    name: "-",
  },
} as const satisfies Record<string, RouterPath>;

//

export function Protected(props: {
  children: (props: { user: User }) => ReactNode;
}) {
  const { user } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.login.nav();
  }, [user]);

  return !user ? null : props.children({ user: user! });
}

export const router = createBrowserRouter(
  Object.values(paths).map((def: any) => ({
    path: def.path,
    element: !!obj(def).getUntypedProperty("protected") ? (
      <Protected>{(props) => <def.component {...props} />}</Protected>
    ) : (
      <def.component />
    ),
  }))
);

export function useRouter() {
  const nav = useNavigate();

  return Object.fromEntries(
    obj(paths).entries.map(([k, v]) => [
      k,
      {
        nav: (...args: any[]) => nav(v.get(...(args as [any]))),
      },
    ])
  ) as {
    [k in keyof typeof paths]: {
      nav: (...args: Parameters<(typeof paths)[k]["get"]>) => void;
    };
  };
}
