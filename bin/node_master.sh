#killall node
kill $(ps ax | grep node-master | awk '{print $1}')
export NODE_PORT=80
screen -S node-master sudo NODE_PORT=80 node app.js
