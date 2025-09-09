import threading
import time
import atexit
import signal
import sys
import os

from .gpu import GPU_Manager
from .process import ProcessManager, ProcessStatus
from .task import TaskManager
from flowline.config import config
from flowline.utils import Log

logger = Log(__name__)

class ProgramManager:
    def __init__(self, user_func, task_dir, user_cmp=None):
        self._lock = threading.Lock()
        self.gpu_manager = GPU_Manager([0], self.on_gpu_flash, user_cmp)
        self.process_manager = ProcessManager(self.on_process_changed)
        self.task_manager = TaskManager(task_dir)
        
        self.if_run = False
        self._main_thread = None 
        self.func = user_func
        self.loop_sleep_time = config.DEFAULT_LOOP_SLEEP_TIME
        
    ##################### lock #####################
        
    def synchronized(func):
        def wrapper(self, *args, **kwargs):
            with self._lock:
                return func(self, *args, **kwargs)
        return wrapper
    
    ##################### callback #####################
    
    def on_process_changed(self, task_id, process_id, gpu_id, pid, status):
        # logger.info(f"ProgramManager: process {process_id} status changed: {status}")
        self.gpu_manager.update_user_process_num(gpu_id, pid, status)
        if status == ProcessStatus.COMPLETED:
            self.task_manager.update_task_ids(task_id)
        elif status in [ProcessStatus.FAILED, ProcessStatus.KILLED]:
            self.task_manager.put_task_ids(task_id)
        elif status == ProcessStatus.RUNNING:
            pass
        else:
            logger.warning(f"Unknown process status: {status}")
            
    def on_gpu_flash(self, gpu_id, info):
        # logger.info(f"ProgramManager: GPU {gpu_id} status changed: {info}")
        pass
            
    ##################### main loop #####################
            
    @synchronized
    def new_process(self):
        """create new process to handle task"""
        if not self.process_manager.have_space():
            logger.info(f"over max processes")
            return
        gpu_id, sorted_gpu_ids = self.gpu_manager.choose_gpu()
        if gpu_id is None:
            logger.info(f"no available GPU")
            return
        task_id, dict = self.task_manager.get_next_task()
        if task_id is None:
            logger.info("no task to handle")
            return
        cmd = self.func(dict, gpu_id, sorted_gpu_ids)
        process = self.process_manager.add_process(cmd, task_id, gpu_id)
        if process is None:
            self.task_manager.put_task_ids(task_id)
            logger.info(f"failed to create process, task {task_id} put back to queue")
        
    def run_loop(self):
        """main loop, check and create new task"""
        while self.if_run:
            self.new_process()
            time.sleep(self.loop_sleep_time)
        logger.info("main loop stopped")
        
    ##################### operation #####################
            
    def start_process_loop(self):
        """start main loop as a daemon thread"""
        if self._main_thread and self._main_thread.is_alive():
            logger.warning("main loop already running")
            return
            
        self.if_run = True
        self._main_thread = threading.Thread(target=self.run_loop)
        self._main_thread.daemon = True  
        self._main_thread.start()
            
    def switch_run(self):
        """switch running status"""        
        self.if_run = not self.if_run
        if self.if_run:
            self.start_process_loop()
        logger.info(f"main loop {'started' if self.if_run else 'stopped'}")
        return self.if_run
        
    def switch_gpu(self, gpu_id):
        """switch GPU available status"""
        if_success, is_on = self.gpu_manager.switch_gpu(gpu_id)
        return if_success, is_on
        
    @synchronized
    def kill_process_by_gpu(self, gpu_id):
        """kill all processes on specified GPU"""
        num = self.process_manager.kill_process_by_gpu(gpu_id)
        return num
        
    @synchronized
    def kill_process(self, process_id):
        """kill process by specified ID"""
        return self.process_manager.kill_process_by_id(process_id)
    
    def set_max_processes(self, max_processes: int):
        self.process_manager.set_max_processes(max_processes)
        
    def get_max_processes(self):
        return self.process_manager.get_max_processes()
        
    def get_process_dict(self):
        return self.process_manager.get_process_dict()
    
    def get_process_dict_by_gpu(self, gpu_id: int):
        return self.process_manager.get_process_dict_by_gpu(gpu_id)
        
    def set_min_process_memory(self, min_process_memory):
        self.gpu_manager.set_min_process_memory(min_process_memory)
    
    def get_min_process_memory(self):
        return self.gpu_manager.get_min_process_memory()

    def get_gpu_dict(self):
        return self.gpu_manager.get_gpu_dict()
    
    def get_task_dict(self):
        return self.task_manager.get_task_dict()

    def create_task(self, task_dict):
        return self.task_manager.create_task(task_dict)

if __name__ == "__main__":
    def func(dict, gpu_id):
        import torch
        tensor = torch.randn(1000, 1000).to("cuda:"+str(gpu_id))
        print(tensor, dict)
        i = 0
        while True:
            print(i)
            i += 1
            time.sleep(1)
            
    program = ProgramManager(func)
    program.new_process()
    program.new_process()
    time.sleep(5)
    
    program.kill_process(0)
    time.sleep(5)
    
    while True:
        time.sleep(1)
    

    # python -m flowline.program