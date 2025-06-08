/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_OPENAI_API_KEY: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
} 