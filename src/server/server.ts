import express from 'express';
import http from 'http';
import path from 'path';
import socketIo from 'socket.io';

const app = express();
const httpServer = http.createServer(app);
const io = socketIo(httpServer);

const PORT = 3000;
const HOST = 'localhost';
const ENV = process.argv.find((arg) => arg.includes('dist')) ? 'production' : 'development';
const BASE_PATH = (ENV === 'production' ? __dirname + '/../' : __dirname + '/../../dist');


app.get('/', (_req: any, res: any) => {
    res.sendFile(path.resolve(BASE_PATH + '/client/index.html'));
});

app.use(express.static(path.resolve(BASE_PATH + '/client')));

httpServer.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);

io.on('connection', function(socket){
  console.log('a user connected');
  socket.emit('connected', 'you motherfucker!');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});