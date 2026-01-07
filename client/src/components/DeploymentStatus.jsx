import React from "react";
import PropTypes from "prop-types";
import { BUILD_INFO } from "../buildInfo";

/**
 * Component to display deployment status information
 */
const DeploymentStatus = ({ status, style = {} }) => {
  if (!status) return null;

  const containerStyle = {
    padding: "10px 15px",
    borderRadius: "5px",
    margin: "10px 0",
    fontSize: "14px",
    backgroundColor: status.isLatest ? "#e6f7e6" : "#fff3e0",
    border: `1px solid ${status.isLatest ? "#c8e6c9" : "#ffe0b2"}`,
    color: status.isLatest ? "#2e7d32" : "#e65100",
    display: "flex",
    flexDirection: "column",
    ...style,
  };

  return (
    <div style={containerStyle}>
      <div style={{ fontWeight: "bold" }}>
        {status.isLatest
          ? "✅ Deployment is up-to-date"
          : "⚠️ Deployment may be outdated"}
      </div>

      <div style={{ marginTop: "5px", fontSize: "12px", color: "#666" }}>
        <div>
          Current commit: {status.currentCommit?.substring(0, 7) || "Unknown"}
        </div>
        {status.latestCommit && (
          <div>Latest commit: {status.latestCommit.substring(0, 7)}</div>
        )}
        {status.age !== undefined && <div>Age: {status.age} minutes</div>}
        {status.commitMessage && (
          <div style={{ marginTop: "5px" }}>
            <strong>Latest commit message:</strong> {status.commitMessage}
          </div>
        )}
        <div style={{ marginTop: "5px" }}>
          <strong>Build environment:</strong> {BUILD_INFO.environment}
        </div>
      </div>
    </div>
  );
};

DeploymentStatus.propTypes = {
  status: PropTypes.shape({
    isLatest: PropTypes.bool,
    currentCommit: PropTypes.string,
    latestCommit: PropTypes.string,
    age: PropTypes.number,
    commitMessage: PropTypes.string,
    error: PropTypes.string,
  }),
  style: PropTypes.object,
};

export default DeploymentStatus;
