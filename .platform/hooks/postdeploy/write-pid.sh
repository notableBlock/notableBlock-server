#!/bin/bash

mkdir -p /var/pids
echo $(pgrep -f "node") > /var/pids/web.pid
