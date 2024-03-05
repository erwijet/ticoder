import type { Procedures } from "@codegen/api";
import { FetchTransport, createClient } from "@rspc/client";
import { toast } from "sonner";
import { Toast } from "@chakra-ui/react";

export const api = createClient<Procedures>({
  transport: new FetchTransport("http://localhost:8080/rspc"),
  onError: (err) => {
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
