const API_BASE_URL = `http://${window.location.hostname}:5000/api`;

// 全局变量
let logFiles = [];
let currentLogFile = null;
let logContent = [];
let filteredContent = [];
let searchTerm = '';
let selectedLogLevel = 'all';
let maxLines = 1000;
let autoScroll = true;
let pollingInterval = null;

// DOM 元素
const logFilesEl = document.getElementById('logFiles');
const logContentEl = document.getElementById('logContent');
const currentLogTitleEl = document.getElementById('currentLogTitle');
const searchTermInput = document.getElementById('searchTerm');
const logLevelSelect = document.getElementById('logLevel');
const maxLinesInput = document.getElementById('maxLines');
const applyFilterBtn = document.getElementById('applyFilterBtn');
const refreshBtn = document.getElementById('refreshBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearLogBtn = document.getElementById('clearLogBtn');
const autoScrollCheckbox = document.getElementById('autoScrollCheckbox');
const toast = document.getElementById('toast');
const toastMessage = document.querySelector('.toast-message');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 加载日志文件列表
    loadLogFiles();
    
    // 绑定事件
    bindEvents();
});

// 绑定事件处理函数
function bindEvents() {
    // 日志文件选择
    logFilesEl.addEventListener('click', (e) => {
        const logFileCard = e.target.closest('.log-file-card');
        if (logFileCard) {
            const logFileName = logFileCard.dataset.filename;
            selectLogFile(logFileName);
        }
    });
    
    // 应用筛选按钮
    applyFilterBtn.addEventListener('click', () => {
        // 获取过滤值
        searchTerm = searchTermInput.value.trim().toLowerCase();
        selectedLogLevel = logLevelSelect.value;
        maxLines = parseInt(maxLinesInput.value, 10) || 1000;
        applyFilters();
        showToast('筛选已应用');
    });
    
    // 回车键应用筛选
    searchTermInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchTerm = searchTermInput.value.trim().toLowerCase();
            selectedLogLevel = logLevelSelect.value;
            maxLines = parseInt(maxLinesInput.value, 10) || 1000;
            applyFilters();
            showToast('筛选已应用');
        }
    });
    
    // 刷新按钮
    refreshBtn.addEventListener('click', () => {
        loadLogFiles();
        if (currentLogFile) {
            loadLogContent(currentLogFile);
        }
        showToast('日志已刷新');
    });
    
    // 下载按钮
    downloadBtn.addEventListener('click', () => {
        if (currentLogFile) {
            downloadLog(currentLogFile);
        }
    });
    
    // 清空日志按钮
    clearLogBtn.addEventListener('click', () => {
        if (currentLogFile) {
            clearLog(currentLogFile);
        }
    });
    
    // 自动滚动复选框
    autoScrollCheckbox.addEventListener('change', () => {
        autoScroll = autoScrollCheckbox.checked;
        if (autoScroll && logContentEl.scrollHeight > 0) {
            scrollToBottom();
        }
    });
}

// 加载日志文件列表
async function loadLogFiles() {
    const response = await fetch(`${API_BASE_URL}/log/list`)
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    logFiles = data.files;    
    renderLogFiles();
}

// 渲染日志文件列表
function renderLogFiles() {
    // 清空日志文件列表
    logFilesEl.innerHTML = '';
    
    // 渲染日志文件卡片
    logFiles.forEach(logFile => {
        const logFileCard = document.createElement('div');
        logFileCard.className = 'log-file-card';
        logFileCard.dataset.filename = logFile.name;
        
        if (currentLogFile && currentLogFile === logFile.name) {
            logFileCard.classList.add('selected');
        }
        
        logFileCard.innerHTML = `
            <div class="log-file-indicator ${logFile.type}"></div>
            <div class="log-file-name">${logFile.name}</div>
            <div class="log-file-size">${logFile.size}</div>
        `;
        
        logFilesEl.appendChild(logFileCard);
    });
}

