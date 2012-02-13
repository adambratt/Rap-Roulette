#killall node
kill $(ps ax | grep node-dev | awk '{print $1}')
export NODE_PORT=3000
screen -S node-dev sudo NODE_PORT=3000 node /rapdev/app.js 
