/* ============================================================
   Task Tracker — Frontend Application
   ============================================================ */

(() => {
    'use strict';

    const API_BASE = window.location.origin;

    // ===================== API CLIENT =====================

    const api = {
        // ----- Task Lists -----
        async listTaskLists() {
            return request('GET', '/task-lists');
        },
        async createTaskList(data) {
            return request('POST', '/task-lists', data);
        },
        async getTaskList(id) {
            return request('GET', `/task-lists/${id}`);
        },
        async updateTaskList(id, data) {
            return request('PUT', `/task-lists/${id}`, data);
        },
        async deleteTaskList(id) {
            return request('DELETE', `/task-lists/${id}`);
        },

        // ----- Tasks -----
        async listTasks(taskListId) {
            return request('GET', `/task-lists/${taskListId}/tasks`);
        },
        async createTask(taskListId, data) {
            return request('POST', `/task-lists/${taskListId}/tasks`, data);
        },
        async getTask(taskListId, taskId) {
            return request('GET', `/task-lists/${taskListId}/tasks/${taskId}`);
        },
        async updateTask(taskListId, taskId, data) {
            return request('PUT', `/task-lists/${taskListId}/tasks/${taskId}`, data);
        },
        async deleteTask(taskListId, taskId) {
            return request('DELETE', `/task-lists/${taskListId}/tasks/${taskId}`);
        }
    };

    async function request(method, path, body) {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(`${API_BASE}${path}`, opts);

        if (!res.ok) {
            let errData;
            try { errData = await res.json(); } catch { errData = null; }
            const message = errData?.message || `Request failed (${res.status})`;
            const details = errData?.details || '';
            throw { status: res.status, message, details };
        }

        if (res.status === 204 || res.headers.get('content-length') === '0') return null;

        const text = await res.text();
        if (!text) return null;
        return JSON.parse(text);
    }

    // ===================== STATE =====================

    let taskLists = [];
    let activeListId = null;
    let currentTasks = [];

    // ===================== DOM REFS =====================

    const $sidebar          = document.getElementById('sidebar');
    const $sidebarOpenBtn   = document.getElementById('sidebar-open-btn');
    const $sidebarCloseBtn  = document.getElementById('sidebar-close-btn');
    const $listsContainer   = document.getElementById('task-lists-container');
    const $emptySidebar     = document.getElementById('empty-sidebar');
    const $mainTitle        = document.getElementById('main-title');
    const $mainSubtitle     = document.getElementById('main-subtitle');
    const $mainActions      = document.getElementById('main-header-actions');
    const $emptyMain        = document.getElementById('empty-main');
    const $emptyTasks       = document.getElementById('empty-tasks');
    const $tasksContainer   = document.getElementById('tasks-container');
    const $toastContainer   = document.getElementById('toast-container');

    // Task List Modal
    const $modalTL          = document.getElementById('modal-task-list');
    const $modalTLTitle     = document.getElementById('modal-task-list-title');
    const $formTL           = document.getElementById('form-task-list');
    const $tlId             = document.getElementById('tl-id');
    const $tlTitle          = document.getElementById('tl-title');
    const $tlDesc           = document.getElementById('tl-description');
    const $tlSubmitBtn      = document.getElementById('tl-submit-btn');

    // Task Modal
    const $modalTask        = document.getElementById('modal-task');
    const $modalTaskTitle   = document.getElementById('modal-task-title');
    const $formTask         = document.getElementById('form-task');
    const $taskId           = document.getElementById('task-id');
    const $taskTitle        = document.getElementById('task-title');
    const $taskDesc         = document.getElementById('task-description');
    const $taskDueDate      = document.getElementById('task-due-date');
    const $taskPriority     = document.getElementById('task-priority');
    const $taskStatus       = document.getElementById('task-status');
    const $taskStatusGroup  = document.getElementById('task-status-group');
    const $taskSubmitBtn    = document.getElementById('task-submit-btn');

    // Confirm Modal
    const $modalConfirm     = document.getElementById('modal-confirm');
    const $confirmTitle     = document.getElementById('confirm-title');
    const $confirmMsg       = document.getElementById('confirm-message');
    const $confirmYes       = document.getElementById('confirm-yes-btn');

    // ===================== INIT =====================

    async function init() {
        bindEvents();
        await loadTaskLists();
    }

    function bindEvents() {
        // Sidebar toggle
        $sidebarOpenBtn.addEventListener('click', () => $sidebar.classList.add('open'));
        $sidebarCloseBtn.addEventListener('click', () => $sidebar.classList.remove('open'));

        // New Task List
        document.getElementById('btn-new-task-list').addEventListener('click', openNewTaskListModal);

        // Edit / Delete list
        document.getElementById('btn-edit-list').addEventListener('click', openEditTaskListModal);
        document.getElementById('btn-delete-list').addEventListener('click', confirmDeleteTaskList);

        // New Task
        document.getElementById('btn-new-task').addEventListener('click', openNewTaskModal);

        // Task List Form
        $formTL.addEventListener('submit', handleTaskListSubmit);

        // Task Form
        $formTask.addEventListener('submit', handleTaskSubmit);

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.modal;
                closeModal(document.getElementById(modalId));
            });
        });

        // Close modal on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal(overlay);
            });
        });

        // Escape key closes modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.open').forEach(closeModal);
            }
        });
    }

    // ===================== TASK LISTS =====================

    async function loadTaskLists() {
        try {
            taskLists = await api.listTaskLists();
            renderTaskLists();
        } catch (err) {
            showToast('error', 'Failed to load lists', err.message);
        }
    }

    function renderTaskLists() {
        // Remove old cards
        $listsContainer.querySelectorAll('.list-card').forEach(el => el.remove());

        if (taskLists.length === 0) {
            $emptySidebar.style.display = '';
            return;
        }
        $emptySidebar.style.display = 'none';

        taskLists.forEach(list => {
            const card = document.createElement('div');
            card.className = `list-card${list.id === activeListId ? ' active' : ''}`;
            card.dataset.id = list.id;
            const progressPct = Math.round((list.progress || 0) * 100);
            card.innerHTML = `
                <div class="list-card-title">${esc(list.title)}</div>
                ${list.description ? `<div class="list-card-desc">${esc(list.description)}</div>` : '<div class="list-card-desc" style="opacity:0.3">No description</div>'}
                <div class="list-card-meta">
                    <span class="list-card-count">${list.count ?? 0} task${(list.count ?? 0) !== 1 ? 's' : ''} · ${progressPct}%</span>
                    <div class="progress-bar"><div class="progress-bar-fill" style="width:${progressPct}%"></div></div>
                </div>
            `;
            card.addEventListener('click', () => selectTaskList(list.id));
            $listsContainer.appendChild(card);
        });
    }

    async function selectTaskList(id) {
        activeListId = id;
        $sidebar.classList.remove('open');

        // Highlight
        $listsContainer.querySelectorAll('.list-card').forEach(c =>
            c.classList.toggle('active', c.dataset.id === id)
        );

        const list = taskLists.find(l => l.id === id);
        if (!list) return;

        $mainTitle.textContent = list.title;
        $mainSubtitle.textContent = list.description || '';
        $mainActions.style.display = 'flex';
        $emptyMain.style.display = 'none';

        await loadTasks(id);
    }

    // Create / Edit Task List Modal
    function openNewTaskListModal() {
        $modalTLTitle.textContent = 'New Task List';
        $tlSubmitBtn.textContent = 'Create List';
        $tlId.value = '';
        $tlTitle.value = '';
        $tlDesc.value = '';
        openModal($modalTL);
        $tlTitle.focus();
    }

    function openEditTaskListModal() {
        const list = taskLists.find(l => l.id === activeListId);
        if (!list) return;
        $modalTLTitle.textContent = 'Edit Task List';
        $tlSubmitBtn.textContent = 'Save Changes';
        $tlId.value = list.id;
        $tlTitle.value = list.title;
        $tlDesc.value = list.description || '';
        openModal($modalTL);
        $tlTitle.focus();
    }

    async function handleTaskListSubmit(e) {
        e.preventDefault();
        const isEdit = !!$tlId.value;
        const payload = {
            title: $tlTitle.value.trim(),
            description: $tlDesc.value.trim() || null
        };

        try {
            if (isEdit) {
                payload.id = $tlId.value;
                await api.updateTaskList($tlId.value, payload);
                showToast('success', 'List updated');
            } else {
                const created = await api.createTaskList(payload);
                showToast('success', 'List created');
                activeListId = created.id;
            }
            closeModal($modalTL);
            await loadTaskLists();
            if (activeListId) await selectTaskList(activeListId);
        } catch (err) {
            showToast('error', err.message, err.details);
        }
    }

    function confirmDeleteTaskList() {
        const list = taskLists.find(l => l.id === activeListId);
        if (!list) return;
        $confirmTitle.textContent = 'Delete Task List?';
        $confirmMsg.textContent = `"${list.title}" and all its tasks will be permanently deleted.`;
        $confirmYes.onclick = async () => {
            try {
                await api.deleteTaskList(activeListId);
                showToast('success', 'List deleted');
                activeListId = null;
                closeModal($modalConfirm);
                resetMainView();
                await loadTaskLists();
            } catch (err) {
                showToast('error', err.message, err.details);
            }
        };
        openModal($modalConfirm);
    }

    function resetMainView() {
        $mainTitle.textContent = 'Select a Task List';
        $mainSubtitle.textContent = '';
        $mainActions.style.display = 'none';
        $emptyMain.style.display = 'flex';
        $emptyTasks.style.display = 'none';
        $tasksContainer.innerHTML = '';
        currentTasks = [];
    }

    // ===================== TASKS =====================

    async function loadTasks(listId) {
        try {
            currentTasks = await api.listTasks(listId);
            renderTasks();
        } catch (err) {
            showToast('error', 'Failed to load tasks', err.message);
        }
    }

    function renderTasks() {
        $tasksContainer.innerHTML = '';
        if (currentTasks.length === 0) {
            $emptyTasks.style.display = 'flex';
            $tasksContainer.style.display = 'none';
            return;
        }
        $emptyTasks.style.display = 'none';
        $tasksContainer.style.display = 'grid';

        currentTasks.forEach((task, i) => {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.style.animationDelay = `${i * 0.05}s`;
            card.dataset.id = task.id;

            const isClosed = task.status === 'CLOSED';
            const dueStr = formatDueDate(task.dueDate);
            const isOverdue = task.dueDate && !isClosed && new Date(task.dueDate) < new Date();

            card.innerHTML = `
                <div class="task-card-header">
                    <h4 class="task-card-title ${isClosed ? 'closed' : ''}">${esc(task.title)}</h4>
                    <div class="task-card-actions">
                        <button class="btn-icon-sm" data-action="edit" title="Edit task">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        </button>
                        <button class="btn-icon-sm" data-action="delete" title="Delete task">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>
                ${task.description ? `<p class="task-card-desc">${esc(task.description)}</p>` : ''}
                <div class="task-card-footer">
                    <span class="badge badge-${task.priority?.toLowerCase() || 'medium'}" data-action="cycle-priority" title="Click to change priority">${task.priority || 'MEDIUM'}</span>
                    <span class="badge badge-${task.status?.toLowerCase() || 'open'}" data-action="toggle-status" title="Click to toggle status">${task.status || 'OPEN'}</span>
                    ${dueStr ? `<span class="task-card-due ${isOverdue ? 'overdue' : ''}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        ${dueStr}
                    </span>` : ''}
                </div>
            `;

            // Event delegation on card
            card.addEventListener('click', (e) => {
                const actionEl = e.target.closest('[data-action]');
                if (!actionEl) return;
                const action = actionEl.dataset.action;
                if (action === 'edit') openEditTaskModal(task);
                if (action === 'delete') confirmDeleteTask(task);
                if (action === 'toggle-status') toggleTaskStatus(task);
                if (action === 'cycle-priority') cycleTaskPriority(task);
            });

            $tasksContainer.appendChild(card);
        });
    }

    // Create / Edit Task Modal
    function openNewTaskModal() {
        $modalTaskTitle.textContent = 'New Task';
        $taskSubmitBtn.textContent = 'Create Task';
        $taskId.value = '';
        $taskTitle.value = '';
        $taskDesc.value = '';
        $taskDueDate.value = '';
        $taskPriority.value = 'MEDIUM';
        $taskStatus.value = 'OPEN';
        $taskStatusGroup.style.display = 'none';
        openModal($modalTask);
        $taskTitle.focus();
    }

    function openEditTaskModal(task) {
        $modalTaskTitle.textContent = 'Edit Task';
        $taskSubmitBtn.textContent = 'Save Changes';
        $taskId.value = task.id;
        $taskTitle.value = task.title;
        $taskDesc.value = task.description || '';
        $taskDueDate.value = task.dueDate ? formatDateForInput(task.dueDate) : '';
        $taskPriority.value = task.priority || 'MEDIUM';
        $taskStatus.value = task.status || 'OPEN';
        $taskStatusGroup.style.display = '';
        openModal($modalTask);
        $taskTitle.focus();
    }

    async function handleTaskSubmit(e) {
        e.preventDefault();
        const isEdit = !!$taskId.value;

        const payload = {
            title: $taskTitle.value.trim(),
            description: $taskDesc.value.trim() || null,
            dueDate: $taskDueDate.value || null,
            priority: $taskPriority.value,
            status: $taskStatus.value
        };

        try {
            if (isEdit) {
                payload.id = $taskId.value;
                await api.updateTask(activeListId, $taskId.value, payload);
                showToast('success', 'Task updated');
            } else {
                await api.createTask(activeListId, payload);
                showToast('success', 'Task created');
            }
            closeModal($modalTask);
            await refreshCurrentList();
        } catch (err) {
            showToast('error', err.message, err.details);
        }
    }

    function confirmDeleteTask(task) {
        $confirmTitle.textContent = 'Delete Task?';
        $confirmMsg.textContent = `"${task.title}" will be permanently deleted.`;
        $confirmYes.onclick = async () => {
            try {
                await api.deleteTask(activeListId, task.id);
                showToast('success', 'Task deleted');
                closeModal($modalConfirm);
                await refreshCurrentList();
            } catch (err) {
                showToast('error', err.message, err.details);
            }
        };
        openModal($modalConfirm);
    }

    async function toggleTaskStatus(task) {
        const newStatus = task.status === 'OPEN' ? 'CLOSED' : 'OPEN';
        try {
            await api.updateTask(activeListId, task.id, {
                ...task,
                status: newStatus
            });
            await refreshCurrentList();
        } catch (err) {
            showToast('error', err.message, err.details);
        }
    }

    async function cycleTaskPriority(task) {
        const order = ['LOW', 'MEDIUM', 'HIGH'];
        const idx = order.indexOf(task.priority);
        const nextPriority = order[(idx + 1) % order.length];
        try {
            await api.updateTask(activeListId, task.id, {
                ...task,
                priority: nextPriority
            });
            await refreshCurrentList();
        } catch (err) {
            showToast('error', err.message, err.details);
        }
    }

    async function refreshCurrentList() {
        if (!activeListId) return;
        await loadTaskLists();
        await selectTaskList(activeListId);
    }

    // ===================== MODAL UTILS =====================

    function openModal(el) {
        el.classList.add('open');
    }

    function closeModal(el) {
        el.classList.remove('open');
    }

    // ===================== TOAST =====================

    function showToast(type, title, message) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const iconSvg = type === 'success'
            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';

        toast.innerHTML = `
            <span class="toast-icon">${iconSvg}</span>
            <div class="toast-content">
                <div class="toast-title">${esc(title)}</div>
                ${message ? `<div class="toast-message">${esc(message)}</div>` : ''}
            </div>
        `;

        $toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // ===================== HELPERS =====================

    function esc(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    function formatDueDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d)) return '';
        const now = new Date();
        const diffMs = d - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        if (diffDays === -1) return '1 day ago';
        if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
        if (diffDays <= 7) return `${diffDays} days left`;

        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function formatDateForInput(dateStr) {
        if (!dateStr) return '';
        // Backend sends ISO LocalDateTime strings like "2025-03-25T10:00:00"
        // datetime-local input expects "YYYY-MM-DDThh:mm"
        return dateStr.substring(0, 16);
    }

    // ===================== BOOT =====================
    init();

})();
