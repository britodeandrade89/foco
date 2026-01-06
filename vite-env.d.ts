/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly API_KEY: string;
    readonly NODE_ENV: string;
    [key: string]: string | undefined;
  }
}
