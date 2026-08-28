export function StorageManager() {

    function saveData(projects) {

        localStorage.setItem(
            "projects", JSON.stringify(projects)
        );

    }

    function loadData() {

        const data = localStorage.getItem("projects");

        if (!data) {
            return null;
        }

        return JSON.parse(data);

    }

    return {
        saveData,
        loadData
    };
    
}