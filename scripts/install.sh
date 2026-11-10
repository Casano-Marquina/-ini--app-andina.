#!/bin/bash
sudo chown -R ubuntu:ubuntu /home/ubuntu/app
cd /home/ubuntu/app
pkill -f "node app.js" || true
nohup node app.js > app.log 2>&1 < /dev/null &
