import { lazy, type ComponentType, type LazyExoticComponent } from "react";

type LazyModule<T extends ComponentType<unknown>> = { default: T };

const CHUNK_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk .+ failed/i;

function isChunkLoadError(error: unknown): boolean {
  if (error instanceof TypeError && CHUNK_ERROR_PATTERN.test(error.message)) {
    return true;
  }
  if (error instanceof Error && CHUNK_ERROR_PATTERN.test(error.message)) {
    return true;
  }
  return false;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<LazyModule<T>>,
  retries = 2,
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await factory();
      } catch (error) {
        lastError = error;
        if (!isChunkLoadError(error) || attempt === retries) {
          throw error;
        }
        await wait(300 * (attempt + 1));
      }
    }

    throw lastError;
  });
}
