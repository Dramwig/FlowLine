# 命令行调用示例
from flowline import run_cli

def func(dict, gpu_id, sorted_gpu_ids):
    # ! 这里需要修改为你的命令
    # 示例： 这里通过字典 dict 读出参数，所以需要使用 " ".join([f"--{k} {v}" for k, v in dict.items()]) 将参数拼接起来
    # 对于直接执行完整命令的需求，见 example2_cli.py
    return "CUDA_VISIBLE_DEVICES="+str(gpu_id)+" python -u test/test.py "+ " ".join([f"--{k} {v}" for k, v in dict.items()])

def cmp(info1, info2):
    if info1.free_memory > info2.free_memory:
        return -1
    elif info1.free_memory < info2.free_memory:
        return 1
    else:
        return 0

if __name__ == "__main__":
    # ! 这里需要修改为你的任务配置文件路径
    run_cli(func, "test/example1_todo.csv", user_cmp=cmp) 
    # user_cmp 可选 e.g. run_cli(func, "test/example1_todo.xlsx") 
    
# 如果出现异常进程，可以使用 pkill -9 python 杀死所有进程