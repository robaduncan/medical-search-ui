/// <reference types="vite/client" />
/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

declare global {
  var global: typeof globalThis;
}

interface ImportMetaEnv {
  readonly VITE_FHIR_BASE_URL: string;
  readonly VITE_OFFLINE_MODE: string;
  readonly VITE_DEBOUNCE_DELAY: string;
  readonly VITE_DEFAULT_COUNT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 