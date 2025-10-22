# api+web 分离式服务器示例

from flowline import get_app
from flask_cors import CORS

def func(dict, gpu_id, sorted_gpu_ids):
    return "CUDA_VISIBLE_DEVICES="+str(gpu_id)+" python -u test/test.py "+ " ".join([f"--{k}={v}" for k, v in dict.items()])

def main():
    """前后端分离

    仅提供API
        !!!! 前端静态文件需要通过单独的命令提供：
        !!!! cd web && python -m http.server 8000
    """
    # ! 这里需要修改为你的任务配置文件路径
    app = get_app(func, "test/example1_todo.xlsx")
    CORS(app)
    app.run(host='0.0.0.0', port=5000, debug=True)

def main2():
    # TODO: 集成式服务器，同时提供API和前端静态文件 
    pass

if __name__ == '__main__':
    main()  # 分离式服务器
    # main2()   # 集成式服务器