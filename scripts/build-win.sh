#!/bin/bash
# Fully detached build script. Writes progress + exit code to /tmp/build-status.txt
cd /home/z/my-project
rm -rf release
echo "STARTED $(date)" > /tmp/build-status.txt
bunx electron-builder --win portable >> /tmp/wbuild-detached.log 2>&1
CODE=$?
echo "EXIT_CODE:$CODE $(date)" >> /tmp/build-status.txt
ls -la release/*.exe >> /tmp/build-status.txt 2>&1
