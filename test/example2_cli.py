from flowline.api import run_cli

def func(dict, gpu_id, sorted_gpu_ids):
    # ! 这里需要修改为你的命令
    # 示例： 这里是直接读出命令 mycmd 而不是使用参数，所以直接返回 dict["mycmd"]
    return "CUDA_VISIBLE_DEVICES="+str(gpu_id)+" "+dict["mycmd"]+" --discribe "+'"'+dict["description"]+'"'

if __name__ == "__main__":
    run_cli(func, "trash/todo.csv") 
    
# 如果出现异常进程，可以使用 pkill -9 python 杀死所有进程