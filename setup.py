from setuptools import setup, find_packages
import os

base_version = "0.1.3"
build_timestamp = os.getenv('BUILD_TIMESTAMP', None)

if build_timestamp:
    version = f"{base_version}.{build_timestamp}"
else:
    version = base_version

with open("docs/readme_en.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="fline",
    version=version,
    author="Dramwig",
    author_email="dramwig@gmail.com",
    description="Automated tool for running Python programs in a streamlined manner",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/Dramwig/FlowLine",
    packages=find_packages(),
    package_dir={"": "."},
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: Apache Software License",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.6',
    license="Apache Software License",
    license_files=["LICENSE"],
    install_requires=[
        "Flask==2.0.1",
        "Flask_Cors==3.0.10",
        "Flask_SocketIO==5.5.1",
        "nvidia_ml_py==12.560.30",
        "pandas==2.3.1",
        "psutil==5.9.0",
        "pynvml==11.0.0",
        "tqdm==4.66.5",
        "werkzeug==2.3",
        "openpyxl"
    ],
    keywords=["flowline", "fline", "machine-learning", "automation", "flash", "gpu", "gpu-monitoring", "experiment-management"],
)