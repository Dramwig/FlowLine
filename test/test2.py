import time
import sys

if __name__ == "__main__":
    # sys.argv 会包含运行脚本时输入的所有参数（包括脚本名）
    all_args = " ".join(sys.argv)

    while True:
        print(time.time(), all_args)
        time.sleep(1)
