"""Compile and run the actual portable C++ core; no behavioral reimplementation."""
import argparse
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

parser = argparse.ArgumentParser()
parser.add_argument("--compiler", default=shutil.which("g++") or shutil.which("clang++"))
args = parser.parse_args()
if not args.compiler:
    parser.error("Install g++/clang++ or supply --compiler; tests were NOT executed")
root = Path(__file__).resolve().parents[1]
environment = dict(os.environ)
environment["PATH"] = str(Path(args.compiler).resolve().parent) + os.pathsep + environment.get("PATH", "")
with tempfile.TemporaryDirectory(prefix="rewinder-core-") as directory:
    executable = Path(directory) / "core_test.exe"
    subprocess.run([args.compiler, "-std=c++11", "-Wall", "-Wextra", "-Werror", "-pedantic",
                    "-I", str(root / "lib/RewinderCore"), str(root / "test/core_test.cpp"),
                    "-o", str(executable)], check=True, env=environment)
    subprocess.run([str(executable)], check=True, env=environment)
