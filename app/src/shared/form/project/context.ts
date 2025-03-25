import { createFormContext, zodResolver } from "@mantine/form";

import { Project } from "@prisma/client";
import { z } from "zod";

const projectStateSchema = z.object({
    name: z.string().nonempty().max(8),
    blockly: z.string(),
    source: z.string(),
    published: z.boolean(),
});

type ProjectState = z.infer<typeof projectStateSchema>;

export function createProjectState(resource: Project): ProjectState {
    return resource;
}

export function createProjectResourceParams(state: ProjectState) {
    return state;
}

export const [ProjectFormProvider, useProjectFormContext, useProjectForm] = createFormContext<ProjectState>();
export const validate = zodResolver(projectStateSchema);
