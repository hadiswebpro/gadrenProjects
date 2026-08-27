import { projectManager } from "./project.js";
import { toDoManager } from "./todo.js";
import { StorageManager } from "./storage.js";
import { getTheme, getThemes } from "./theme.js";

export function HomeManager() {

  const project = projectManager();
  const todo = toDoManager();
  const storage = StorageManager();

  let projects = storage.loadData() || [];
  let currentProjectId = projects[0]?.id || null;

  const app = document.querySelector("#app");

  /* =========================
       WELCOME
    ========================= */

  function showWelcome() {

    app.innerHTML = `
            <section class="welcome">

                <h2>Welcome to Garden Projects</h2>

                <p>
                    Organize your projects, manage your tasks,
                    and keep track of what matters.
                </p>

                <button class="start-btn">
                    Enter App
                </button>

            </section>
        `;

    app.querySelector(".start-btn").addEventListener("click", showApp);
  }

  /* =========================
       MAIN APP
    ========================= */

  function showApp() {
    app.innerHTML = `

            <section class="todo-app">

                <header class="app-header">

                    <div class="app-title">
                        <h2>My Tasks</h2>

                        <p>
                            Organize your day and your projects.
                        </p>
                    </div>

                    <div class="app-actions">

                        <input
                            type="search"
                            class="search-input"
                            placeholder="Search todos..."
                        >

                        <button class="add-project">
                            + Project
                        </button>

                    </div>

                </header>

                <div class="app-layout">

                    <aside class="projects-sidebar">

                        <div class="projects-header">
                            <h3>Projects</h3>
                        </div>

                        <div class="projects"></div>

                    </aside>

                    <main class="todos-section">

                        <div class="current-project"></div>

                        <div class="todos"></div>

                        <button class="add-todo">
                            + Add Todo
                        </button>

                    </main>

                </div>

            </section>
        `;

    renderProjects();

    if (currentProjectId) {
      renderCurrentProject();
    }

    setupAppEvents();
  }

  /* =========================
       MESSAGE MODAL
    ========================= */

  function showMessage({
    title,
    message,
    confirmText = "Delete",
    cancelText = "Cancel",
    onConfirm = null,
    showCancel = true,
  }) {
    const existingModal = app.querySelector(".confirm-overlay");

    if (existingModal) {
      existingModal.remove();
    }

    const overlay = document.createElement("div");

    overlay.classList.add("confirm-overlay");

    overlay.innerHTML = `
      <div class="confirm-box" role="dialog" aria-modal="true">

        <h3>${title}</h3>

        <p>${message}</p>

        <div class="confirm-actions">

          ${showCancel ? `
            <button type="button" class="confirm-cancel">
              ${cancelText}
            </button>
          ` : ""}

          <button type="button" class="confirm-delete">
            ${confirmText}
          </button>

        </div>

      </div>
    `;

    app.appendChild(overlay);

    const closeModal = () => {
      overlay.remove();
    };

    const confirmButton = overlay.querySelector(".confirm-delete");
    const cancelButton = overlay.querySelector(".confirm-cancel");

    confirmButton.addEventListener("click", () => {
      if (onConfirm) {
        onConfirm();
      }

      closeModal();
    });

    if (cancelButton) {
      cancelButton.addEventListener("click", closeModal);
    }

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeModal();
      }
    });

    document.addEventListener("keydown", function handleEscape(event) {
      if (event.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", handleEscape);
      }
    });
  }

  /* =========================
       PROJECTS
    ========================= */

  function renderProjects() {
    const container = app.querySelector(".projects");

    container.innerHTML = "";

    projects.forEach((projectData) => {
      const element = document.createElement("div");
      const theme = getTheme(projectData.color) || getTheme("sage");

      element.classList.add("project-item");

      element.dataset.id = projectData.id;
      element.style.setProperty("--project-color", theme.main);
      element.style.setProperty("--project-color-light", theme.light);
      element.style.setProperty("--project-color-dark", theme.dark);

      element.innerHTML = `

                <button class="project-open">

                    <span
                        class="project-color"
                        style="background-color:${theme.main}"
                    ></span>

                    <span class="project-name">
                        ${projectData.name}
                    </span>

                    <span class="project-count">
                        ${projectData.todos.length}
                    </span>

                </button>

                <button class="project-edit">
                    Edit
                </button>

                <button class="project-delete">
                    Delete
                </button>
            `;

      element.querySelector(".project-open").addEventListener("click", () => {
        openProject(projectData.id);
      });

      element.querySelector(".project-edit").addEventListener("click", () => {
        showEditProjectForm(projectData.id);
      });

      element.querySelector(".project-delete").addEventListener("click", () => {
        deleteProject(projectData.id);
      });

      container.appendChild(element);
    });
  }

  function openProject(id) {
    const selectedProject = project.openProject(projects, id);

    if (!selectedProject) return;

    currentProjectId = selectedProject.id;

    renderCurrentProject();
  }

  function deleteProject(id) {
    const selectedProject = project.openProject(projects, id);

    if (!selectedProject) return;

    if (selectedProject.isDefault) {
      showMessage({
        title: "Default project",
        message: "The default project cannot be deleted.",
        confirmText: "Got it",
        showCancel: false,
      });

      return;
    }

    if (projects.length === 1) {
      showMessage({
        title: "Cannot delete project",
        message: "You need at least one project.",
        confirmText: "Got it",
        showCancel: false,
      });

      return;
    }

    showMessage({
      title: "Delete project?",
      message: `Are you sure you want to delete "${selectedProject.name}"? All todos inside this project will also be deleted.`,
      confirmText: "Delete Project",
      onConfirm: () => {
        projects = project.deleteProject(projects, id);

        if (!projects.some((projectData) => projectData.id === currentProjectId)) {
          currentProjectId = projects[0]?.id || null;
        }

        storage.saveData(projects);

        renderProjects();
        renderCurrentProject();
      },
    });
  }

  /* =========================
       CURRENT PROJECT
    ========================= */

  function getCurrentProject() {
    return project.openProject(projects, currentProjectId);
  }

  function renderCurrentProject() {
    const selectedProject = getCurrentProject();

    if (!selectedProject) return;

    const title = app.querySelector(".current-project");
    const theme = getTheme(selectedProject.color) || getTheme("sage");

    title.innerHTML = `

            <div
                class="project-heading"
                style="--project-color:${theme.main};--project-color-light:${theme.light};--project-color-dark:${theme.dark}"
            >

                <div>

                    <h2>
                        ${selectedProject.name}
                    </h2>

                    <span>
                        ${selectedProject.todos.length} tasks
                    </span>

                </div>

            </div>
        `;

    renderTodos(selectedProject.todos);
  }

  /* =========================
       TODOS
    ========================= */

  function renderTodos(todos) {
    const container = app.querySelector(".todos");

    container.innerHTML = "";

    if (todos.length === 0) {
      container.innerHTML = `
                <p class="empty-message">
                    No todos yet.
                </p>
            `;

      return;
    }

    todos.forEach((todoData) => {
      const element = document.createElement("article");

      element.classList.add("todo-item");

      element.dataset.id = todoData.id;

      element.innerHTML = `

                <input
                    type="checkbox"
                    class="todo-checkbox"
                    ${todoData.completed ? "checked" : ""}
                >

                <div class="todo-info">

                    <h3>
                        ${todoData.title}
                    </h3>

                    <p>
                        ${todoData.description}
                    </p>

                    <span>
                        ${todoData.dueDate}
                    </span>

                </div>

                <span class="priority">
                    ${todoData.priority}
                </span>

                <button class="edit-todo">
                    Edit
                </button>

                <button class="delete-todo">
                    Delete
                </button>
            `;

      setupTodoEvents(element, todoData.id);

      container.appendChild(element);
    });
  }

  function setupTodoEvents(element, id) {
    const checkbox = element.querySelector(".todo-checkbox");
    const editButton = element.querySelector(".edit-todo");
    const deleteButton = element.querySelector(".delete-todo");

    checkbox.addEventListener("change", () => {
      const selectedProject = getCurrentProject();

      if (!selectedProject) return;

      todo.toggleComplete(selectedProject.todos, id);

      storage.saveData(projects);

      renderCurrentProject();
      renderProjects();
    });

    editButton.addEventListener("click", () => {
      showEditTodoForm(id);
    });

    deleteButton.addEventListener("click", () => {
      deleteTodo(id);
    });
  }

  function deleteTodo(id) {
    const selectedProject = getCurrentProject();

    if (!selectedProject) return;

    const selectedTodo = todo.openToDo(selectedProject.todos, id);

    if (!selectedTodo) return;

    showMessage({
      title: "Delete todo?",
      message: `Are you sure you want to delete "${selectedTodo.title}"?`,
      confirmText: "Delete Todo",
      onConfirm: () => {
        selectedProject.todos = todo.deleteToDo(selectedProject.todos, id);

        storage.saveData(projects);

        renderCurrentProject();
        renderProjects();
      },
    });
  }

  /* =========================
       THEME OPTIONS
    ========================= */

  function createThemeOptions(selectedTheme = "sage") {
    return Object.entries(getThemes())
      .map(([name, theme]) => `
        <button
            type="button"
            class="theme-option ${name === selectedTheme ? "selected" : ""}"
            data-theme="${name}"
            style="--theme-color:${theme.main}"
            title="${name}"
            aria-label="${name}"
        ></button>
      `)
      .join("");
  }

  function setupThemeOptions(form, selectedTheme) {
    const hiddenInput = form.querySelector('[name="color"]');

    form.querySelectorAll(".theme-option").forEach((button) => {
      button.addEventListener("click", () => {
        form.querySelectorAll(".theme-option").forEach((option) => {
          option.classList.remove("selected");
        });

        button.classList.add("selected");
        hiddenInput.value = button.dataset.theme;
      });
    });

    hiddenInput.value = selectedTheme;
  }

  /* =========================
       ADD PROJECT FORM
    ========================= */

  function showAddProjectForm() {
    const form = document.createElement("form");

    form.classList.add("project-form");

    form.innerHTML = `

            <h3>Create Project</h3>

            <label>
                Project name

                <input
                    type="text"
                    name="name"
                    required
                >
            </label>

            <label>
                Project color

                <div class="theme-options">
                    ${createThemeOptions()}
                </div>

                <input
                    type="hidden"
                    name="color"
                    value="sage"
                >
            </label>

            <div class="form-actions">

                <button type="submit">
                    Create
                </button>

                <button
                    type="button"
                    class="cancel"
                >
                    Cancel
                </button>

            </div>
        `;

    app.querySelector(".app-header").appendChild(form);

    setupThemeOptions(form, "sage");

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const name = formData.get("name").trim();
      const color = formData.get("color");

      addProject(name, color);
      form.remove();
    });

    form.querySelector(".cancel").addEventListener("click", () => {
      form.remove();
    });
  }

  function addProject(name, color) {
    const newProject = project.makeProject(name, color);

    newProject.isDefault = false;

    projects.push(newProject);
    currentProjectId = newProject.id;

    storage.saveData(projects);

    renderProjects();
    renderCurrentProject();
  }

  /* =========================
       EDIT PROJECT FORM
    ========================= */

  function showEditProjectForm(id) {
    const selectedProject = project.openProject(projects, id);

    if (!selectedProject) return;

    const form = document.createElement("form");

    form.classList.add("project-form");

    form.innerHTML = `

            <h3>Edit Project</h3>

            <label>
                Project name

                <input
                    type="text"
                    name="name"
                    value="${selectedProject.name}"
                    required
                >
            </label>

            <label>
                Project color

                <div class="theme-options">
                    ${createThemeOptions(selectedProject.color)}
                </div>

                <input
                    type="hidden"
                    name="color"
                    value="${selectedProject.color}"
                >
            </label>

            <div class="form-actions">

                <button type="submit">
                    Save
                </button>

                <button
                    type="button"
                    class="cancel"
                >
                    Cancel
                </button>

            </div>
        `;

    app.querySelector(".app-header").appendChild(form);

    setupThemeOptions(form, selectedProject.color);

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = new FormData(form);
      const name = data.get("name").trim();
      const color = data.get("color");

      project.editProject(projects, id, name, color);

      storage.saveData(projects);

      renderProjects();
      renderCurrentProject();

      form.remove();
    });

    form.querySelector(".cancel").addEventListener("click", () => {
      form.remove();
    });
  }

  /* =========================
       ADD TODO FORM
    ========================= */

  function showAddTodoForm() {
    const selectedProject = getCurrentProject();

    if (!selectedProject) return;

    const form = document.createElement("form");

    form.classList.add("todo-form");

    form.innerHTML = `

            <h3>Add Todo</h3>

            <label>
                Title

                <input
                    type="text"
                    name="title"
                    required
                >
            </label>

            <label>
                Description

                <textarea
                    name="description"
                    required
                ></textarea>
            </label>

            <label>
                Due date

                <input
                    type="date"
                    name="dueDate"
                    required
                >
            </label>

            <label>
                Priority

                <select
                    name="priority"
                    required
                >

                    <option value="low">
                        Low
                    </option>

                    <option value="medium">
                        Medium
                    </option>

                    <option value="high">
                        High
                    </option>

                </select>

            </label>

            <label>
                Notes

                <textarea
                    name="notes"
                ></textarea>
            </label>

            <div class="form-actions">

                <button type="submit">
                    Add Todo
                </button>

                <button
                    type="button"
                    class="cancel"
                >
                    Cancel
                </button>

            </div>
        `;

    app.querySelector(".todos-section").appendChild(form);

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = new FormData(form);

      addTodo(
        data.get("title").trim(),
        data.get("description").trim(),
        data.get("dueDate"),
        data.get("priority"),
        data.get("notes").trim(),
      );

      form.remove();
    });

    form.querySelector(".cancel").addEventListener("click", () => {
      form.remove();
    });
  }

  function addTodo(title, description, dueDate, priority, notes) {
    const selectedProject = getCurrentProject();

    if (!selectedProject) return;

    const newTodo = todo.makeToDo(title, description, dueDate, priority, notes);

    selectedProject.todos.push(newTodo);

    storage.saveData(projects);

    renderCurrentProject();
    renderProjects();
  }

  /* =========================
       EDIT TODO FORM
    ========================= */

  function showEditTodoForm(id) {
    const selectedProject = getCurrentProject();

    if (!selectedProject) return;

    const selectedTodo = todo.openToDo(selectedProject.todos, id);

    if (!selectedTodo) return;

    const form = document.createElement("form");

    form.classList.add("todo-form");

    form.innerHTML = `

            <h3>Edit Todo</h3>

            <label>
                Title

                <input
                    type="text"
                    name="title"
                    value="${selectedTodo.title}"
                    required
                >
            </label>

            <label>
                Description

                <textarea
                    name="description"
                    required
                >${selectedTodo.description}</textarea>
            </label>

            <label>
                Due date

                <input
                    type="date"
                    name="dueDate"
                    value="${selectedTodo.dueDate}"
                    required
                >
            </label>

            <label>
                Priority

                <select
                    name="priority"
                    required
                >

                    <option
                        value="low"
                        ${selectedTodo.priority === "low" ? "selected" : ""}
                    >
                        Low
                    </option>

                    <option
                        value="medium"
                        ${selectedTodo.priority === "medium" ? "selected" : ""}
                    >
                        Medium
                    </option>

                    <option
                        value="high"
                        ${selectedTodo.priority === "high" ? "selected" : ""}
                    >
                        High
                    </option>

                </select>

            </label>

            <label>
                Notes

                <textarea
                    name="notes"
                >${selectedTodo.notes}</textarea>
            </label>

            <div class="form-actions">

                <button type="submit">
                    Save
                </button>

                <button
                    type="button"
                    class="cancel"
                >
                    Cancel
                </button>

            </div>
        `;

    app.querySelector(".todos-section").appendChild(form);

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = new FormData(form);

      todo.editToDo(
        selectedProject.todos,
        id,
        data.get("title").trim(),
        data.get("description").trim(),
        data.get("dueDate"),
        data.get("priority"),
        data.get("notes").trim(),
      );

      storage.saveData(projects);

      renderCurrentProject();

      form.remove();
    });

    form.querySelector(".cancel").addEventListener("click", () => {
      form.remove();
    });
  }

  /* =========================
       SEARCH
    ========================= */

  function searchTodos(value) {
    const selectedProject = getCurrentProject();

    if (!selectedProject) return;

    const searchValue = value.toLowerCase().trim();

    const results = selectedProject.todos.filter((todoData) =>
      todoData.title.toLowerCase().includes(searchValue),
    );

    renderTodos(results);
  }

  /* =========================
       EVENTS
    ========================= */

  function setupAppEvents() {
    const searchInput = app.querySelector(".search-input");

    searchInput.addEventListener("input", (event) => {
      searchTodos(event.target.value);
    });

    app.querySelector(".add-project").addEventListener("click", () => {
      showAddProjectForm();
    });

    app.querySelector(".add-todo").addEventListener("click", () => {
      showAddTodoForm();
    });
  }

  /* =========================
       INITIALIZE
    ========================= */

  function initialize() {
    if (projects.length === 0) {
      const defaultProject = project.makeProject("Default", "sage");

      defaultProject.isDefault = true;

      projects.push(defaultProject);

      currentProjectId = defaultProject.id;

      storage.saveData(projects);
    } else {
      const hasDefaultProject = projects.some(
        (projectData) => projectData.isDefault,
      );

      if (!hasDefaultProject) {
        projects[0].isDefault = true;
        storage.saveData(projects);
      }
    }

    showWelcome();
  }

  return {
    initialize,
  };
}