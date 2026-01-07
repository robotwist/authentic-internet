import { BUILD_INFO } from "../buildInfo";

/**
 * Utility to verify if the current deployment is up-to-date with GitHub
 */
class DeploymentVerifier {
  constructor() {
    this.isVerifying = false;
    this.lastCheck = null;
    this.lastResult = null;
  }

  /**
   * Check if the current build matches the latest GitHub commit
   * @returns {Promise<{isLatest: boolean, currentCommit: string, latestCommit: string, age: number}>}
   */
  async verifyDeployment(repoOwner, repoName, branch = "main") {
    if (this.isVerifying) {
      console.log("Deployment verification already in progress");
      return this.lastResult;
    }

    this.isVerifying = true;
    console.log("Checking if deployment is current with GitHub...");

    try {
      // Get the latest commit from GitHub
      const response = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/commits/${branch}`,
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      const latestCommit = data.sha;
      const currentCommit = BUILD_INFO.commitHash;

      // If we're in development mode, we'll always show as latest
      if (BUILD_INFO.environment === "development") {
        console.log("Development mode - skipping verification");
        this.lastResult = {
          isLatest: true,
          currentCommit,
          latestCommit,
          age: 0,
          message: "Development build - verification skipped",
        };
        return this.lastResult;
      }

      // Check if commits match
      const isLatest = currentCommit === latestCommit;

      // Calculate age in minutes
      const commitDate = new Date(data.commit.committer.date);
      const buildDate = new Date(BUILD_INFO.buildDate);
      const ageInMs = buildDate - commitDate;
      const ageInMinutes = Math.floor(ageInMs / (1000 * 60));

      this.lastCheck = new Date();
      this.lastResult = {
        isLatest,
        currentCommit,
        latestCommit,
        age: ageInMinutes,
        message: isLatest
          ? `✅ Deployment is up-to-date with GitHub (${ageInMinutes} minutes old)`
          : `⚠️ Deployment is not current with latest commit`,
        commitMessage: data.commit.message,
      };

      console.log(this.lastResult.message);
      return this.lastResult;
    } catch (error) {
      console.error("Error verifying deployment:", error);
      this.lastResult = {
        isLatest: false,
        error: error.message,
        message: `Failed to check deployment status: ${error.message}`,
      };
      return this.lastResult;
    } finally {
      this.isVerifying = false;
    }
  }
}

export default new DeploymentVerifier();
