// API URL
const API_BASE_URL = `http://${window.location.hostname}:5000/api`;

// 全局变量
let tasks = [];
let selectedCategory = 'all';
let gpus = [];

// DOM 元素
const taskCategoriesEl = document.getElementById('taskCategories');
const taskListEl = document.getElementById('tasksList');
const tasksListTitleEl = document.getElementById('tasksListTitle');
const taskNameInput = document.getElementById('taskName');
const taskCommandInput = document.getElementById('taskCommand');
const taskGpuSelect = document.getElementById('taskGpu');
const createTaskBtn = document.getElementById('createTaskBtn');
const refreshBtn = document.getElementById('refreshBtn');
const clearBtn = document.getElementById('clearBtn');
const taskDetailPanel = document.getElementById('taskDetailPanel');
const closeDetailBtn = document.getElementById('closeDetailBtn');
const taskDetailTitle = document.getElementById('taskDetailTitle');
const taskDetailContent = document.getElementById('taskDetailContent');
const toast = document.getElementById('toast');
const toastMessage = document.querySelector('.toast-message');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 加载任务
    loadTasks();
    
    // 绑定事件
    bindEvents();
});

// 绑定事件处理函数
function bindEvents() {
    // 切换任务分类
    taskCategoriesEl.addEventListener('click', (e) => {
        const categoryCard = e.target.closest('.category-card');
        if (categoryCard) {
            const status = categoryCard.dataset.status;
            selectCategory(status);
        }
    });
    
    // 创建任务
    createTaskBtn.addEventListener('click', createTask);
    
    // 刷新按钮
    refreshBtn.addEventListener('click', () => {
        loadTasks();
        showToast('数据已刷新');
    });
    
    // 清空已完成/失败任务
    clearBtn.addEventListener('click', clearCompletedTasks);
    
    // 关闭详情面板
    closeDetailBtn.addEventListener('click', () => {
        taskDetailPanel.classList.remove('show');
    });
}

// 加载任务数据
async function loadTasks() {
    const response = await fetch(`${API_BASE_URL}/task/list`)
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    tasks = await response.json()

    updateTaskCounts();
    renderTasks();
}

// 更新任务计数
function updateTaskCounts() {
    const counts = {
        all: tasks.length,
        running: tasks.filter(task => task.status === 'running').length,
        pending: tasks.filter(task => task.status === 'pending').length,
        completed: tasks.filter(task => task.status === 'completed').length,
        failed: tasks.filter(task => task.status === 'failed').length,
        killed: tasks.filter(task => task.status === 'killed').length
    };
    
    // 更新计数显示
    Object.keys(counts).forEach(status => {
        const countEl = document.getElementById(`${status}-count`);
        if (countEl) {
            countEl.textContent = counts[status];
        }
    });
}

// 选择任务分类
function selectCategory(status) {
    selectedCategory = status;
    
    // 更新UI状态
    const categoryCards = taskCategoriesEl.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.classList.toggle('selected', card.dataset.status === status);
    });
    
    // 更新标题
    const titles = {
        all: '所有任务',
        running: '运行中的任务',
        pending: '等待中的任务',
        completed: '已完成的任务',
        failed: '失败的任务',
        killed: '已终止的任务'
    };
    tasksListTitleEl.textContent = titles[status] || '任务列表';
    
    // 重新渲染任务列表
    renderTasks();
}

// 渲染任务列表
function renderTasks() {
    // 筛选任务
    const filteredTasks = selectedCategory === 'all' 
        ? tasks 
        : tasks.filter(task => task.status === selectedCategory);
    
    // 清空任务列表
    taskListEl.innerHTML = '';
    
    // 渲染任务卡片
    if (filteredTasks.length === 0) {
        taskListEl.innerHTML = '<div class="empty-state">没有任务</div>';
        return;
    }
    
    filteredTasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.dataset.id = task.id;
        
        const statusLabel = {
            PENDING: '等待中',
            RUNNING: '运行中',
            COMPLETED: '已完成',
            FAILED: '失败',
            killed: '已终止'
        };
        
        taskCard.innerHTML = `
            <div class="task-header">
                <div class="task-id">${task.name}</div>
                <div class="task-status ${task.status.toLowerCase()}"></div>
            </div>
            <div class="task-info">
                <div>任务ID：<span>${task.task_id}</span></div>
                <div>状态：<span>${statusLabel[task.status]}</span></div>
                <div>运行：<span>${task.run_num}/${task.need_run_num}</span></div>
                <div>字典：</div>
                <div class="task-command">${task.dict}</div>
                ${task.progress ? `<div>进度: <span>${task.progress}%</span></div>` : ''}
                ${task.startTime ? `<div>开始时间: <span>${task.startTime}</span></div>` : ''}
                ${task.endTime ? `<div>结束时间: <span>${task.endTime}</span></div>` : ''}
                ${task.error ? `<div>错误: <span>${task.error}</span></div>` : ''}
            </div>
            <div class="task-actions">
                <button class="view-detail" data-id="${task.task_id}">查看详情</button>
                ${task.status === 'running' ? `<button class="kill" data-id="${task.task_id}">终止</button>` : ''}
            </div>
        `;
        
        taskListEl.appendChild(taskCard);
    });
    
    // 绑定任务卡片事件
    bindTaskCardEvents();
}

