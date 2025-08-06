const API_BASE_URL = `http://${window.location.hostname}:5000/api`;

// 全局变量
let currentSettings = {}; // 存储当前设置
let hasChanges = false; // 跟踪是否有未保存的更改
let selectedTab = 'general'; // 当前选中的标签页

// DOM 元素
const tabItems = document.querySelectorAll('.tab-item');
const settingsPanels = document.querySelectorAll('.settings-panel');
const saveButtons = document.querySelectorAll('[id$="Btn"]'); // 所有保存按钮
const resetSystemBtn = document.getElementById('resetSystemBtn');
const confirmDialog = document.getElementById('confirmDialog');
const confirmMessage = document.getElementById('confirmMessage');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');
const checkUpdatesBtn = document.getElementById('checkUpdatesBtn');
const viewLogsBtn = document.getElementById('viewLogsBtn');
const systemInfoEl = document.getElementById('systemInfo');
const uptimeEl = document.getElementById('uptime');
const toast = document.getElementById('toast');
const toastMessage = document.querySelector('.toast-message');

// 设置表单元素
const formInputs = document.querySelectorAll('input, select');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 加载设置
    loadSettings();
    
    // 加载系统信息
    loadSystemInfo();
    
    // 更新运行时间
    updateUptime();
    setInterval(updateUptime, 10000); // 每10秒更新一次
    
    // 绑定事件
    bindEvents();
});

