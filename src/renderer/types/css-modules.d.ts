/**
 * @fileoverview CSS Module type declarations
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Allows TypeScript to import .module.css files without type errors.
 */

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
