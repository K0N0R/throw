const ENV = process.argv.find((arg) => arg.includes('dist')) ? 'production' : 'development';
export const host = (ENV === 'production' ? '51.83.128.137' : 'localhost');
export const port = 8080;
export const interval = 1000/60;
