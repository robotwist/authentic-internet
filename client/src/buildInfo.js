// This file contains build information for tracking deployments
// The values are populated during the build process

export const BUILD_INFO = {
  version: process.env.npm_package_version || "0.0.0",
  commitHash: import.meta.env.VITE_COMMIT_HASH || "development",
  buildDate: import.meta.env.VITE_BUILD_DATE || new Date().toISOString(),
  environment: import.meta.env.MODE || "development",
};

export const logBuildInfo = () => {
  console.info(
    `%cApplication Build Info:
  🔹 Version: ${BUILD_INFO.version}
  🔹 Commit: ${BUILD_INFO.commitHash}
  🔹 Built: ${BUILD_INFO.buildDate}
  🔹 Environment: ${BUILD_INFO.environment}`,
    "color: #6366F1; font-weight: bold;",
  );
};

export default BUILD_INFO;