// 绑定任务卡片事件
function bindTaskCardEvents() {
    // 查看详情按钮
    const viewDetailBtns = document.querySelectorAll('.view-detail');
    viewDetailBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.target.dataset.id;
            showTaskDetail(taskId);
        });
    });
    
    // 终止任务按钮
    const killBtns = document.querySelectorAll('.kill');
    killBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.target.dataset.id;
            killTask(taskId);
        });
    });
}

// 显示任务详情
function showTaskDetail(taskId) {
    const task = tasks.find(t => t.task_id == taskId);
    if (!task) return;
    
    taskDetailTitle.textContent = `任务详情: ${task.name}`;
    
    const statusLabel = {
        RUNNING: '运行中',
        PENDING: '等待中',
        COMPLETED: '已完成',
        FAILED: '失败',
        KILLED: '已终止'
    };
    
    taskDetailContent.innerHTML = `
        <div class="detail-section">
            <h3>基本信息</h3>
            <div class="detail-item">
                <span class="detail-label">任务ID:</span>
                <span class="detail-value">${task.task_id}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">名称:</span>
                <span class="detail-value">${task.name}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">状态:</span>
                <span class="detail-value status-${task.status.toLowerCase()}">${statusLabel[task.status]}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">运行次数:</span>
                <span class="detail-value">${task.run_num}/${task.need_run_num}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">字典:</span>
                <span class="detail-value">${task.dict}</span>
            </div>
            ${task.startTime ? `
            <div class="detail-item">
                <span class="detail-label">开始时间:</span>
                <span class="detail-value">${task.startTime}</span>
            </div>
            ` : ''}
            ${task.endTime ? `
            <div class="detail-item">
                <span class="detail-label">结束时间:</span>
                <span class="detail-value">${task.endTime}</span>
            </div>
            ` : ''}
            ${task.error ? `
            <div class="detail-item">
                <span class="detail-label">错误:</span>
                <span class="detail-value">${task.error}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="detail-section">
            <h3>命令</h3>
            <div class="task-command">${task.cmd}</div>
        </div>
        
        <div class="detail-section">
            <h3>日志输出</h3>
            <div class="task-logs">
                <pre>${task.logs || '暂无日志输出'}</pre>
            </div>
        </div>
    `;
    
    taskDetailPanel.classList.add('show');
}

// 创建任务
async function createTask() {
    const name = taskNameInput.value.trim();
    const command = taskCommandInput.value.trim();
    
    // 验证输入
    if (!name) {
        showToast('请输入任务名称');
        return;
    }
    if (!command) {
        showToast('请输入任务命令');
        return;
    }
    
    const response = await fetch(`${API_BASE_URL}/task/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, command })
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.success) {
        showToast(result.error);   
    }else{
        renderTasks();

        taskNameInput.value = '';
        taskCommandInput.value = '';
        
        showToast('任务已创建');
    }

}

// 终止任务
function killTask(taskId) {
    // 模拟API请求终止任务
    // 实际应该是 fetch(`/api/tasks/${taskId}/kill`, { method: 'POST' })
    
    // 更新任务状态
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = 'killed';
        task.endTime = new Date().toLocaleString();
        
        // 更新UI
        updateTaskCounts();
        renderTasks();
        
        // 如果详情面板打开，更新详情
        if (taskDetailPanel.classList.contains('show') && taskDetailTitle.textContent.includes(task.name)) {
            showTaskDetail(taskId);
        }
        
        // 显示提示
        showToast('任务已终止');
    }
}

// 清空已完成/失败任务
function clearCompletedTasks() {
    // 模拟API请求清空任务
    // 实际应该是 fetch('/api/tasks/clear', { method: 'POST' })
    
    // 过滤出非已完成/失败的任务
    tasks = tasks.filter(task => !['completed', 'failed', 'killed'].includes(task.status));
    
    // 更新UI
    updateTaskCounts();
    renderTasks();
    
    // 显示提示
    showToast('已清空完成/失败任务');
}