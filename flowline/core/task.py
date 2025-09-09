import pandas as pd
import threading
import queue

from flowline.utils import Log

logger = Log(__name__)


class TaskStatus:
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"

class Task:
    def __init__(self, task_id, dict, run_num, need_run_num, name, cmd):
        self.task_id = task_id
        self.dict = dict
        self.run_num = run_num
        self.need_run_num = need_run_num
        self.name = name
        self.cmd = cmd
        self.state = TaskStatus.PENDING if self.run_num < self.need_run_num else TaskStatus.COMPLETED

    def __str__(self) -> str:
        return f"Task:{self.task_id}"
    
    def get_dict(self) -> dict:
        return {
            "task_id": self.task_id,
            "dict": str(self.dict),
            "run_num": self.run_num,
            "need_run_num": self.need_run_num,
            "name": self.name,
            "cmd": self.cmd,
            "status": self.state,
        }

class TaskManager:
    """
    excel的保留关键字(属性): run_num, need_run_num, name, cmd
    """
    def __init__(self, task_dir):
        self._lock = threading.Lock()
        self.task_dir = task_dir
        logger.info(f"read excel: {task_dir}")
        self._read_df()
        self.format_tidy_df()
        self._save_df()

        self.tasks = []
        self.task_ids = queue.PriorityQueue()
        for idx, row in self.df.iloc[:].iterrows():
            config_dict = row.drop(['run_num', 'need_run_num', 'name', 'cmd']).to_dict()
            self.tasks.append(Task(idx, config_dict, row['run_num'], row['need_run_num'], row['name'], row['cmd']))
            for _ in range(row['need_run_num']-row['run_num']):
                self.task_ids.put(idx)

    def format_tidy_df(self):
        if 'run_num' not in self.df.columns:
            self.df['run_num'] = 0
        if 'need_run_num' not in self.df.columns:
            self.df['need_run_num'] = 1
        if 'name' not in self.df.columns:
            self.df['name'] = ['Task:' + str(i) for i in self.df.index]
        if 'cmd' not in self.df.columns:
            self.df['cmd'] = 'No command'

    def synchronized(func):
        def wrapper(self, *args, **kwargs):
            with self._lock:
                return func(self, *args, **kwargs)
        return wrapper
    
    def _read_df(self):
        if self.task_dir.endswith(".xlsx"):
            self.df = pd.read_excel(self.task_dir)
        elif self.task_dir.endswith(".csv"):
            self.df = pd.read_csv(self.task_dir)
        elif self.task_dir.endswith(".json"):
            self.df = pd.read_json(self.task_dir)
        else:
            raise ValueError("Invalid file extension. Please use .xlsx, .csv, or .json.")
    
    def _save_df(self):
        if self.task_dir.endswith(".xlsx"):
            self.df.to_excel(self.task_dir, index=False)
        elif self.task_dir.endswith(".csv"):
            self.df.to_csv(self.task_dir, index=False)
        elif self.task_dir.endswith(".json"):
            self.df.to_json(self.task_dir, orient="records", force_ascii=False, indent=4)
        else:
            raise ValueError("Invalid file extension. Please use .xlsx, .csv, or .json.")
    
    # -------------------------------
    
    def get_task_dict(self):
        list = []
        for task in self.tasks:
            if task.run_num == 0:
                list.append(task.get_dict())
        return list
    
    @synchronized
    def get_next_task(self) -> tuple[int, dict]:
        if self.task_ids.empty():
            return None, None
        id = self.task_ids.get()
        dict = self.tasks[id].dict
        logger.info(f"get task {id} config: {dict}")
        return id, dict
    
    @synchronized
    def put_task_ids(self, id):
        self.task_ids.put(id)
        logger.info(f"put task {id} back to queue")
        
    @synchronized
    def update_task_ids(self, id):
        self.tasks[id].run_num += 1
        self.df.loc[id, 'run_num'] += 1
        self._save_df()
        logger.info(f"update task {id} run times: {self.df.loc[id, 'run_num']}")

    @synchronized
    def create_task(self, name, cmd):
        return True

# task_manager = TaskManager()

if __name__ == "__main__":
    pass
    # print(2)
    # task = TaskManager()
    # print(task.get_next_task())
    # print(task.get_next_task())
    # task.update_task_ids(0)
    # print(todo.get_next_todo())
    
    """
    python -m flowline.todo
    """
