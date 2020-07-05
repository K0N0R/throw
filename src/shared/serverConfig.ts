const ENV = process.argv.find((arg) => arg.includes('dist')) ? 'production' : 'development';
export const host = (ENV === 'production' ? '51.83.128.137' : '192.168.100.70'); // localhost // work 10.1.0.78
export const port = 8080;
