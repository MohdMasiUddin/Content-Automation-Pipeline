#!/usr/bin/env python3
import os
import sys
import subprocess
import shutil
import time
import socket
import signal

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def kill_port(port):
    if not is_port_in_use(port):
        print(f"Port {port} is free.")
        return True

    print(f"Port {port} is in use. Attempting to kill process occupying it...")
    try:
        if sys.platform == "win32":
            # Windows command to find and kill port
            output = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True).decode()
            pids = set()
            for line in output.strip().split("\n"):
                parts = line.strip().split()
                if len(parts) >= 5:
                    pids.add(parts[-1])
            for pid in pids:
                print(f"Killing PID {pid} on Windows...")
                subprocess.run(f"taskkill /F /PID {pid}", shell=True)
        else:
            # macOS / Linux command to find and kill port
            output = subprocess.check_output(f"lsof -t -i:{port}", shell=True).decode()
            pids = [line.strip() for line in output.strip().split("\n") if line.strip()]
            for pid in pids:
                print(f"Killing PID {pid} on macOS/Linux...")
                subprocess.run(f"kill -9 {pid}", shell=True)
        
        # Wait a moment to ensure port release
        time.sleep(1.5)
        if not is_port_in_use(port):
            print(f"Port {port} has been successfully freed.")
            return True
        else:
            print(f"Failed to free port {port}.")
            return False
    except Exception as e:
        print(f"Error trying to free port {port}: {e}")
        return False

def setup_backend():
    print("--- Setting up Python Virtual Environment & Backend ---")
    root_dir = os.path.dirname(os.path.abspath(__file__))
    venv_dir = os.path.join(root_dir, "venv")
    
    python_cmd = sys.executable
    
    if not os.path.exists(venv_dir):
        print("Creating virtual environment...")
        subprocess.run([python_cmd, "-m", "venv", "venv"], check=True)
        print("Virtual environment created.")
    else:
        print("Virtual environment already exists.")

    # Determine paths inside virtual env
    if sys.platform == "win32":
        venv_python = os.path.join(venv_dir, "Scripts", "python.exe")
        venv_pip = os.path.join(venv_dir, "Scripts", "pip.exe")
    else:
        venv_python = os.path.join(venv_dir, "bin", "python")
        venv_pip = os.path.join(venv_dir, "bin", "pip")

    # Install packages
    req_file = os.path.join(root_dir, "backend", "requirements.txt")
    if os.path.exists(req_file):
        print("Installing backend dependencies...")
        subprocess.run([venv_pip, "install", "-r", req_file], check=True)
    else:
        print("backend/requirements.txt not found! Skipping python package installations.")

    return venv_python

def setup_frontend():
    print("--- Setting up Frontend Dependencies ---")
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")
    
    npm_cmd = shutil.which("npm")
    if not npm_cmd:
        print("Error: 'npm' is not installed or not in system PATH. Cannot run frontend.")
        sys.exit(1)

    node_modules_dir = os.path.join(frontend_dir, "node_modules")
    if not os.path.exists(node_modules_dir):
        print("Installing frontend npm packages...")
        subprocess.run([npm_cmd, "install"], cwd=frontend_dir, check=True)
    else:
        print("Frontend npm packages already installed.")

    return npm_cmd

def main():
    print(f"Platform Identified: {sys.platform}")
    
    # Free ports if they are in use
    kill_port(8000)  # Backend API Port
    kill_port(5173)  # Frontend Dev Port

    # Setup
    venv_python = setup_backend()
    npm_cmd = setup_frontend()

    print("--- Starting Application Servers ---")
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")

    # Start Backend
    backend_proc = subprocess.Popen(
        [venv_python, "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=root_dir
    )
    print("Backend server launched at http://localhost:8000")

    # Start Frontend (forces port 5173)
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev", "--", "--port", "5173"],
        cwd=frontend_dir
    )
    print("Frontend server launched at http://localhost:5173")

    try:
        while True:
            if backend_proc.poll() is not None:
                print("Backend server stopped unexpectedly.")
                break
            if frontend_proc.poll() is not None:
                print("Frontend server stopped unexpectedly.")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down servers...")
    finally:
        # Gracefully stop servers
        for proc in [backend_proc, frontend_proc]:
            try:
                if proc.poll() is None:
                    if sys.platform == "win32":
                        proc.terminate()
                    else:
                        proc.send_signal(signal.SIGINT)
            except Exception:
                pass
        
        # Fallback force termination if they don't stop
        time.sleep(1.5)
        for proc in [backend_proc, frontend_proc]:
            try:
                if proc.poll() is None:
                    proc.kill()
            except Exception:
                pass

        print("All servers closed down successfully.")

if __name__ == "__main__":
    main()
