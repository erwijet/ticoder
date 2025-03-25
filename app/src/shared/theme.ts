import { Button, createTheme } from "@mantine/core";

export const theme = createTheme({
    components: {
        Button: Button.extend({
            defaultProps: {
                w: "fit-content",
            },
        }),
    },
});
