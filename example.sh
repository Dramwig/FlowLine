# 先进入虚拟环境
conda activate <你的虚拟环境名称>
export PYTHONPATH=/home/me/project/flowline/ # 【可能需要修改】
      # 因为example放在了test目录下，所以需要设置PYTHONPATH
      # 正常情况下，cli/server在项目根目录下，所以不需要设置PYTHONPATH

# 命令行调用示例

python test/example1_cli.py
python test/example2_cli.py

# 集成式服务器
python test/example_server.py # 启动服务器
cd web && python -m http.server 8000 # 在【新的终端】，启动前端静态文件服务器