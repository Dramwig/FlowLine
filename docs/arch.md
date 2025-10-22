<!-- v0.1.0 -->

# FlowLine 架构说明

## 系统架构图

```
┌────────────────────────────────────────────────────────────┐
│                     FlowLine 系统架构                       │
├────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐      ┌─────────────┐   │
│  │     API     │    │    Core     │      │   Utils     │   │
│  │   Layer     │    │   Layer     │      │   Layer     │   │
│  └─────────────┘    └─────────────┘      └─────────────┘   │
│         │                   │                   │          │
│  ┌─────────────┐    ┌───────────────┐    ┌─────────────┐   │
│  │   Routes    │    │ProgramManager │    │     Log     │   │
│  │   Flask     │    │               │    │ PopenProcess│   │
│  │  SocketIO   │    │               │    │             │   │
│  └─────────────┘    └───────────────┘    └─────────────┘   │
│         │                   │                   │          │
│         │         ┌─────────────────┐           │          │
│         │         │   Core Modules  │           │          │
│         │         ├─────────────────┤           │          │
│         │         │TaskManager      │           │          │
│         │         │GPUManager       │           │          │
│         │         │ProcessManager   │           │          │
│         │         └─────────────────┘           │          │
└────────────────────────────────────────────────────────────┘
```

系统由以下部分组成：

1. **后端 (flowline/)**：
   - GPU管理模块：监控和管理GPU状态
   - 进程管理模块：创建、监控和终止进程
   - 任务队列模块：管理待执行的任务
   - API服务：为Web前端提供数据接口

2. **前端 (webpage/)**：
   - HTML/CSS/JavaScript实现的Web界面
   - 实时数据可视化
   - 用户交互操作

## 模块架构详解

### 1. Core Layer（核心层）

#### 1.1 ProgramManager（程序管理器）
**文件**: `flowline/core/program.py`

**核心职责**:
- 系统总调度器，协调其他三个管理器
- 维护主调度循环，实现任务-资源-进程的智能分配
- 处理组件间状态同步和回调通知

**关键实现**:
```python
class ProgramManager:
    def __init__(self, user_func, task_dir):
        self.gpu_manager = GPU_Manager([0], self.on_gpu_flash)
        self.process_manager = ProcessManager(self.on_process_changed)
        self.task_manager = TaskManager(task_dir)
        
    def new_process(self):
        # 智能调度算法
        if not self.process_manager.have_space():
            return
        gpu_id = self.gpu_manager.choose_gpu()
        if gpu_id is None:
            return
        task_id, dict = self.task_manager.get_next_task()
        if task_id is None:
            return
        cmd = self.func(dict, gpu_id)
        process = self.process_manager.add_process(cmd, task_id, gpu_id)
```

**线程安全机制**:
- 使用`threading.Lock()`保证并发安全
- 通过`synchronized`装饰器实现方法级锁
- 支持多线程环境下的状态同步

#### 1.2 TaskManager（任务管理器）
**文件**: `flowline/core/task.py`

**数据结构**:
```python
class Task:
    def __init__(self, task_id, dict, run_num, need_run_num, name, cmd):
        self.task_id = task_id
        self.dict = dict
        self.run_num = run_num
        self.need_run_num = need_run_num
        self.name = name
        self.cmd = cmd
        self.state = TaskStatus.PENDING
```

**Excel配置集成**:
- 使用pandas读取Excel配置
- 支持动态配置更新
- 保留关键字：`run_num`, `need_run_num`, `name`, `cmd`

**任务队列管理**:
- 使用`queue.PriorityQueue`实现优先级队列
- 支持任务重试机制
- 线程安全的队列操作

#### 1.3 GPUManager（GPU管理器）
**文件**: `flowline/core/gpu.py`

**GPU监控实现**:
```python
class GPU:
    def flash(self):
        pynvml.nvmlInit()
        handle = pynvml.nvmlDeviceGetHandleByIndex(self.gpu_id)
        memory_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
        utilization_info = pynvml.nvmlDeviceGetUtilizationRates(handle)
        # 获取GPU详细信息
```

**监控指标**:
- 内存使用率（free_memory, total_memory）
- GPU利用率（utilization）
- 温度（temperature）
- 功耗（power, max_power）
- 进程数量统计

**GPU选择策略**:
- 基于内存可用性选择
- 支持多GPU负载均衡
- 可配置最小进程内存要求

#### 1.4 ProcessManager（进程管理器）
**文件**: `flowline/core/process.py`

**进程状态机**:
```
PENDING ─> RUNNING ─> COMPLETED
              ├─> KILLING ─> KILLED
              └─> FAILED
```

**进程创建机制**:
```python
class Process:
    def __init__(self, process_id, cmd, task_id, gpu_id, on_status_changed):
        self.manager = multiprocessing.Manager()
        self.shared_dict = self.manager.dict()
        self.shared_dict["status"] = ProcessStatus.PENDING
        self._process = None
        self.result_queue = multiprocessing.Queue()
```

**并发控制**:
- 可配置最大并发进程数
- 支持进程池管理
- 进程生命周期监控

### 2. API Layer（API层）

#### 2.1 Flask Web API
**文件**: `flowline/api/routes.py`

**RESTful接口设计**:
- `/api/gpus` - GPU状态查询
- `/api/process` - 进程管理
- `/api/task/list` - 任务列表
- `/api/run` - 启动/停止调度循环

