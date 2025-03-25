import { zodResolver } from "@mantine/form";
import { trpc } from "shared/api";
import { Layout } from "shared/components/Layout";
import { createProjectState, ProjectFormProvider, validate, useProjectForm } from "shared/form/project/context";
import { ProjectEditor } from "shared/form/project/editor";
import { createFileRoute, useParams } from "@tanstack/react-router";

function component() {
    const { id } = useParams({ from: "/_auth/projects/$id" });
    const [data] = trpc.project.get.useSuspenseQuery(id);

    const form = useProjectForm({
        initialValues: createProjectState(data),
        validate,
    });

    return (
        <Layout>
            <Layout.Title>{form.values.name}</Layout.Title>

            <ProjectFormProvider form={form}>
                <ProjectEditor />
            </ProjectFormProvider>
        </Layout>
    );
}

export const Route = createFileRoute("/_auth/projects/$id")({
    component,
});
