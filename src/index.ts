import { versionBump, versionBumpInfo } from "./version-bump";

// Exprot the external type definitions as named exports
export { ReleaseType } from "./release-type";
export * from "./types/version-bump-options";
export * from "./types/version-bump-results";
export * from "./types/version-bump-progress";

// Export `versionBump` as a named export and the default export
export { versionBump, versionBumpInfo };
export default versionBump;
