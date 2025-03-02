// DOM Elements
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const taskTitle = document.getElementById('taskTitle');
const taskDescription = document.getElementById('taskDescription');
const taskDueDate = document.getElementById('taskDueDate');
const taskPriority = document.getElementById('taskPriority');
const filterStatus = document.getElementById('filterStatus');
const filterPriority = document.getElementById('filterPriority');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const totalTasksCount = document.getElementById('totalTasks');
const pendingTasksCount = document.getElementById('pendingTasks');
const completedTasksCount = document.getElementById('completedTasks');
const themeToggle = document.getElementById('themeToggle');

// Edit Modal Elements
const editModal = document.getElementById('editModal');
const editTaskForm = document.getElementById('editTaskForm');
const editTaskId = document.getElementById('editTaskId');
const editTaskTitle = document.getElementById('editTaskTitle');
const editTaskDescription = document.getElementById('editTaskDescription');
const editTaskDueDate = document.getElementById('editTaskDueDate');
const editTaskPriority = document.getElementById('editTaskPriority');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Detail Modal Elements
const detailModal = document.getElementById('detailModal');
const detailTaskTitle = document.getElementById('detailTaskTitle');
const detailTaskDescription = document.getElementById('detailTaskDescription');
const detailTaskDueDate = document.getElementById('detailTaskDueDate');
const detailTaskPriority = document.getElementById('detailTaskPriority');
const detailTaskCreated = document.getElementById('detailTaskCreated');
const detailTaskStatus = document.getElementById('detailTaskStatus');
const detailCloseButtons = document.querySelectorAll('.detail-close');

// Notification
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');

// Application State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = {
    status: 'all',
    priority: 'all'
};

// Initialize App
function init() {
    renderTasks();
    updateTaskCounts();
    loadTheme();
}

// Event Listeners
function setupEventListeners() {
    // Form submissions
    taskForm.addEventListener('submit', addTask);
    editTaskForm.addEventListener('submit', saveEditedTask);
    
    // Filters
    filterStatus.addEventListener('change', updateFilters);
    filterPriority.addEventListener('change', updateFilters);
    
    // Buttons
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    cancelEditBtn.addEventListener('click', closeEditModal);
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => {
            editModal.style.display = 'none';
            detailModal.style.display = 'none';
        });
    });
    
    detailCloseButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            detailModal.style.display = 'none';
        });
    });
    
    // Theme toggling
    themeToggle.addEventListener('click', toggleTheme);
    
    // Task list event delegation
    taskList.addEventListener('click', handleTaskActions);
}

// Tasks CRUD Operations
function addTask(e) {
    e.preventDefault();
    
    const title = taskTitle.value.trim();
    
    if (!title) {
        showNotification('Task title cannot be empty!', 'error');
        return;
    }
    
    const newTask = {
        id: Date.now().toString(),
        title: title,
        description: taskDescription.value.trim(),
        dueDate: taskDueDate.value,
        priority: taskPriority.value,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(newTask);
    saveTasks();
    
    taskForm.reset();
    renderTasks();
    updateTaskCounts();
    
    showNotification('Task added successfully!', 'success');
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
        updateTaskCounts();
        showNotification('Task deleted!', 'success');
    }
}

function toggleTaskStatus(taskId) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    
    saveTasks();
    renderTasks();
    updateTaskCounts();
}

function editTask(taskId) {
    const task = tasks.find(task => task.id === taskId);
    
    if (task) {
        editTaskId.value = task.id;
        editTaskTitle.value = task.title;
        editTaskDescription.value = task.description || '';
        editTaskDueDate.value = task.dueDate || '';
        editTaskPriority.value = task.priority;
        
        editModal.style.display = 'block';
    }
}

function saveEditedTask(e) {
    e.preventDefault();
    
    const taskId = editTaskId.value;
    const title = editTaskTitle.value.trim();
    
    if (!title) {
        showNotification('Task title cannot be empty!', 'error');
        return;
    }
    
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return {
                ...task,
                title: title,
                description: editTaskDescription.value.trim(),
                dueDate: editTaskDueDate.value,
                priority: editTaskPriority.value
            };
        }
        return task;
    });
    
    saveTasks();
    renderTasks();
    closeEditModal();
    showNotification('Task updated successfully!', 'success');
}

