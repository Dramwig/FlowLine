<!-- v0.1.0 -->

# API 文档

该文档描述了系统后端提供的 HTTP 接口，包括任务管理、GPU 操作、日志读取与系统信息查询等功能。代码参考`flowline/api/routes.py`

## 🔧 通用说明

- **Base URL**：`http://<host>:5000`
- **格式**：所有接口均返回 JSON 格式
- **状态码**：统一使用 HTTP 状态码表示请求状态，错误信息包含在 JSON 中

---

## 📦 GPU 管理

### GET `/api/gpus`

获取所有 GPU 的状态信息。

**响应示例**：
```json
{
  "0": {"used_memory": "500MB", "processes": [...]},
  "1": {"used_memory": "0MB", "processes": []}
}
```

### GET `/api/gpu/<gpu_id>/process`

获取指定 GPU 上运行的进程列表。

**路径参数**：

* `gpu_id`：GPU 的整数编号

**响应示例**：

```json
{
  "pid_1": {"user": "alice", "command": "python train.py"},
  "pid_2": {"user": "bob", "command": "cuda_task"}
}
```

### POST `/api/gpu/<gpu_id>/switch`

切换指定 GPU 的开关状态（开/关）。

**响应示例**：

```json
{
  "gpu_id": "1",
  "success": true,
  "is_on": false
}
```

---

## 🧵 进程管理

### GET `/api/process`

获取所有进程状态。

**响应示例**：

```json
{
  "12345": {"name": "taskA", "status": "running"},
  "23456": {"name": "taskB", "status": "stopped"}
}
```

### POST `/api/process/<process_id>/kill`

终止指定的进程。

**路径参数**：

* `process_id`：目标进程的 PID

**响应示例**：

```json
{
  "success": true
}
```

---

## ✅ 任务管理

### GET `/api/task/list`

获取任务列表及其状态信息。

**响应示例**：

```json
{
  "tasks": [
    {"id": 1, "name": "test-task", "status": "queued"},
    {"id": 2, "name": "train-task", "status": "running"}
  ]
}
```

### POST `/api/task/create`

创建新任务。

**请求体**（`application/json`）：

```json
{
  "name": "my-task",
  "cmd": "python run.py",
  "need_run_num": 3
}
```

**响应示例**：

```json
{
  "success": true
}
```



### POST `/api/run`

切换运行状态（开始或停止任务循环调度）。

**响应示例**：

```json
{
  "if_run": true
}
```

---

## 🪵 日志管理

### GET `/api/log/list`

列出所有日志文件信息。

**响应示例**：

```json
{
  "files": [
    {
      "name": "flowline.core.program.log",
      "fullPath": "/path/to/log",
      "size": "1.2MB",
      "lastModified": "2025-07-30 14:15:58"
    }
  ]
}
```



### GET `/api/log/<log_file_name>?maxLines=100`

获取日志文件的最后 N 行内容。

**响应示例**：

```json
{
  "lines": [
    {
      "timestamp": "2025-07-30 14:15:58",
      "level": "INFO",
      "message": "Process 3 finished with return code -9"
    },
    {
      "timestamp": "",
      "level": "",
      "message": "Other non-standard line"
    }
  ]
}
```

---

## 💻 系统信息

### GET `/api/system/info`

返回服务器系统信息（OS、CPU 核心数、内存等）。

**响应示例（纯文本）**：

```
Linux 5.15.0-52-generic, CPU: 16 cores, Memory: 64.0 GB
```



### GET `/api/system/uptime`

返回程序启动至今的运行时间。

**响应示例**：

```json
{
  "days": 0,
  "hours": 2,
  "minutes": 13,
  "seconds": 49
}
```

---

## 🚨 错误响应说明

当接口调用失败时，返回如下格式：

```json
{
  "error": "描述错误的原因"
}
```



## 📌 附录

* 所有接口支持跨域（已启用 CORS）
* 可用 `curl` 快速测试各类接口，如：

```bash
curl -X POST http://127.0.0.1:5000/api/gpu/7/switch
curl -X POST http://127.0.0.1:5000/api/run

curl http://127.0.0.1:5000/api/process
curl http://127.0.0.1:5000/api/gpus
curl http://127.0.0.1:5000/api/task/list
curl http://127.0.0.1:5000/api/system/info

curl http://127.0.0.1:5000/api/log/flowline.core.program.log?maxLines=1000
```