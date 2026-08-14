import { DatabaseSync, type SQLInputValue, type StatementSync } from "node:sqlite";

interface BoundStatement {
  readonly query: string;
  readonly values: readonly unknown[];
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ success: boolean; meta: { changes: number } }>;
}

function normalizeValues(values: readonly unknown[]): SQLInputValue[] {
  return values.map((value) => value === undefined ? null : value) as SQLInputValue[];
}

function makeBoundStatement(
  database: DatabaseSync,
  query: string,
  values: readonly unknown[] = []
): BoundStatement {
  const statement = (): StatementSync => database.prepare(query);
  const bound = normalizeValues(values);
  return {
    query,
    values: bound,
    async all<T>() {
      return { results: statement().all(...bound) as T[] };
    },
    async first<T>() {
      return (statement().get(...bound) as T | undefined) ?? null;
    },
    async run() {
      const result = statement().run(...bound);
      return { success: true, meta: { changes: Number(result.changes) } };
    }
  };
}

export function memoryD1(schema: string) {
  const database = new DatabaseSync(":memory:");
  database.exec(schema);
  return {
    database,
    binding: {
      prepare(query: string) {
        return {
          bind(...values: unknown[]) {
            return makeBoundStatement(database, query, values);
          },
          ...makeBoundStatement(database, query)
        };
      },
      async batch(statements: BoundStatement[]) {
        database.exec("BEGIN");
        try {
          const results = [];
          for (const statement of statements) results.push(await statement.run());
          database.exec("COMMIT");
          return results;
        } catch (error) {
          database.exec("ROLLBACK");
          throw error;
        }
      }
    },
    close() {
      database.close();
    }
  };
}
