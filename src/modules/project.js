export function projectManager() {

    function makeProject(name, color) {
        return {
            id: crypto.randomUUID(),
            name,
            color,
            todos: []
        };
    }

    function deleteProject(projects, id) {
        return projects.filter(
            project => project.id !== id
        );
    }

    function editProject(projects, id, newName, newColor) {
        const project = projects.find(
            project => project.id === id
        );

        if (!project) return projects;

        project.name = newName;
        project.color = newColor;

        return projects;
    }

    function openProject(projects, id) {
        return projects.find(
            project => project.id === id
        );
    }

    return {
        makeProject,
        deleteProject,
        editProject,
        openProject
    };
}