function viewTaskDetails(taskId) {
    const task = tasks.find(task => task.id === taskId);
    
    if (task) {
        detailTaskTitle.textContent = task.title;
        detailTaskDescription.textContent = task.description || 'No description provided.';
        detailTaskDueDate.textContent = task.dueDate ? formatDate(task.dueDate) : 'No due date set';
        detailTaskPriority.textContent = capitalizeFirstLetter(task.priority);
        detailTaskCreated.textContent = formatDate(new Date(task.createdAt));
        detailTaskStatus.textContent = task.completed ? 'Completed' : 'Pending';
        
        // Add priority class
        detailTaskPriority.className = '';
        detailTaskPriority.classList.add(`priority-${task.priority}`);
        
        // Add status class
        detailTaskStatus.className = '';
        detailTaskStatus.classList.add(task.completed ? 'status-completed' : 'status-pending');
        
        detailModal.style.display = 'block';
    }
}

function clearCompletedTasks() {
    if (tasks.some(task => task.completed)) {
        if (confirm('Are you sure you want to clear all completed tasks?')) {
            tasks = tasks.filter(task => !task.completed);
            saveTasks();
            renderTasks();
            updateTaskCounts();
            showNotification('Completed tasks cleared!', 'success');
        }
    } else {
        showNotification('No completed tasks to clear!', 'info');
    }
}

// UI Operations
function renderTasks() {
    taskList.innerHTML = '';
    
    const filteredTasks = filterTasks();
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <li class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>No tasks to display</p>
                <small>Add a new task or change your filters</small>
            </li>
        `;
        return;
    }
    
    filteredTasks.forEach(task => {
        const dueDateFormatted = task.dueDate ? formatDate(task.dueDate) : '';
        const overdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date().setHours(0, 0, 0, 0);
        
        const taskElement = document.createElement('li');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''} ${overdue ? 'overdue' : ''}`;
        taskElement.dataset.id = task.id;
        taskElement.dataset.priority = task.priority;
        
        taskElement.innerHTML = `
            <div class="task-item-content">
                <div class="task-checkbox">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} id="check-${task.id}">
                    <label for="check-${task.id}"></label>
                </div>
                <div class="task-info">
                    <h3 class="task-title">${task.title}</h3>
                    ${task.description ? `<p class="task-description">${truncateText(task.description, 60)}</p>` : ''}
                    <div class="task-meta">
                        ${task.dueDate ? `<span class="due-date ${overdue ? 'overdue' : ''}"><i class="fas fa-calendar"></i> ${dueDateFormatted}</span>` : ''}
                        <span class="priority priority-${task.priority}">
                            <i class="fas fa-flag"></i> ${capitalizeFirstLetter(task.priority)}
                        </span>
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-icon btn-view" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon btn-edit" title="Edit Task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" title="Delete Task">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        taskList.appendChild(taskElement);
    });
}

function updateTaskCounts() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    
    totalTasksCount.textContent = totalTasks;
    completedTasksCount.textContent = completedTasks;
    pendingTasksCount.textContent = pendingTasks;
}

function filterTasks() {
    return tasks.filter(task => {
        // Filter by status
        if (currentFilter.status === 'pending' && task.completed) return false;
        if (currentFilter.status === 'completed' && !task.completed) return false;
        
        // Filter by priority
        if (currentFilter.priority !== 'all' && task.priority !== currentFilter.priority) return false;
        
        return true;
    });
}

function updateFilters() {
    currentFilter.status = filterStatus.value;
    currentFilter.priority = filterPriority.value;
    renderTasks();
}

function handleTaskActions(e) {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;
    
    const taskId = taskItem.dataset.id;
    
    // Handle checkbox toggle
    if (e.target.type === 'checkbox' || e.target.tagName === 'LABEL') {
        toggleTaskStatus(taskId);
    }
    
    // Handle buttons
    if (e.target.closest('.btn-delete')) {
        deleteTask(taskId);
    } else if (e.target.closest('.btn-edit')) {
        editTask(taskId);
    } else if (e.target.closest('.btn-view')) {
        viewTaskDetails(taskId);
    }
}

function closeEditModal() {
    editModal.style.display = 'none';
    editTaskForm.reset();
}

function showNotification(message, type = 'info') {
    notificationMessage.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Theme functions
function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
    setTheme(currentTheme);
}

function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.classList.remove('fa-moon');
        themeToggle.classList.add('fa-sun');
    } else {
        document.body.classList.remove('dark-theme');
        themeToggle.classList.remove('fa-sun');
        themeToggle.classList.add('fa-moon');
    }
    
    localStorage.setItem('theme', theme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

// Utility functions
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

// Initialize the app and set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    init();
    setupEventListeners();
});
