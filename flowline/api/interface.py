import cmd
import sys
import shutil

from flowline.core import ProgramManager

class CommandLineInterface(cmd.Cmd):
    intro = 'welcome to use task processing system. input help or ? to view help.\n'
    prompt = '> '
    
    def __init__(self, program_manager):
        super().__init__()
        self.program_manager = program_manager
        
    def do_run(self, arg):
        """switch running status: run"""
        is_run = self.program_manager.switch_run()
        print(f"processing loop {'running' if is_run else 'stopped'}")
        
    def do_gpu(self, arg):
        """switch GPU status: gpu <id>"""
        try:
            gpu_id = int(arg.strip())
            if_success, is_on = self.program_manager.switch_gpu(gpu_id)
            if if_success:
                print(f"GPU {gpu_id} switched to {'available' if is_on else 'unavailable'}")
            else:
                print(f"error: invalid GPU ID: {gpu_id}")
        except ValueError:
            print("error: GPU ID must be a number")
            
    def do_killgpu(self, arg):
        """kill all processes on specified GPU: killgpu <id>"""
        try:
            gpu_id = int(arg.strip())
            num = self.program_manager.kill_process_by_gpu(gpu_id)
            print(f"killed {num} processes on GPU {gpu_id}")
        except ValueError:
            print("error: GPU ID must be a number")
            
    def do_kill(self, arg):
        """kill process by specified ID: kill <id>"""
        try:
            process_id = int(arg.strip())
            if_success = self.program_manager.kill_process(process_id)
            if if_success:
                print(f"process {process_id} killed")
            else:
                print(f"error: process ID {process_id} not found")
        except ValueError:
            print("error: process ID must be a number")
            
    def do_ls(self, arg):
        """list all processes: ls"""
        dict = self.program_manager.get_process_dict()
        terminal_width = shutil.get_terminal_size().columns
        print(f"now processes: {len(dict)}, max processes: {self.program_manager.get_max_processes()}")
        if len(dict) == 0:
            print("no running processes")
            return
        print("-" * 130)
        print(f"{'ProcID':<8} {'PID':<8} {'TaskID':<8} {'GPUID':<8} {'Status':<8} {'Cmd':<100}")
        print("-" * 130)
        for k, v in dict.items():
            print(f"{k:<8} {v['pid']:<8} {v['task_id']:<8} {v['gpu_id']:<8} {v['status']:<8} {v['cmd'][:80]}")
            while len(v['cmd']) > 80:
                print(" "*45, end="")
                v['cmd'] = v['cmd'][80:]
                print(v['cmd'][:80])
        print("-" * 130)
        
    def do_gpus(self, arg):
        """list all GPU status: gpus"""
        # self.program_manager.list_gpus()
        dict = self.program_manager.get_gpu_dict()
        terminal_width = shutil.get_terminal_size().columns
        print(f"min process memory: {self.program_manager.get_min_process_memory()} MB")
        print("-" * 100)
        print(f"{'ID':<5} {'Status':<12} {'Util':<10} {'Free/Total(MB)':<18} {'Use/All':<10} {'Temp':<8} {'Power/Max(W)':<20}")
        print("-" * 100)
        for k, v in dict.items():
            util_str = f"{v['utilization']:>3.0f}%"
            memory_str = f"{v['free_memory']:>6.0f}/{v['total_memory']:<6.0f}"
            process_str = f"{v['user_process_num']:>3}/{v['all_process_num']:<3}"
            power_str = f"{v['power']:>6}/{v['max_power']:<6}"
            print(f"{k:<5} {v['status']:<12} {util_str:<10} {memory_str:<18} {process_str:<10} {v['temperature']:<8} {power_str:<20}")
        print("-" * 100)

    def do_min(self, arg):
        """set the min process memory (MB): min <num>"""
        try:
            min_process_memory = int(arg.strip())
            self.program_manager.set_min_process_memory(min_process_memory)
        except ValueError:
            print("error: min process memory must be a number")
        
    def do_exit(self, arg=None):
        """exit the program: exit"""
        print("bye !")
        return True
        
    def do_EOF(self, arg):
        """Ctrl+D exit the program"""
        return self.do_exit(arg)
    
    def do_max(self, arg):
        """set the max processes: max <num>"""
        try:
            max_processes = int(arg.strip())
            self.program_manager.set_max_processes(max_processes)
        except ValueError:
            print("error: max processes must be a number")
            
    def do_task(self, arg):
        """list the task: task"""
        tasks = self.program_manager.get_task_dict()
        max_show_num = 5
        if len(tasks) == 0:
            print("no task")
            return
        print(f"Pending task num: {len(tasks)}")
        print("-" * 100)
        print(f"{'Task_ID':<8} {'Name':<12} {'run_num':<8} {'Dict':<20}")
        print("-" * 100)
        for k, v in enumerate(tasks):
            if k >= max_show_num:
                print(f"...")
                break
            print(f"{v['task_id']:<8} {v['name']:<12} {v['run_num']:<8} {v['dict']:<20}")
        print("-" * 100)

def run_cli(func, task_dir=None):
    """run the command line interface"""
    program = ProgramManager(func, task_dir)
    cli = CommandLineInterface(program)
    try:
        cli.cmdloop()
    except KeyboardInterrupt:
        print("\nreceived interrupt signal, exiting...")
        sys.exit(0)

if __name__ == "__main__":
    pass

"""
    python -m flowline.interface
"""  