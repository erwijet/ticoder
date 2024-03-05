import { obj } from "@tsly/obj";
import { FC, ReactNode, useEffect } from "react";
import { createBrowserRouter, useNavigate } from "react-router-dom";
import { App } from "../App";
import { Login } from "../pages/login";
import { Token } from "../pages/token";
import { User, useUserStore } from "./userStore";

type RouterPath =
  | {
      get: (...args: any[]) => string;
      path: string;
      component: FC<{}>;
    }
  | {
      get: (...args: any[]) => string;
      path: string;
      component: FC<{ user: User }>;
      protected: true;
    };

const paths = {
  root: {
    get: () => "/",
    path: "/",
    protected: true,
    component: App,
  },
  login: {
    get: () => "/login",
    path: "/login",
    component: Login,
  },
  token: {
    get: () => "/token",
    path: "/token",
    component: Token,
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
        nav: (...args: any[]) =>
          nav(v.get(...(args as Parameters<(typeof v)["get"]>))),
      },
    ])
  ) as {
    [k in keyof typeof paths]: {
      nav: (...args: Parameters<(typeof paths)[k]["get"]>) => void;
    };
  };
}
