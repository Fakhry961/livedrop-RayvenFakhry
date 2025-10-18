// Allow importing local runtime .js wrapper modules from TypeScript files
// e.g. import router from './routes/analytics.js'
declare module '*.js' {
  const value: any;
  export default value;
}