// 绑定事件处理函数
function bindEvents() {
    // 标签页切换
    tabItems.forEach(tabItem => {
        tabItem.addEventListener('click', () => {
            const tabName = tabItem.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // 保存按钮
    document.getElementById('saveGeneralBtn').addEventListener('click', () => saveSettings('general'));
    document.getElementById('saveGpuBtn').addEventListener('click', () => saveSettings('gpu'));
    document.getElementById('saveTasksBtn').addEventListener('click', () => saveSettings('tasks'));
    document.getElementById('saveLogsBtn').addEventListener('click', () => saveSettings('logs'));
    document.getElementById('saveSystemBtn').addEventListener('click', () => saveSettings('system'));
    
    // 重置系统设置按钮
    resetSystemBtn.addEventListener('click', () => {
        showConfirmDialog('确定要重置所有系统设置吗？这将恢复所有默认设置，且无法撤销。', () => {
            resetSettings();
        });
    });
    
    // 确认对话框
    confirmBtn.addEventListener('click', () => {
        // 执行存储的确认回调
        if (confirmBtn.callback) {
            confirmBtn.callback();
        }
        hideConfirmDialog();
    });
    
    cancelBtn.addEventListener('click', hideConfirmDialog);
    
    // 检查更新
    checkUpdatesBtn.addEventListener('click', checkUpdates);
    
    // 查看系统日志
    viewLogsBtn.addEventListener('click', viewSystemLogs);
    
    // 监听表单变化
    formInputs.forEach(input => {
        input.addEventListener('change', () => {
            hasChanges = true;
        });
    });
    
    // 在离开页面前提示保存
    window.addEventListener('beforeunload', (e) => {
        if (hasChanges) {
            // 显示确认对话框
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });
}

// 切换标签页
function switchTab(tabName) {
    // 如果有未保存的更改，提示保存
    if (hasChanges && selectedTab !== tabName) {
        showConfirmDialog('您有未保存的更改，是否继续？', () => {
            changeTab(tabName);
        });
    } else {
        changeTab(tabName);
    }
}

// 切换标签页的实际实现
function changeTab(tabName) {
    selectedTab = tabName;
    
    // 更新标签页状态
    tabItems.forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabName);
    });
    
    // 更新面板状态
    settingsPanels.forEach(panel => {
        panel.classList.toggle('active', panel.id === `${tabName}-panel`);
    });
    
    // 重置更改状态
    hasChanges = false;
}

// 加载设置
function loadSettings() {
    // 模拟API请求获取设置
    setTimeout(() => {
        // 这里应该是实际的API调用
        // fetch('/api/settings').then(response => response.json()).then(data => {...})
        
        // 模拟数据
        currentSettings = {
            general: {
                appName: 'FlowLine',
                language: 'zh-CN',
                theme: 'light',
                dataDir: '/home/me/flowline/data',
                backupInterval: 24,
                autoCleanup: true
            },
            gpu: {
                gpuRefreshInterval: 5,
                temperatureUnit: 'celsius',
                gpuAutoDetect: true,
                maxTemperature: 85,
                maxUtilization: 95,
                maxMemoryUsage: 90
            },
            tasks: {
                maxConcurrentTasks: 4,
                taskTimeoutHours: 24,
                autoRetry: true,
                maxRetries: 3,
                taskHistoryDays: 30,
                compressTaskLogs: false
            },
            logs: {
                globalLogLevel: 'info',
                gpuLogLevel: 'info',
                apiLogLevel: 'info',
                logDir: '/home/me/flowline/flowline/log',
                maxLogSizeMB: 100,
                logRotationCount: 5,
                compressOldLogs: true
            },
            system: {
                maxCpuUsage: 80,
                maxMemoryUsagePercent: 80,
                diskSpaceWarning: 20,
                apiPort: 5000,
                apiHost: '0.0.0.0',
                enableAuth: true,
                debugMode: false
            }
        };
        
        // 填充表单
        fillSettingsForm();
    }, 300);
}

// 填充设置表单
function fillSettingsForm() {
    // 通用设置
    document.getElementById('appName').value = currentSettings.general.appName;
    document.getElementById('language').value = currentSettings.general.language;
    document.getElementById('theme').value = currentSettings.general.theme;
    document.getElementById('dataDir').value = currentSettings.general.dataDir;
    document.getElementById('backupInterval').value = currentSettings.general.backupInterval;
    document.getElementById('autoCleanup').checked = currentSettings.general.autoCleanup;
    
    // GPU设置
    document.getElementById('gpuRefreshInterval').value = currentSettings.gpu.gpuRefreshInterval;
    document.getElementById('temperatureUnit').value = currentSettings.gpu.temperatureUnit;
    document.getElementById('gpuAutoDetect').checked = currentSettings.gpu.gpuAutoDetect;
    document.getElementById('maxTemperature').value = currentSettings.gpu.maxTemperature;
    document.getElementById('maxUtilization').value = currentSettings.gpu.maxUtilization;
    document.getElementById('maxMemoryUsage').value = currentSettings.gpu.maxMemoryUsage;
    
    // 任务设置
    document.getElementById('maxConcurrentTasks').value = currentSettings.tasks.maxConcurrentTasks;
    document.getElementById('taskTimeoutHours').value = currentSettings.tasks.taskTimeoutHours;
    document.getElementById('autoRetry').checked = currentSettings.tasks.autoRetry;
    document.getElementById('maxRetries').value = currentSettings.tasks.maxRetries;
    document.getElementById('taskHistoryDays').value = currentSettings.tasks.taskHistoryDays;
    document.getElementById('compressTaskLogs').checked = currentSettings.tasks.compressTaskLogs;
    
    // 日志设置
    document.getElementById('globalLogLevel').value = currentSettings.logs.globalLogLevel;
    document.getElementById('gpuLogLevel').value = currentSettings.logs.gpuLogLevel;
    document.getElementById('apiLogLevel').value = currentSettings.logs.apiLogLevel;
    document.getElementById('logDir').value = currentSettings.logs.logDir;
    document.getElementById('maxLogSizeMB').value = currentSettings.logs.maxLogSizeMB;
    document.getElementById('logRotationCount').value = currentSettings.logs.logRotationCount;
    document.getElementById('compressOldLogs').checked = currentSettings.logs.compressOldLogs;
    
    // 系统设置
    document.getElementById('maxCpuUsage').value = currentSettings.system.maxCpuUsage;
    document.getElementById('maxMemoryUsagePercent').value = currentSettings.system.maxMemoryUsagePercent;
    document.getElementById('diskSpaceWarning').value = currentSettings.system.diskSpaceWarning;
    document.getElementById('apiPort').value = currentSettings.system.apiPort;
    document.getElementById('apiHost').value = currentSettings.system.apiHost;
    document.getElementById('enableAuth').checked = currentSettings.system.enableAuth;
    document.getElementById('debugMode').checked = currentSettings.system.debugMode;
}

// 收集表单数据
function collectFormData(section) {
    const formData = {};
    
    switch(section) {
        case 'general':
            formData.appName = document.getElementById('appName').value;
            formData.language = document.getElementById('language').value;
            formData.theme = document.getElementById('theme').value;
            formData.dataDir = document.getElementById('dataDir').value;
            formData.backupInterval = parseInt(document.getElementById('backupInterval').value, 10);
            formData.autoCleanup = document.getElementById('autoCleanup').checked;
            break;
        
        case 'gpu':
            formData.gpuRefreshInterval = parseInt(document.getElementById('gpuRefreshInterval').value, 10);
            formData.temperatureUnit = document.getElementById('temperatureUnit').value;
            formData.gpuAutoDetect = document.getElementById('gpuAutoDetect').checked;
            formData.maxTemperature = parseInt(document.getElementById('maxTemperature').value, 10);
            formData.maxUtilization = parseInt(document.getElementById('maxUtilization').value, 10);
            formData.maxMemoryUsage = parseInt(document.getElementById('maxMemoryUsage').value, 10);
            break;
        
        case 'tasks':
            formData.maxConcurrentTasks = parseInt(document.getElementById('maxConcurrentTasks').value, 10);
            formData.taskTimeoutHours = parseInt(document.getElementById('taskTimeoutHours').value, 10);
            formData.autoRetry = document.getElementById('autoRetry').checked;
            formData.maxRetries = parseInt(document.getElementById('maxRetries').value, 10);
            formData.taskHistoryDays = parseInt(document.getElementById('taskHistoryDays').value, 10);
            formData.compressTaskLogs = document.getElementById('compressTaskLogs').checked;
            break;
        
        case 'logs':
            formData.globalLogLevel = document.getElementById('globalLogLevel').value;
            formData.gpuLogLevel = document.getElementById('gpuLogLevel').value;
            formData.apiLogLevel = document.getElementById('apiLogLevel').value;
            formData.logDir = document.getElementById('logDir').value;
            formData.maxLogSizeMB = parseInt(document.getElementById('maxLogSizeMB').value, 10);
            formData.logRotationCount = parseInt(document.getElementById('logRotationCount').value, 10);
            formData.compressOldLogs = document.getElementById('compressOldLogs').checked;
            break;
        
        case 'system':
            formData.maxCpuUsage = parseInt(document.getElementById('maxCpuUsage').value, 10);
            formData.maxMemoryUsagePercent = parseInt(document.getElementById('maxMemoryUsagePercent').value, 10);
            formData.diskSpaceWarning = parseInt(document.getElementById('diskSpaceWarning').value, 10);
            formData.apiPort = parseInt(document.getElementById('apiPort').value, 10);
            formData.apiHost = document.getElementById('apiHost').value;
            formData.enableAuth = document.getElementById('enableAuth').checked;
            formData.debugMode = document.getElementById('debugMode').checked;
            break;
    }
    
    return formData;
}

// 保存设置
function saveSettings(section) {
    // 收集表单数据
    const formData = collectFormData(section);
    
    // 模拟API请求保存设置
    // 实际应该是 fetch(`/api/settings/${section}`, { method: 'POST', body: JSON.stringify(formData) })
    
    // 更新当前设置
    currentSettings[section] = { ...formData };
    
    // 重置更改状态
    hasChanges = false;
    
    // 显示提示
    showToast(`${getSectionName(section)}尚未开放`);
}

// 重置设置
function resetSettings() {
    // 模拟API请求重置设置
    // 实际应该是 fetch('/api/settings/reset', { method: 'POST' })
    
    // 重新加载设置
    loadSettings();
    
    // 显示提示
    showToast('所有设置已重置为默认值');
}

// 加载系统信息
function loadSystemInfo() {
    fetch(`${API_BASE_URL}/system/info`).then(response => response.text()).then(data => {
        systemInfoEl.textContent = data;
    });
}

// 更新运行时间
function updateUptime() {
    fetch(`${API_BASE_URL}/system/uptime`).then(response => response.json()).then(data => {
        const uptime = `${data.days}天 ${data.hours}小时 ${data.minutes}分钟 ${data.seconds}秒`;
        uptimeEl.textContent = uptime;
    });
}

// 检查更新
function checkUpdates() {
    showToast('尚未开放', 3000, 'error');
}

// 查看系统日志
function viewSystemLogs() {
    // 跳转到日志页面并预选程序日志
    window.location.href = '/logs';
}

// 显示确认对话框
function showConfirmDialog(message, callback) {
    confirmMessage.textContent = message;
    confirmBtn.callback = callback;
    confirmDialog.classList.add('show');
}

// 隐藏确认对话框
function hideConfirmDialog() {
    confirmDialog.classList.remove('show');
}

// 获取设置部分的名称
function getSectionName(section) {
    const names = {
        'general': '通用设置',
        'gpu': 'GPU设置',
        'tasks': '任务设置',
        'logs': '日志设置',
        'system': '系统设置'
    };
    
    return names[section] || '设置';
}