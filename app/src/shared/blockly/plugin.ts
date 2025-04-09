import { BlockBuilderPlugin } from "better-blockly/dist/lib";

type PresetShadowsConfig<PresetKey extends string> = {
    presets: (values: { num?: number }) => { [_ in PresetKey]: { blockType: string; fields: object } };
};

export function createPresetShadowsPlugin<PresetKey extends string>(config: PresetShadowsConfig<PresetKey>) {
    return {
        register(): BlockBuilderPlugin<{ [_ in `shadow-field:${PresetKey}`]: string | string[] } & { "shadow-value:num": number }> {
            return {
                name: "erwijet:ticoder/plugin-preset-shadows",
                blockWillRegister(builder) {
                    const num = builder.getMeta()["shadow-value:num"];

                    Object.entries(config.presets({ num })).forEach(([presetKey, preset]) => {
                        const fields = builder.getMeta()[`shadow-field:${presetKey}` as `shadow-field:${PresetKey}`];
                        if (!fields) return;

                        builder.meta("shadow" as any, Object.fromEntries([fields].flat(2).map((field) => [field, preset])) as any);
                    });
                },
            };
        },
    };
}
