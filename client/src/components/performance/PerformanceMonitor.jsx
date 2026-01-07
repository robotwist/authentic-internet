import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { getCacheStats, clearAllCache } from "../../utils/cacheManager";
import { getErrorLog, clearErrorLog } from "../../utils/errorTracker";

/**
 * Performance Monitor Component
 *
 * Tracks and displays performance metrics for the application.
 * Only visible when in development mode or when explicitly enabled.
 */
const PerformanceMonitor = ({
  position = "bottom-right",
  showMetrics = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: null,
    cacheStats: { totalEntries: 0, activeEntries: 0, expiredEntries: 0 },
    errorCount: 0,
    renderTime: 0,
    networkRequests: 0,
  });
  const [expanded, setExpanded] = useState(false);

  // Determine if performance monitor should be visible
  useEffect(() => {
    const isDevMode = process.env.NODE_ENV === "development";
    const isExplicitlyEnabled =
      localStorage.getItem("enablePerfMetrics") === "true";
    setIsVisible(isDevMode || isExplicitlyEnabled || showMetrics);
  }, [showMetrics]);

  // Track FPS using requestAnimationFrame
  useEffect(() => {
    if (!isVisible) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId;

    const countFrames = (time) => {
      frameCount++;

      // Update FPS every second
      if (time - lastTime >= 1000) {
        setMetrics((prev) => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (time - lastTime)),
        }));

        frameCount = 0;
        lastTime = time;
      }

      animationFrameId = requestAnimationFrame(countFrames);
    };

    animationFrameId = requestAnimationFrame(countFrames);

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  // Track memory usage if available
  useEffect(() => {
    if (!isVisible) return;

    // Check if performance.memory is available (Chrome only)
    const hasMemoryInfo =
      typeof performance === "object" && performance.memory !== undefined;

    if (!hasMemoryInfo) return;

    const memoryInterval = setInterval(() => {
      const memoryInfo = performance.memory;

      if (memoryInfo) {
        setMetrics((prev) => ({
          ...prev,
          memory: {
            used: Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024)),
            total: Math.round(memoryInfo.totalJSHeapSize / (1024 * 1024)),
            limit: Math.round(memoryInfo.jsHeapSizeLimit / (1024 * 1024)),
          },
        }));
      }
    }, 2000);

    return () => clearInterval(memoryInterval);
  }, [isVisible]);

  // Track cache statistics and error counts
  useEffect(() => {
    if (!isVisible) return;

    const statsInterval = setInterval(() => {
      // Get cache statistics
      const cacheStats = getCacheStats();

      // Get error log length
      const errorLog = getErrorLog();

      setMetrics((prev) => ({
        ...prev,
        cacheStats,
        errorCount: errorLog.length,
      }));
    }, 5000);

    return () => clearInterval(statsInterval);
  }, [isVisible]);

  // Track network requests
  useEffect(() => {
    if (!isVisible) return;

    // Count of network requests
    let requestCount = 0;

    // Create observer for resource timing
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      requestCount += entries.length;

      setMetrics((prev) => ({
        ...prev,
        networkRequests: requestCount,
      }));
    });

    // Start observing resource timing entries
    observer.observe({ entryTypes: ["resource"] });

    return () => observer.disconnect();
  }, [isVisible]);

  // Don't render anything if not visible
  if (!isVisible) return null;

  // Positioning styles
  const positionStyles = {
    "bottom-right": {
      bottom: "10px",
      right: "10px",
    },
    "bottom-left": {
      bottom: "10px",
      left: "10px",
    },
    "top-right": {
      top: "10px",
      right: "10px",
    },
    "top-left": {
      top: "10px",
      left: "10px",
    },
  };

  return (
    <div
      className="performance-monitor"
      style={{
        position: "fixed",
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "#fff",
        borderRadius: "4px",
        padding: "8px",
        fontSize: "12px",
        fontFamily: "monospace",
        maxWidth: "300px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
        backdropFilter: "blur(4px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        ...positionStyles[position],
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: expanded ? "8px" : "0",
          borderBottom: expanded
            ? "1px solid rgba(255, 255, 255, 0.1)"
            : "none",
          paddingBottom: expanded ? "4px" : "0",
        }}
      >
        <div style={{ fontWeight: "bold", color: "#63f7b4" }}>
          Performance Monitor
        </div>
        <button
          style={{
            background: "none",
            border: "none",
            color: "#63f7b4",
            cursor: "pointer",
            fontSize: "14px",
            padding: "0 4px",
          }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {/* Basic metrics always shown */}
      <div style={{ display: "flex", gap: "10px" }}>
        <div>
          FPS:{" "}
          <span style={{ color: metrics.fps > 30 ? "#63f7b4" : "#f76363" }}>
            {metrics.fps}
          </span>
        </div>
        <div>
          Cache:{" "}
          <span style={{ color: "#63c9f7" }}>
            {metrics.cacheStats.activeEntries}
          </span>
        </div>
        {metrics.errorCount > 0 && (
          <div>
            Errors:{" "}
            <span style={{ color: "#f76363" }}>{metrics.errorCount}</span>
          </div>
        )}
      </div>

      {/* Expanded metrics */}
      {expanded && (
        <div style={{ marginTop: "8px" }}>
          {/* Memory metrics if available */}
          {metrics.memory && (
            <div style={{ marginBottom: "4px" }}>
              Memory: {metrics.memory.used}MB / {metrics.memory.total}MB
              <div
                style={{
                  height: "4px",
                  background: "#333",
                  borderRadius: "2px",
                  marginTop: "2px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(metrics.memory.used / metrics.memory.limit) * 100}%`,
                    background:
                      metrics.memory.used / metrics.memory.limit > 0.8
                        ? "#f76363"
                        : "#63f7b4",
                    borderRadius: "2px",
                  }}
                />
              </div>
            </div>
          )}

          {/* Cache metrics */}
          <div style={{ marginBottom: "4px" }}>
            Cache: {metrics.cacheStats.activeEntries} active /{" "}
            {metrics.cacheStats.totalEntries} total
            {metrics.cacheStats.expiredEntries > 0 && (
              <span style={{ color: "#f7d863" }}>
                {" "}
                ({metrics.cacheStats.expiredEntries} expired)
              </span>
            )}
          </div>

          {/* Network requests */}
          <div style={{ marginBottom: "4px" }}>
            Network Requests: {metrics.networkRequests}
          </div>

          {/* Clear cache button */}
          <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
            <button
              style={{
                background: "rgba(99, 201, 247, 0.2)",
                border: "1px solid rgba(99, 201, 247, 0.5)",
                borderRadius: "4px",
                color: "#63c9f7",
                padding: "2px 6px",
                fontSize: "10px",
                cursor: "pointer",
              }}
              onClick={() => {
                clearAllCache();
                setMetrics((prev) => ({
                  ...prev,
                  cacheStats: {
                    totalEntries: 0,
                    activeEntries: 0,
                    expiredEntries: 0,
                  },
                }));
              }}
            >
              Clear Cache
            </button>

            <button
              style={{
                background: "rgba(247, 99, 99, 0.2)",
                border: "1px solid rgba(247, 99, 99, 0.5)",
                borderRadius: "4px",
                color: "#f76363",
                padding: "2px 6px",
                fontSize: "10px",
                cursor: "pointer",
              }}
              onClick={() => {
                clearErrorLog();
                setMetrics((prev) => ({
                  ...prev,
                  errorCount: 0,
                }));
              }}
            >
              Clear Errors
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

PerformanceMonitor.propTypes = {
  position: PropTypes.oneOf([
    "bottom-right",
    "bottom-left",
    "top-right",
    "top-left",
  ]),
  showMetrics: PropTypes.bool,
};

export default PerformanceMonitor;