**WebSocket支持**:
- 使用Flask-SocketIO实现实时通信
- 支持状态变化实时推送
- 前端实时监控界面

#### 2.2 接口分类

**监控接口**:
```python
@app.route('/api/gpus', methods=['GET'])
def get_gpus():
    gpus_dict = program_manager.get_gpu_dict()
    return jsonify(gpus_dict)

@app.route('/api/process', methods=['GET'])
def get_processes():
    process_dict = program_manager.get_process_dict()
    return jsonify(process_dict)
```

**控制接口**:
```python
@app.route('/api/process/<process_id>/kill', methods=['POST'])
def kill_process(process_id):
    if_success = program_manager.kill_process(int(process_id))
    return jsonify({'success': if_success})

@app.route('/api/run', methods=['POST'])
def run_process_loop():
    if_run = program_manager.switch_run()
    return jsonify({'if_run': if_run})
```

### 3. Utils Layer（工具层）

#### 3.1 日志系统
**文件**: `flowline/utils/log.py`

**日志功能**:
- 自定义Log类
- 支持不同日志级别
- 进程日志文件分离

#### 3.2 进程执行器
**文件**: `flowline/utils/__init__.py`

**PopenProcess类**:
```python
class PopenProcess:
    def fcb(self, cmd):
        # 进程执行逻辑
        self.popen_process = subprocess.Popen(
            cmd,
            stdout=stdout_f,
            stderr=stderr_f,
            shell=True,
        )
        # 结果队列通信
        self.result_queue.put((success, result))
```

**特性**:
- 支持信号处理（SIGTERM）
- 标准输出/错误重定向
- 进程树清理机制

### 4. 配置管理

#### 4.1 配置类设计
**文件**: `flowline/config.py`

```python
class BaseConfig:
    DEFAULT_MIN_PROCESS_MEMORY = 10000  # MB
    DEFAULT_MAX_PROCESSES = 4
    DEBUG = False
    DEFAULT_LOOP_SLEEP_TIME = 10

class DevConfig(BaseConfig):
    DEBUG = True

class ProdConfig(BaseConfig):
    DEBUG = False
```

**环境配置**:
- 支持开发/生产环境切换
- 通过环境变量`FLOWLINE_ENV`控制
- 可扩展的配置继承体系

## 数据流架构

### 1. 任务调度数据流
```
Excel配置 → TaskManager → ProgramManager → ProcessManager → 子进程
    ↑                                                      ↓
    └─────────────── 状态反馈 ←─────────────────────────────┘
```

### 2. GPU监控数据流
```
GPU硬件 → pynvml → GPUManager → ProgramManager → API接口
    ↑                                    ↓
    └─────────── 状态更新 ←───────────────┘
```

### 3. 进程管理数据流
```
ProcessManager → 子进程 → 结果队列 → 状态更新 → 回调通知
    ↑                                                    ↓
    └─────────────── 进程控制 ←───────────────────────────┘
```

## 并发架构

### 1. 线程模型
- **主线程**: 运行Flask应用和API服务
- **调度线程**: ProgramManager的主循环线程
- **监控线程**: GPU监控线程（每个GPU一个）
- **进程线程**: 子进程执行线程

### 2. 锁机制
- **ProgramManager锁**: 保证调度操作的原子性
- **TaskManager锁**: 保护任务队列操作
- **GPUManager锁**: 保护GPU状态更新
- **ProcessManager锁**: 保护进程状态变更

### 3. 进程间通信
- **共享字典**: 使用multiprocessing.Manager().dict()
- **结果队列**: multiprocessing.Queue用于进程结果传递
- **信号处理**: 支持进程终止信号处理

## 扩展点设计

### 1. GPU选择策略扩展
```python
class GPU_Manager:
    def choose_gpu(self):
        # 可扩展的GPU选择算法
        # 当前实现：基于内存可用性
        # 可扩展：负载均衡、温度优先等
```

### 2. 任务类型扩展
```python
class TaskManager:
    def get_next_task(self):
        # 可扩展的任务获取策略
        # 当前：FIFO队列
        # 可扩展：优先级、依赖关系等
```

### 3. 监控接口扩展
```python
# 可扩展的监控指标
# - 系统资源监控
# - 网络状态监控
# - 存储空间监控
```

## 性能优化

### 1. 内存管理
- 使用共享字典减少内存拷贝
- 进程池复用减少创建开销
- 日志文件轮转防止磁盘占用

### 2. 并发优化
- 异步IO处理网络请求
- 线程池处理并发任务
- 锁粒度优化减少竞争

### 3. 监控优化
- GPU监控间隔可配置
- 状态缓存减少重复查询
- 批量更新减少API调用

## 部署架构

### 1. 单机部署
```
┌─────────────────┐
│   FlowLine      │
│   Application   │
├─────────────────┤
│  Core Modules   │
├─────────────────┤
│  GPU Hardware   │
└─────────────────┘
```

### 2. 分布式部署（规划中）
```
┌─────────────────┐    ┌─────────────────┐
│  Master Node    │    │  Worker Node    │
│  (Scheduler)    │◄──►│  (Executor)     │
└─────────────────┘    └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  GPU Cluster    │    │  GPU Cluster    │
└─────────────────┘    └─────────────────┘
```

