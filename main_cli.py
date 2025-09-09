# 命令行调用示例

from flowline import run_cli

def func(dict, gpu_id, sorted_gpu_ids):
    print(sorted_gpu_ids)
    return "CUDA_VISIBLE_DEVICES="+str(gpu_id)+" python -u test/test.py "+ " ".join([f"--{k} {v}" for k, v in dict.items()])

def cmp(info1, info2):
    if info1.free_memory > info2.free_memory:
        return -1
    elif info1.free_memory < info2.free_memory:
        return 1
    else:
        return 0

if __name__ == "__main__":
    # run_cli(func, "test/todo.csv") 
    run_cli(func, "test/todo.csv", user_cmp=cmp) # user_cmp可选
    
# 如果出现异常进程，可以使用 pkill -9 python 杀死所有进程