import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getPowerDefinition,
  POWER_CATEGORIES,
  getPowersByCategory,
} from "../constants/Powers";
import { activatePower, deactivatePower } from "../api/api";
import "./PowerManagement.css";

const PowerManagement = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState({});
  const [error, setError] = useState("");

  const unlockedPowers = user?.unlockedPowers || [];
  const activePowers = user?.activePowers || [];
  const maxActivePowers = user?.maxActivePowers || 3;

  const handleTogglePower = async (powerId, currentlyActive) => {
    try {
      setLoading((prev) => ({ ...prev, [powerId]: true }));
      setError("");

      const response = currentlyActive
        ? await deactivatePower(powerId)
        : await activatePower(powerId);

      if (response.success) {
        // Update user context
        const updatedUser = { ...user };
        if (currentlyActive) {
          updatedUser.activePowers = updatedUser.activePowers.filter(
            (id) => id !== powerId,
          );
          updatedUser.unlockedPowers = updatedUser.unlockedPowers.map((p) =>
            p.id === powerId ? { ...p, active: false } : p,
          );
        } else {
          if (updatedUser.activePowers.length >= maxActivePowers) {
            setError(
              `Maximum ${maxActivePowers} active powers allowed. Deactivate one first.`,
            );
            return;
          }
          updatedUser.activePowers = [...updatedUser.activePowers, powerId];
          updatedUser.unlockedPowers = updatedUser.unlockedPowers.map((p) =>
            p.id === powerId ? { ...p, active: true } : p,
          );
        }
        updateUser(updatedUser);
      } else {
        setError(response.message || "Failed to toggle power");
      }
    } catch (error) {
      console.error("Error toggling power:", error);
      setError(error.response?.data?.message || "Failed to toggle power");
    } finally {
      setLoading((prev) => ({ ...prev, [powerId]: false }));
    }
  };

  const categorizedPowers = getPowersByCategory();
  const unlockedPowerIds = new Set(unlockedPowers.map((p) => p.id));

  return (
    <div className="power-management-overlay">
      <div className="power-management">
        <div className="power-header">
          <h2>Power Management</h2>
          <button onClick={onClose} className="close-button">
            ×
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Active Powers Summary */}
        <div className="power-summary">
          <div className="summary-item">
            <span className="summary-label">Active Powers:</span>
            <span className="summary-value">
              {activePowers.length} / {maxActivePowers}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Unlocked Powers:</span>
            <span className="summary-value">{unlockedPowers.length}</span>
          </div>
        </div>

        {/* Unlocked Powers */}
        {unlockedPowers.length > 0 ? (
          <div className="power-sections">
            {Object.entries(categorizedPowers).map(([category, powers]) => {
              const categoryUnlockedPowers = unlockedPowers.filter((p) =>
                powers.some((power) => power.id === p.id),
              );

              if (categoryUnlockedPowers.length === 0) return null;

              return (
                <div key={category} className="power-category">
                  <h3
                    style={{
                      color: POWER_CATEGORIES[category]?.color || "#fff",
                    }}
                  >
                    {POWER_CATEGORIES[category]?.name || category}
                  </h3>
                  <div className="power-list">
                    {categoryUnlockedPowers.map((power) => {
                      const powerDef = getPowerDefinition(power.id);
                      const isActive = activePowers.includes(power.id);
                      const canActivate =
                        !isActive && activePowers.length < maxActivePowers;

                      return (
                        <div
                          key={power.id}
                          className={`power-item ${isActive ? "active" : ""} ${!canActivate && !isActive ? "disabled" : ""}`}
                        >
                          <div className="power-icon">{powerDef.icon}</div>
                          <div className="power-info">
                            <div className="power-name-row">
                              <h4>{power.name || powerDef.name}</h4>
                              {isActive && (
                                <span className="active-badge">ACTIVE</span>
                              )}
                              {power.level > 1 && (
                                <span className="level-badge">
                                  Lv.{power.level}
                                </span>
                              )}
                            </div>
                            <p className="power-description">
                              {power.description || powerDef.description}
                            </p>
                            {power.source && (
                              <p className="power-source">
                                Unlocked from: {power.source}
                              </p>
                            )}
                            <div className="power-unlocked-date">
                              Unlocked:{" "}
                              {new Date(power.unlockedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="power-actions">
                            <button
                              className={`power-toggle ${isActive ? "deactivate" : "activate"}`}
                              onClick={() =>
                                handleTogglePower(power.id, isActive)
                              }
                              disabled={
                                loading[power.id] || (!canActivate && !isActive)
                              }
                              title={
                                isActive
                                  ? "Deactivate power"
                                  : activePowers.length >= maxActivePowers
                                    ? `Maximum ${maxActivePowers} active powers`
                                    : "Activate power"
                              }
                            >
                              {loading[power.id]
                                ? "..."
                                : isActive
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-powers">
            <p>No powers unlocked yet!</p>
            <p className="hint">Complete artifacts to unlock new powers.</p>
          </div>
        )}

        {/* All Available Powers (Locked) */}
        <div className="power-sections">
          <h3 className="locked-powers-header">Available Powers</h3>
          {Object.entries(categorizedPowers).map(([category, powers]) => {
            const lockedPowers = powers.filter(
              (p) => !unlockedPowerIds.has(p.id),
            );

            if (lockedPowers.length === 0) return null;

            return (
              <div key={category} className="power-category">
                <h3
                  style={{ color: POWER_CATEGORIES[category]?.color || "#fff" }}
                >
                  {POWER_CATEGORIES[category]?.name || category}
                </h3>
                <div className="power-list">
                  {lockedPowers.map((power) => (
                    <div key={power.id} className="power-item locked">
                      <div className="power-icon locked-icon">🔒</div>
                      <div className="power-info">
                        <h4>{power.name}</h4>
                        <p className="power-description">{power.description}</p>
                        <p className="power-locked-hint">
                          Complete artifacts to unlock
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PowerManagement;
