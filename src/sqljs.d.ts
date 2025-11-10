// src/sqljs.d.ts
declare module 'sql.js' {
  export interface Database {
    run(sql: string, params?: any[]): void;
    prepare(sql: string): Statement;
    exec(sql: string): any[];
    close(): void;
  }

  export interface Statement {
    bind(params?: any[]): void;
    step(): boolean;
    getAsObject(params?: any[]): any;
    free(): void;
  }

  export interface InitSqlJsOptions {
    locateFile?: (file: string) => string;
  }

  export default function initSqlJs(options?: InitSqlJsOptions): Promise<{
    Database: new (data?: Uint8Array) => Database;
  }>;
}