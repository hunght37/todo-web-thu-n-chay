// Task Management
class TaskManager {
    constructor() {
        try {
            // Kiểm tra xem localStorage có khả dụng không
            if (typeof localStorage !== 'undefined' && localStorage !== null) {
                this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            } else {
                this.tasks = [];
                console.warn('localStorage is not available');
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasks = [];
        }
        this.setupEventListeners();
        this.updateUI();
        this.setupThemeToggle();
        this.setupTooltips();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterTasks(e.target.dataset.filter);
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    addTask() {
        const taskInput = document.getElementById('task-input');
        const categoryInput = document.getElementById('task-category');
        const priorityInput = document.getElementById('task-priority');
        const deadlineInput = document.getElementById('task-deadline');

        // Enhanced validation
        if (!taskInput.value.trim()) return;
        if (!['low', 'medium', 'high'].includes(priorityInput.value)) {
            console.error('Invalid priority value');
            return;
        }

        const newTask = {
            id: Date.now(),
            text: taskInput.value.trim(),
            category: categoryInput.value.trim() || 'Uncategorized',
            priority: priorityInput.value,
            deadline: deadlineInput.value || null,
            completed: false,
            createdAt: new Date().toISOString()
        };

        // Animate task addition
        anime({
            targets: '#task-list',
            translateY: [10, 0],
            opacity: [0, 1],
            duration: 500,
            easing: 'easeOutExpo'
        });

        this.tasks.unshift(newTask);
        this.saveTasks();
        this.updateUI();

        // Reset form
        taskInput.value = '';
        categoryInput.value = '';
        priorityInput.value = 'low';
        deadlineInput.value = '';

        // Show success message
        Swal.fire({
            title: 'Task Added!',
            text: 'Your task has been successfully added.',
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }

    deleteTask(id) {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                const taskElement = document.querySelector(`[data-task-id="${id}"]`);
                
                // Animate task removal
                anime({
                    targets: taskElement,
                    translateX: 50,
                    opacity: 0,
                    duration: 500,
                    easing: 'easeOutExpo',
                    complete: () => {
                        this.tasks = this.tasks.filter(task => task.id !== id);
                        this.saveTasks();
                        this.updateUI();
                    }
                });

                Swal.fire(
                    'Deleted!',
                    'Your task has been deleted.',
                    'success'
                );
            }
        });
    }

    toggleTaskStatus(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.updateUI();

            // Animate completion
            const taskElement = document.querySelector(`[data-task-id="${id}"]`);
            anime({
                targets: taskElement,
                scale: [1, 1.05, 1],
                duration: 300,
                easing: 'easeInOutQuad'
            });
        }
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        Swal.fire({
            title: 'Edit Task',
            html: `
                <input id="swal-input1" class="swal2-input" placeholder="Task" value="${task.text}">
                <input id="swal-input2" class="swal2-input" placeholder="Category" value="${task.category}">
                <select id="swal-input3" class="swal2-select">
                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                </select>
                <input id="swal-input4" class="swal2-input" type="date" value="${task.deadline || ''}">
            `,
            focusConfirm: false,
            preConfirm: () => {
                return {
                    text: document.getElementById('swal-input1').value,
                    category: document.getElementById('swal-input2').value,
                    priority: document.getElementById('swal-input3').value,
                    deadline: document.getElementById('swal-input4').value
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                task.text = result.value.text;
                task.category = result.value.category;
                task.priority = result.value.priority;
                task.deadline = result.value.deadline;
                this.saveTasks();
                this.updateUI();
            }
        });
    }

    filterTasks(filter) {
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';

        let filteredTasks = this.tasks;
        if (filter === 'active') {
            filteredTasks = this.tasks.filter(task => !task.completed);
        } else if (filter === 'completed') {
            filteredTasks = this.tasks.filter(task => task.completed);
        }

        this.renderTasks(filteredTasks);
    }

    updateUI() {
        this.renderTasks(this.tasks);
        this.updateStats();
        this.updateProgressBar();
    }

    renderTasks(tasks) {
        const taskList = document.getElementById('task-list');
        
        // Remove old event listeners
        const oldTasks = taskList.querySelectorAll('.task-item');
        oldTasks.forEach(task => {
            const checkbox = task.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.removeEventListener('change', checkbox.changeHandler);
            }
        });
        
        taskList.innerHTML = '';

        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskElement.dataset.taskId = task.id;

            taskElement.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <input type="checkbox" ${task.completed ? 'checked' : ''}
                            class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500">
                        <div>
                            <p class="task-text text-gray-800 dark:text-gray-200">${task.text}</p>
                            <div class="flex items-center space-x-2 mt-1">
                                <span class="text-xs text-gray-500">${task.category}</span>
                                <span class="text-xs priority-${task.priority}">${task.priority}</span>
                                ${task.deadline ? `<span class="text-xs text-gray-500">${new Date(task.deadline).toLocaleDateString()}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="task-actions flex space-x-2">
                        <button onclick="taskManager.editTask(${task.id})" class="edit-btn">
                            <svg class="w-5 h-5 text-gray-500 hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </button>
                        <button onclick="taskManager.deleteTask(${task.id})" class="delete-btn">
                            <svg class="w-5 h-5 text-gray-500 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;

            const checkbox = taskElement.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => this.toggleTaskStatus(task.id));

            taskList.appendChild(taskElement);
        });

        this.setupTooltips();
    }

    updateStats() {
        document.getElementById('total-tasks').textContent = this.tasks.length;
        document.getElementById('completed-tasks').textContent = this.tasks.filter(t => t.completed).length;
        document.getElementById('active-tasks').textContent = this.tasks.filter(t => !t.completed).length;
    }

    updateProgressBar() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const progress = total === 0 ? 0 : (completed / total) * 100;

        const progressBar = document.getElementById('progress-bar');
        anime({
            targets: progressBar,
            width: `${progress}%`,
            duration: 1000,
            easing: 'easeInOutQuad'
        });
    }

    setupThemeToggle() {
        const themeToggleBtn = document.getElementById('theme-toggle');
        const darkIcon = document.getElementById('theme-toggle-dark-icon');
        const lightIcon = document.getElementById('theme-toggle-light-icon');

        try {
            if (typeof localStorage !== 'undefined' && localStorage !== null) {
                // Set initial theme
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                    darkIcon.classList.add('hidden');
                    lightIcon.classList.remove('hidden');
                } else {
                    document.documentElement.classList.remove('dark');
                    darkIcon.classList.remove('hidden');
                    lightIcon.classList.add('hidden');
                }
            }
        } catch (error) {
            console.error('Error accessing theme preference:', error);
        }

        themeToggleBtn.addEventListener('click', () => {
            try {
                document.documentElement.classList.toggle('dark');
                darkIcon.classList.toggle('hidden');
                lightIcon.classList.toggle('hidden');
                
                if (typeof localStorage !== 'undefined' && localStorage !== null) {
                    localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
                }
            } catch (error) {
                console.error('Error saving theme preference:', error);
            }
        });
    }

    setupTooltips() {
        tippy('[data-tippy-content]', {
            placement: 'top',
            animation: 'scale',
            theme: 'custom'
        });

        // Add tooltips to action buttons
        tippy('.edit-btn', {
            content: 'Edit Task',
            placement: 'top'
        });

        tippy('.delete-btn', {
            content: 'Delete Task',
            placement: 'top'
        });
    }

    saveTasks() {
        try {
            if (typeof localStorage !== 'undefined' && localStorage !== null) {
                localStorage.setItem('tasks', JSON.stringify(this.tasks));
            } else {
                console.warn('localStorage is not available');
            }
        } catch (error) {
            console.error('Error saving tasks:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Could not save tasks. Storage might not be available.',
                icon: 'error'
            });
        }
    }
}

// Initialize the task manager
const taskManager = new TaskManager();
