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

  function showWelcome() {
    app.innerHTML = `
      <section class="welcome">
        <h2>Welcome to Garden Projects</h2>
        <p>Organize your projects, manage your tasks, and keep track of what matters.</p>
        <button class="start-btn">Enter App</button>
      </section>`;
    app.querySelector(".start-btn").addEventListener("click", showApp);
  }

  function showApp() {
    app.innerHTML = `
      <section class="todo-app">
        <header class="app-header">
          <div class="app-title">
            <h2>My Tasks</h2>
            <p>Organize your day and your projects.</p>
          </div>
          <div class="app-actions">
            <button class="projects-toggle" type="button" aria-expanded="false">Projects</button>
            <input type="search" class="search-input" placeholder="Search todos...">
            <button class="add-project">+ Project</button>
          </div>
        </header>
        <div class="app-layout">
          <aside class="projects-sidebar">
            <div class="projects-header"><h3>Projects</h3></div>
            <div class="projects"></div>
          </aside>
          <div class="projects-backdrop" aria-hidden="true"></div>
          <main class="todos-section">
            <div class="current-project"></div>
            <div class="todos"></div>
            <button class="add-todo">+ Add Todo</button>
          </main>
        </div>
      </section>`;

    renderProjects();
    if (currentProjectId) renderCurrentProject();
    setupAppEvents();
  }

  function showMessage({ title, message, confirmText = "OK", cancelText = "Cancel", onConfirm = null, showCancel = true }) {
    closeModal();
    const overlay = document.createElement("div");
    overlay.className = "confirm-overlay";
    overlay.innerHTML = `
      <div class="confirm-box" role="dialog" aria-modal="true" aria-labelledby="message-title">
        <h3 id="message-title">${title}</h3>
        <p>${message}</p>
        <div class="confirm-actions">
          ${showCancel ? `<button type="button" class="confirm-cancel">${cancelText}</button>` : ""}
          <button type="button" class="confirm-delete">${confirmText}</button>
        </div>
      </div>`;
    app.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector(".confirm-delete").addEventListener("click", () => {
      if (onConfirm) onConfirm();
      close();
    });
    overlay.querySelector(".confirm-cancel")?.addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    overlay._escapeHandler = (event) => {
      if (event.key === "Escape") {
        close();
        document.removeEventListener("keydown", overlay._escapeHandler);
      }
    };
    document.addEventListener("keydown", overlay._escapeHandler);
  }

  function closeModal() {
    app.querySelectorAll(".form-overlay, .confirm-overlay").forEach((modal) => modal.remove());
  }

  function showFormModal(form) {
    closeModal();
    const overlay = document.createElement("div");
    overlay.className = "form-overlay";
    overlay.appendChild(form);
    app.appendChild(overlay);

    const close = () => overlay.remove();
    form.querySelector(".cancel")?.addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    overlay._escapeHandler = (event) => {
      if (event.key === "Escape") {
        close();
        document.removeEventListener("keydown", overlay._escapeHandler);
      }
    };
    document.addEventListener("keydown", overlay._escapeHandler);
    return close;
  }

  function setProjectsMenu(open) {
    const sidebar = app.querySelector(".projects-sidebar");
    const backdrop = app.querySelector(".projects-backdrop");
    const toggle = app.querySelector(".projects-toggle");
    if (!sidebar || !backdrop || !toggle) return;

    sidebar.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-visible", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("projects-menu-open", open);
  }

  function renderProjects() {
    const container = app.querySelector(".projects");
    if (!container) return;
    container.innerHTML = "";

    projects.forEach((projectData) => {
      const element = document.createElement("div");
      const theme = getTheme(projectData.color) || getTheme("sage");
      element.className = "project-item";
      element.dataset.id = projectData.id;
      element.classList.toggle("is-current", projectData.id === currentProjectId);
      element.style.setProperty("--project-color", theme.main);
      element.style.setProperty("--project-color-light", theme.light);
      element.style.setProperty("--project-color-dark", theme.dark);
      element.innerHTML = `
        <button class="project-open" type="button">
          <span class="project-color" style="background-color:${theme.main}"></span>
          <span class="project-name">${projectData.name}</span>
          <span class="project-count">${projectData.todos.length}</span>
        </button>
        <button class="project-edit" type="button">Edit</button>
        <button class="project-delete" type="button">Delete</button>`;

      element.querySelector(".project-open").addEventListener("click", () => openProject(projectData.id));
      element.querySelector(".project-edit").addEventListener("click", () => showEditProjectForm(projectData.id));
      element.querySelector(".project-delete").addEventListener("click", () => deleteProject(projectData.id));
      container.appendChild(element);
    });
  }

  function openProject(id) {
    const selectedProject = project.openProject(projects, id);
    if (!selectedProject) return;
    currentProjectId = selectedProject.id;
    renderProjects();
    renderCurrentProject();
    setProjectsMenu(false);
  }

  function deleteProject(id) {
    const selectedProject = project.openProject(projects, id);
    if (!selectedProject) return;

    if (selectedProject.isDefault) {
      showMessage({ title: "Default project", message: "The default project cannot be deleted.", confirmText: "Got it", showCancel: false });
      return;
    }

    showMessage({
      title: "Delete project?",
      message: `Are you sure you want to delete "${selectedProject.name}"? All todos inside this project will also be deleted.`,
      confirmText: "Delete Project",
      onConfirm: () => {
        projects = project.deleteProject(projects, id);
        if (!projects.some((item) => item.id === currentProjectId)) currentProjectId = projects[0]?.id || null;
        storage.saveData(projects);
        renderProjects();
        renderCurrentProject();
      },
    });
  }

  function getCurrentProject() {
    return project.openProject(projects, currentProjectId);
  }

  function renderCurrentProject() {
    const selectedProject = getCurrentProject();
    const title = app.querySelector(".current-project");
    if (!selectedProject || !title) return;
    const theme = getTheme(selectedProject.color) || getTheme("sage");
    title.innerHTML = `
      <div class="project-heading" style="--project-color:${theme.main};--project-color-light:${theme.light};--project-color-dark:${theme.dark}">
        <div>
          <span class="current-project-label">Project</span>
          <h2>${selectedProject.name}</h2>
          <span>${selectedProject.todos.length} tasks</span>
        </div>
      </div>`;
    renderTodos(selectedProject.todos);
  }

  function renderTodos(todos) {
    const container = app.querySelector(".todos");
    if (!container) return;
    container.innerHTML = "";
    if (!todos.length) {
      container.innerHTML = `<p class="empty-message">No todos yet.</p>`;
      return;
    }

    todos.forEach((todoData) => {
      const element = document.createElement("article");
      element.className = "todo-item";
      element.dataset.id = todoData.id;
      element.innerHTML = `
        <input type="checkbox" class="todo-checkbox" ${todoData.completed ? "checked" : ""}>
        <div class="todo-info">
          <h3>${todoData.title}</h3>
          <p>${todoData.description}</p>
          <span>${todoData.dueDate}</span>
        </div>
        <span class="priority">${todoData.priority}</span>
        <div class="todo-actions">
          <button class="edit-todo" type="button">Edit</button>
          <button class="delete-todo" type="button">Delete</button>
        </div>`;
      setupTodoEvents(element, todoData.id);
      container.appendChild(element);
    });
  }

  function setupTodoEvents(element, id) {
    element.querySelector(".todo-checkbox").addEventListener("change", () => {
      const selectedProject = getCurrentProject();
      if (!selectedProject) return;
      todo.toggleComplete(selectedProject.todos, id);
      storage.saveData(projects);
      renderCurrentProject();
      renderProjects();
    });
    element.querySelector(".edit-todo").addEventListener("click", () => showEditTodoForm(id));
    element.querySelector(".delete-todo").addEventListener("click", () => deleteTodo(id));
  }

  function deleteTodo(id) {
    const selectedProject = getCurrentProject();
    const selectedTodo = selectedProject && todo.openToDo(selectedProject.todos, id);
    if (!selectedProject || !selectedTodo) return;

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

  function createThemeOptions(selectedTheme = "sage") {
    return Object.entries(getThemes()).map(([name, theme]) => `
      <button type="button" class="theme-option ${name === selectedTheme ? "selected" : ""}" data-theme="${name}" style="--theme-color:${theme.main}" title="${name}" aria-label="${name}"></button>`).join("");
  }

  function setupThemeOptions(form, selectedTheme) {
    const hiddenInput = form.querySelector('[name="color"]');
    form.querySelectorAll(".theme-option").forEach((button) => {
      button.addEventListener("click", () => {
        form.querySelectorAll(".theme-option").forEach((option) => option.classList.remove("selected"));
        button.classList.add("selected");
        hiddenInput.value = button.dataset.theme;
      });
    });
    hiddenInput.value = selectedTheme;
  }

  function showAddProjectForm() {
    const form = document.createElement("form");
    form.className = "project-form modal-form";
    form.innerHTML = `
      <h3>Create Project</h3>
      <label>Project name<input type="text" name="name" required maxlength="80" autocomplete="off"></label>
      <label>Project color<div class="theme-options">${createThemeOptions()}</div><input type="hidden" name="color" value="sage"></label>
      <div class="form-actions"><button type="submit">Create</button><button type="button" class="cancel">Cancel</button></div>`;

    const close = showFormModal(form);
    setupThemeOptions(form, "sage");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      addProject(data.get("name").trim(), data.get("color"));
      close();
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

  function showEditProjectForm(id) {
    const selectedProject = project.openProject(projects, id);
    if (!selectedProject) return;
    const form = document.createElement("form");
    form.className = "project-form modal-form";
    form.innerHTML = `
      <h3>Edit Project</h3>
      <label>Project name<input type="text" name="name" value="${selectedProject.name}" required maxlength="80"></label>
      <label>Project color<div class="theme-options">${createThemeOptions(selectedProject.color)}</div><input type="hidden" name="color" value="${selectedProject.color}"></label>
      <div class="form-actions"><button type="submit">Save</button><button type="button" class="cancel">Cancel</button></div>`;

    const close = showFormModal(form);
    setupThemeOptions(form, selectedProject.color);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      project.editProject(projects, id, data.get("name").trim(), data.get("color"));
      storage.saveData(projects);
      renderProjects();
      renderCurrentProject();
      close();
    });
  }

  function showAddTodoForm() {
    if (!getCurrentProject()) return;
    const form = document.createElement("form");
    form.className = "todo-form modal-form";
    form.innerHTML = `
      <h3>Add Todo</h3>
      <label>Title<input type="text" name="title" required maxlength="120" autocomplete="off"></label>
      <label>Description<textarea name="description" rows="4"></textarea></label>
      <label>Due date<input type="date" name="dueDate"></label>
      <label>Priority
        <select name="priority" required>
          <option value="" selected disabled>Select priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
      <label>Notes<textarea name="notes" rows="4"></textarea></label>
      <div class="form-actions"><button type="submit">Add Todo</button><button type="button" class="cancel">Cancel</button></div>`;

    const close = showFormModal(form);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      addTodo(data.get("title").trim(), data.get("description").trim(), data.get("dueDate"), data.get("priority"), data.get("notes").trim());
      close();
    });
  }

  function addTodo(title, description, dueDate, priority, notes) {
    const selectedProject = getCurrentProject();
    if (!selectedProject) return;
    selectedProject.todos.push(todo.makeToDo(title, description, dueDate, priority, notes));
    storage.saveData(projects);
    renderCurrentProject();
    renderProjects();
  }

  function showEditTodoForm(id) {
    const selectedProject = getCurrentProject();
    const selectedTodo = selectedProject && todo.openToDo(selectedProject.todos, id);
    if (!selectedTodo) return;

    const form = document.createElement("form");
    form.className = "todo-form modal-form";
    form.innerHTML = `
      <h3>Edit Todo</h3>
      <label>Title<input type="text" name="title" value="${selectedTodo.title}" required maxlength="120"></label>
      <label>Description<textarea name="description" rows="4">${selectedTodo.description}</textarea></label>
      <label>Due date<input type="date" name="dueDate" value="${selectedTodo.dueDate || ""}"></label>
      <label>Priority
        <select name="priority" required>
          <option value="" disabled>Select priority</option>
          <option value="low" ${selectedTodo.priority === "low" ? "selected" : ""}>Low</option>
          <option value="medium" ${selectedTodo.priority === "medium" ? "selected" : ""}>Medium</option>
          <option value="high" ${selectedTodo.priority === "high" ? "selected" : ""}>High</option>
        </select>
      </label>
      <label>Notes<textarea name="notes" rows="4">${selectedTodo.notes || ""}</textarea></label>
      <div class="form-actions"><button type="submit">Save</button><button type="button" class="cancel">Cancel</button></div>`;

    const close = showFormModal(form);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      todo.editToDo(selectedProject.todos, id, data.get("title").trim(), data.get("description").trim(), data.get("dueDate"), data.get("priority"), data.get("notes").trim());
      storage.saveData(projects);
      renderCurrentProject();
      close();
    });
  }

  function searchTodos(value) {
    const selectedProject = getCurrentProject();
    if (!selectedProject) return;
    const searchValue = value.toLowerCase().trim();
    const results = selectedProject.todos.filter((todoData) => todoData.title.toLowerCase().includes(searchValue));
    renderTodos(results);
  }

  function setupAppEvents() {
    app.querySelector(".search-input").addEventListener("input", (event) => searchTodos(event.target.value));
    app.querySelector(".add-project").addEventListener("click", showAddProjectForm);
    app.querySelector(".add-todo").addEventListener("click", showAddTodoForm);
    app.querySelector(".projects-toggle").addEventListener("click", () => {
      const sidebar = app.querySelector(".projects-sidebar");
      setProjectsMenu(!sidebar.classList.contains("is-open"));
    });
    app.querySelector(".projects-backdrop").addEventListener("click", () => setProjectsMenu(false));
  }

  function initialize() {
    if (projects.length === 0) {
      const defaultProject = project.makeProject("Default", "sage");
      defaultProject.isDefault = true;
      projects.push(defaultProject);
      currentProjectId = defaultProject.id;
      storage.saveData(projects);
    } else {
      const defaultProject = projects.find((item) => item.isDefault) || projects[0];
      defaultProject.isDefault = true;
      projects.forEach((item) => {
        if (item.id !== defaultProject.id) item.isDefault = false;
      });
      currentProjectId = projects.some((item) => item.id === currentProjectId) ? currentProjectId : defaultProject.id;
      storage.saveData(projects);
    }
    showWelcome();
  }

  return { initialize };
}
