import express from 'express';
import path from 'path';

const app = express();
const PORT = 3000;
const HOST = 'localhost';
const ENV = process.argv.find((arg) => arg.includes('dist')) ? 'production' : 'development';
const BASE_PATH = (ENV === 'production' ? __dirname + '/../../' : __dirname + '/../../dist');

app.get('/', (_req: any, res: any) => {
    res.sendFile(path.resolve(BASE_PATH + '/client/index.html'));
});

app.use(express.static(path.resolve(BASE_PATH + '/client')));

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);