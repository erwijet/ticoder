import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "./router";
import { useEffect, useLayoutEffect } from "react";

export type User = {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  picture: string;
};

type UserStore = {
  token?: string;
  user?: User;

  setToken: (token: string) => Promise<void>;
  clearToken: () => void;
};

const store = create<UserStore>()(
  persist(
    (set, _get) => ({
      token: undefined,
      user: undefined,
      async setToken(token) {
        const claims = jwtDecode(token) as {
          family_name: string;
          given_name: string;
          fullname: string;
          email: string;
          picture: string;
        };

        set({
          token,
          user: {
            email: claims.email,
            firstName: claims.given_name,
            fullName: claims.fullname,
            lastName: claims.family_name,
            picture: claims.picture,
          },
        });
      },
      clearToken() {
        set({ token: undefined, user: undefined });
      },
    }),
    {
      name: "dev.ticoder.userStore",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useUserStore = store;
