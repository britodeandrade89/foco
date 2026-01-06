// Removed reference to vite/client to avoid type definition errors
declare namespace NodeJS {
  interface ProcessEnv {
    readonly API_KEY: string;
    readonly NODE_ENV: string;
    [key: string]: string | undefined;
  }
}