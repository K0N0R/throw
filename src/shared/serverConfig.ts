import dotenv from 'dotenv';
import path from 'path'

const result = dotenv.config();
console.log(path.resolve(process.cwd(), '.env'));
export const HOST = process.env.HOST ?? 'localhost'; // localhost // work 10.1.0.78
export const PORT = process.env.PORT ?? 7070;
