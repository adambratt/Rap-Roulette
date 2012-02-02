kill $(ps ax | grep node-demo | awk '{print $1}')
export NODE_PORT=4000
screen -S node-demo sudo NODE_PORT=4000 node app.js
