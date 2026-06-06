#!/usr/bin/env bash

# Verify python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required to run the setup script."
    exit 1
fi

# Run the python setup and process runner script
python3 "$(dirname "$0")/start.py"
