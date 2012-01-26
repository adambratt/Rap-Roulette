#killall node
kill $(ps ax | grep node-demo | awk '{print $1}')
export NODE_PORT=80
screen -S node-demo sudo NODE_PORT=80 node app.js
