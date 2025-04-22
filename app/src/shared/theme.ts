import { Button, createTheme, CSSVariablesResolver } from "@mantine/core";

export const theme = createTheme({
    primaryColor: "violet",
    // white: "#fafafa",

    components: {
        Button: Button.extend({
            defaultProps: {
                w: "fit-content",
            },
        }),
    },
});

export const cssVariablesResolver: CSSVariablesResolver = () => {
    return {
        dark: {},
        light: {},
        variables: {},
    };
};
