<!-- v0.1.2 -->

<div align="center">
  <img src="./fig/logo.png" width="50%" alt="FlowLine" />

  <!-- [![LICENSE](https://badgen.net/static/LICENSE/Apache)](LICENSE) -->

  [中文](../readme.md) | English
</div>



FlowLine is an automated system for **GPU resource management** and **concurrent command stream scheduling**, supporting both **Command Line Interface (CLI)** and **Web Graphical User Interface (GUI)** interaction modes. It is suitable for multi-task experiments, deep learning training, or high-concurrency computing environments.

* 📘 **API Documentation**: See [API Docs](./docs/api.md)
* 🧩 **System Design Overview**: See [Design Overview](./docs/design.md)
* 🏗️ **System Architecture Details**: See [Architecture Documentation](./docs/arch.md)

The system was designed to replace the inefficient manual process of monitoring GPU status and executing commands sequentially. In traditional workflows, users need to continuously monitor GPU VRAM availability and usage to manually launch Python scripts or terminate processes, which is particularly cumbersome in multi-task experimental scenarios. This project addresses these issues through automation, improving experimental efficiency and resource utilization.

## Core Features

* Real-time GPU status monitoring: Automatically detects available GPU count, VRAM usage, process information, and selects the most appropriate GPU.
* Command scheduling & resource control: Supports configuring conditions per command (required GPU count, minimum VRAM, max concurrency, etc.).
* Dynamic control mechanisms: Allows manual termination or restarting of processes for flexible task queue management.
* Concurrent multi-task execution: Supports task priority queues, failure retry policies, suitable for batch experiments.
* Dual interaction modes: CLI for scripted control and batch deployment on Linux servers; Web GUI for visual task monitoring, status tracking, and real-time intervention.

## 🚀 Quick Start Guide

### 🖥️ Using Command Line Interface (CLI Mode)

#### 1. Installation

You can directly reference the `flowline` folder by copying it to your project root, or install it into your Python environment:

- Install via pip:
```bash
pip install fline
```

- Or install from source:
```bash
pip install -e <path_to_flowline_repository>
```

> Note: Ensure you have installed basic dependencies from `requirements.txt` (`pandas`, `psutil`, `openpyxl`, etc.).

#### 2. Create Task Control Sheet

The system uses a list file (`.xlsx`、 `.csv` or `.json` format) to define task parameters. **This is the only input method for all tasks.** Each row represents an independent task, and each column corresponds to a parameter that will be automatically mapped to `--key value` CLI format.

<details>
<summary>Example and Explanation</summary>

Example files: [`test/example1_todo.xlsx`](./test/example1_todo.xlsx), [`test/example1_todo.csv`](./test/example1_todo.csv),[`test/example1_todo.json`](./test/example1_todo.json), which can be constructed using the example program [`test/task_builder.py`](./test/task_builder.py).

| *name*    | lr    | batch_size | *run_num* | *need_run_num* | *cmd*       |
| --------- | ----- | ---------- | --------- | -------------- | ----------- |
| baseline1 | 0.01  | 64         | 0         | 1              | train_main  |
| baseline2 | 0.001 | 128        | 0         | 2              | train_alt   |

Field descriptions:
* `run_num`: Current execution count (automatically maintained by system, default=0).
* `need_run_num`: Total desired executions (system controls repeats based on this, default=1).
* `name`: Task identifier. Auto-generated as `Task:{row_number}` if unspecified.
* `cmd`: Reserved field (can be empty or specify main command like `train_main`). Can be used with custom `func` logic.
* Other fields can be freely defined and will be passed to the command constructor.

> Note: If reserved fields are missing, **the system will auto-complete them during loading** to ensure valid structure.

The flexible task sheet structure supports everything from parameter tuning to complex grid search automation.

</details>

#### 3. Define Task Constructor `func(dict, gpu_id)`

You need to define a custom function that constructs the final command string using the task parameters `dict` (from Excel row) and allocated `gpu_id`.

<details>
<summary>Example and Explanation</summary>

Example:
```python
from flowline import run_cli

if __name__ == "__main__":
    def func(param_dict, gpu_id):
        cmd = "CUDA_VISIBLE_DEVICES=" + str(gpu_id) + " python -u test/test.py "
        args = " ".join([f"--{k} {v}" for k, v in param_dict.items()])
        return cmd + args

    run_cli(func, "test/example1_todo.xlsx")
```

* `param_dict`: Dictionary built from current Excel row (keys=column names, values=cell content)
* `gpu_id`: Dynamically allocated GPU ID (ensures no conflicts)
* Returned command string executes as a subprocess (equivalent to direct CLI execution)
* Can be adapted for shell scripts, conda environments, or main command variants

<details>
<summary>About Output and python -u</summary>

💡 **About `python -u`:**
Using `-u` flag (`python -u ...`) enables **unbuffered mode**:
* `stdout`/`stderr` flush immediately
* Essential for real-time log viewing (especially when output is redirected)
* FlowLine saves each task's output to `log/` directory:

```
log/
├── 0.out    # stdout for task 0
├── 0.err    # stderr for task 0
├── 1.out
├── 1.err
...
```

Always use `-u` to ensure **real-time log writing** to these files.
</details>
</details>

#### 4. Enter `run` to start the task flow

<details>
<summary>FlowLine CLI Command Reference Table</summary>

| Command        | Parameter                 | Description                                                                                                |
| -------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `run`          | None                      | Toggles the task processing loop state (start/stop)                                                        |
| `gpu <id>`     | `<id>`: GPU ID            | Toggles the availability of the specified GPU (available/unavailable)                                      |
| `killgpu <id>` | `<id>`: GPU ID            | Terminates all processes running on the specified GPU                                                      |
| `kill <id>`    | `<id>`: Process ID        | Terminates the process with the specified process ID                                                       |
| `ls`           | None                      | Lists all running processes, showing process ID, PID, task ID, GPU ID, status, and command                 |
| `gpus`         | None                      | Displays the status of all GPUs, including utilization, memory usage, temperature, power consumption, etc. |
| `min <num>`    | `<num>`: Memory size (MB) | Sets the minimum required memory for processes                                                             |
| `max <num>`    | `<num>`: Process count    | Sets the maximum number of concurrent processes                                                            |
| `task`         | None                      | Lists the pending task queue, showing task ID, name, run count, etc.                                       |
| `exit`         | None                      | Exits the program (equivalent to `Ctrl+D`)                                                                 |
| `help` or `?`  | None                      | Displays help information                                                                                  |

<details>
<summary>Command Usage Examples</summary>

```bash
# Start the task processing loop
> run

# Check GPU status
> gpus

# View running processes
> ls

# Set the maximum number of concurrent processes to 4
> max 4

# Set the minimum memory requirement to 2048 MB
> min 2048

# Disable GPU 1
> gpu 1

# Terminate all processes on GPU 0
> killgpu 0

# View pending tasks
> task

# Exit the program
> exit
```

</details>
</details>


### 🌐 Using Web Interface (Visual Task Management)

> **No extra configuration needed - Works directly in SSH environments**

Besides CLI, you can use the Web GUI for **real-time monitoring and dynamic intervention**.

#### 1. Start Backend API Service
Run the Flask backend:
```bash
python test/example_server.py
```

#### 2. Start Frontend Service
Launch static file server:
```bash
cd web
python -m http.server 8000
```

Access the frontend at [http://localhost:8000](http://localhost:8000/). The interface communicates with backend via RESTful APIs.

<div align=center>
  <img src="./docs/fig/gpu.png" alt="GPU Monitoring" height="200px" />
  <img src="./docs/fig/task.png" alt="Task Management" height="200px" />
  <img src="./docs/fig/log.png" alt="Log Viewer" height="200px" />
  <img src="./docs/fig/set.png" alt="Settings" height="200px" />
</div>

## 🛑 Disclaimer

This project provides **automated detection and utilization of idle GPUs** for resource-constrained environments (e.g., labs), enabling rapid task initiation without manual polling.

### 📌 Important Notes
- This tool **does NOT forcibly terminate others' tasks** or bypass permission/scheduling systems.
- Default operation is **limited to devices where user has access permissions**. Comply with institutional policies.
- **DO NOT misuse to monopolize shared resources or disrupt others' research.**

### 🚨 Risk Statement

Potential risks include but not limited to:
- Resource conflicts from concurrent scheduling
- Violation of lab/platform policies if abused

Developers **shall not be liable** for any direct/indirect losses including resource conflicts, account restrictions, or data loss resulting from script usage.


## 💐 Contributions

We welcome everyone to contribute code, fix bugs, or improve the documentation for this template!

- If you have any suggestions or questions, please submit an issue.
- Pull requests are welcome.
  
> [!TIP]
> If this project is helpful to you, please give it a **Star**!

**Thanks to all contributors!**

[![Contributors](https://contrib.rocks/image?repo=dramwig/FlowLine)](https://github.com/dramwig/FlowLine/graphs/contributors)

<a href="https://www.star-history.com/#dramwig/FlowLine&Date">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=dramwig/FlowLine&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=dramwig/FlowLine&type=Date" />
   
<img alt="Star History Chart" src="https://api.star-history.com/svg?repos=dramwig/FlowLine&type=Date" />
 </picture>
</a>