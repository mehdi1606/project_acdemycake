// Minimal typings for dompurify@3.1 (the package ships no .d.ts in this version).
declare module 'dompurify' {
  interface DOMPurifyConfig {
    ADD_TAGS?: string[];
    ADD_ATTR?: string[];
    FORBID_TAGS?: string[];
    FORBID_ATTR?: string[];
    ALLOWED_URI_REGEXP?: RegExp;
    [key: string]: unknown;
  }
  interface DOMPurifyI {
    sanitize(dirty: string, config?: DOMPurifyConfig): string;
    addHook(entryPoint: string, hook: (node: Element, data?: unknown) => void): void;
  }
  const DOMPurify: DOMPurifyI;
  export default DOMPurify;
}
