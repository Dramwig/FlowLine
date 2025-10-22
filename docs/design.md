<!-- v0.1.0 -->

# FlowLine 概要设计

## 系统概述

FlowLine是一个基于Python的分布式任务调度系统，主要用于管理和执行GPU密集型任务。系统采用模块化设计，通过四个核心管理器协同工作，实现高效的任务调度、GPU资源管理和进程控制。

在细节层面，FlowLine库目前有如下模块：

- core: 包含了项目的核心架构，以下详细说明各个组件设计
- api: 可以作为服务器端被调用
- utils: 提供了日志等工具

每个模块都采用面向对象结构（OOP）设计，目标是高内聚、低耦合。

## 核心架构

### 1. ProgramManager（程序管理器）
**位置**: `flowline/core/program.py`

ProgramManager是整个系统的核心协调器，负责：
- **统一调度**: 协调TaskManager、GPUManager和ProcessManager之间的交互
- **主循环控制**: 运行主调度循环，持续检查并创建新任务
- **状态同步**: 处理各组件间的状态变化和回调通知
- **资源分配**: 根据GPU可用性和任务队列状态进行智能调度

**主要功能**:
- `new_process()`: 创建新进程处理任务
- `run_loop()`: 主调度循环
- `start_process_loop()`: 启动守护线程运行主循环
- 状态回调处理（`on_process_changed`, `on_gpu_flash`）

### 2. TaskManager（任务管理器）
**位置**: `flowline/core/task.py`

TaskManager负责任务的生命周期管理：
- **任务队列管理**: 维护待执行任务的优先级队列
- **任务状态跟踪**: 记录任务的运行次数和完成状态
- **Excel配置**: 从Excel文件读取任务配置，支持动态更新
- **任务重试**: 支持失败任务重新入队

**核心组件**:
- `Task`: 任务实体类，包含任务ID、配置、运行次数等
- `TaskStatus`: 任务状态枚举（PENDING, RUNNING, COMPLETED）
- 支持任务优先级队列和状态同步

### 3. GPUManager（GPU管理器）
**位置**: `flowline/core/gpu.py`

GPUManager负责GPU资源的监控和管理：
- **GPU监控**: 实时监控GPU使用率、内存、温度、功耗等指标
- **资源分配**: 根据GPU负载情况智能选择可用GPU
- **进程统计**: 跟踪每个GPU上运行的用户进程数量
- **多GPU支持**: 支持多GPU环境下的负载均衡

**核心组件**:
- `GPU`: 单个GPU设备管理类
- `GPU_info`: GPU信息数据结构
- `GPU_Manager`: GPU管理器，支持GPU选择策略

### 4. ProcessManager（进程管理器）
**位置**: `flowline/core/process.py`

ProcessManager负责进程的生命周期控制：
- **进程创建**: 根据任务配置创建子进程
- **状态管理**: 跟踪进程状态（PENDING, RUNNING, COMPLETED, FAILED, KILLED）
- **进程控制**: 支持进程终止、重启等操作
- **并发控制**: 限制最大并发进程数量

**核心组件**:
- `Process`: 进程实体类，包含进程ID、命令、状态等
- `ProcessStatus`: 进程状态枚举
- 支持进程状态转换和异常处理

## 系统工作流程

### 1. 初始化阶段
```
ProgramManager启动
    ↓
初始化TaskManager（读取Excel配置）
    ↓
初始化GPUManager（监控GPU资源）
    ↓
初始化ProcessManager（设置最大进程数）
    ↓
启动主调度循环
```

### 2. 任务调度循环
```
主循环检查
    ↓
检查ProcessManager是否有可用空间
    ↓
通过GPUManager选择可用GPU
    ↓
从TaskManager获取下一个任务
    ↓
创建新进程执行任务
    ↓
更新任务和GPU状态
```

### 3. 状态同步机制
- **进程状态变化**: ProcessManager → ProgramManager → TaskManager/GPUManager
- **GPU状态变化**: GPUManager → ProgramManager
- **任务完成**: TaskManager → ProgramManager → 更新Excel


## 技术栈

- **语言**: Python 3.x
- **并发**: threading, multiprocessing
- **GPU监控**: pynvml
- **数据处理**: pandas
- **配置管理**: Excel文件
- **日志**: 自定义Log类