// 选择日志文件
function selectLogFile(logFileName) {
    // 如果选择的是当前已选择的文件，不做任何操作
    if (currentLogFile === logFileName) return;
    
    // 更新当前选择的日志文件
    currentLogFile = logFileName;
    
    // 更新UI状态
    const logFileCards = logFilesEl.querySelectorAll('.log-file-card');
    logFileCards.forEach(card => {
        card.classList.toggle('selected', card.dataset.filename === logFileName);
    });
    
    // 更新标题
    currentLogTitleEl.textContent = `日志文件: ${logFileName}`;
    
    // 启用相关按钮
    downloadBtn.disabled = false;
    clearLogBtn.disabled = false;
    
    // 加载日志内容
    loadLogContent(logFileName);
    
    // 启动轮询
    startPolling(logFileName);
}

// 加载日志内容
async function loadLogContent(logFileName) {
    logContentEl.innerHTML = '<div class="empty-log-state">正在加载日志内容...</div>';

    response = await fetch(`${API_BASE_URL}/log/${logFileName}?maxLines=${maxLines}`)
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    logContent = data.lines;

    // 应用过滤器并渲染日志内容
    applyFilters();
}

// 格式化时间戳
function formatTimestamp(date) {
    const pad = (num) => (num < 10 ? '0' + num : num);
    
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// 应用过滤器
function applyFilters() {    
    // 应用过滤
    filteredContent = logContent.filter(log => {
        // 先过滤日志级别
        if (selectedLogLevel !== 'all' && log.level.toLowerCase() !== selectedLogLevel) {
            return false;
        }
        
        // 再过滤搜索词
        if (searchTerm && !log.message.toLowerCase().includes(searchTerm) && !log.level.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        return true;
    });
    
    // 限制显示行数
    if (filteredContent.length > maxLines) {
        filteredContent = filteredContent.slice(-maxLines);
    }
    
    // 渲染过滤后的日志内容
    renderLogContent();
    
}

// 渲染日志内容
function renderLogContent() {
    // 如果没有选择日志文件或没有日志内容，显示空状态
    if (!currentLogFile || filteredContent.length === 0) {
        logContentEl.innerHTML = '<div class="empty-log-state">没有匹配的日志内容</div>';
        return;
    }
    
    // 清空日志内容
    logContentEl.innerHTML = '';
    
    // 渲染日志行
    filteredContent.forEach(log => {
        const logLine = document.createElement('div');
        logLine.className = `log-line ${log.level.toLowerCase()}`;
        
        // 格式化日志行
        let logMessage = log.message;
        
        // 高亮搜索词
        if (searchTerm) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            logMessage = logMessage.replace(regex, '<span class="log-highlight">$1</span>');
        }
        
        logLine.innerHTML = `<span class="log-timestamp">${log.timestamp}</span><span class="log-level">[${log.level}]</span> ${logMessage}`;
        
        logContentEl.appendChild(logLine);
    });
    
    // 如果启用了自动滚动，滚动到底部
    if (autoScroll) {
        scrollToBottom();
    }
}

// 滚动到底部
function scrollToBottom() {
    logContentEl.scrollTop = logContentEl.scrollHeight;
}

// 启动轮询更新
function startPolling(logFileName) {
    // 先清除现有的轮询
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    // 每5秒钟轮询一次日志更新
    pollingInterval = setInterval(() => {
        if (currentLogFile === logFileName) {
            // 模拟日志更新
            loadLogContent(currentLogFile);
        } else {
            // 如果当前日志文件改变了，停止轮询
            clearInterval(pollingInterval);
        }
    }, 5000);
}

// 下载日志
function downloadLog(logFileName) {
    // 实际应用中，这里应该直接提供一个API端点来下载日志文件
    // 模拟下载
    const logText = filteredContent.map(log => 
        `${log.timestamp} [${log.level}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = logFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('日志文件已下载');
}

// 清空日志
function clearLog(logFileName) {
    // 实际应用中，这里应该调用API来清空日志文件
    // 模拟清空日志
    logContent = [];
    filteredContent = [];
    
    // 更新UI
    renderLogContent();
    
    showToast(`日志文件 ${logFileName} 已清空`);
}
