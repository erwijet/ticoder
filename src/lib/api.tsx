import type { Procedures } from "@codegen/api";
import { FetchTransport, createClient } from "@rspc/client";
import { toast } from "sonner";
import { Toast } from "@chakra-ui/react";
import { maybe } from "@tsly/maybe";
import { useUserStore } from "src/core/userStore";

export const api = createClient<Procedures>({
  transport: new FetchTransport("http://localhost:8080/rspc", (input, init) =>
    fetch(input, {
      ...init,
      headers: {
        ...(maybe(useUserStore.getState().token)?.take((it) => ({
          Authorization: `Bearer ${it}`,
        })) ?? {}),
        ...init?.headers,
      },
    })
  ),
  onError: (err) => {
    if (err.code == 401) {
      useUserStore.getState().clearToken();
      return;
    }

    toast.custom((id) => (
      <Toast
        isClosable
        status="error"
        title="Error"
        description={err.message}
        onClose={() => toast.dismiss(id)}
      />
    ));
  },
});
