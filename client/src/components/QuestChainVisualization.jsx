import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { fetchQuests, getAvailableQuests } from "../api/api";
import "./QuestChainVisualization.css";

/**
 * Component that visualizes quest chains and relationships
 */
const QuestChainVisualization = ({ onClose }) => {
  const [quests, setQuests] = useState({
    activeQuests: [],
    completedQuests: [],
    allNPCQuests: {},
  });
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState("all");
  const [expandedChains, setExpandedChains] = useState(new Set());

  useEffect(() => {
    loadQuestData();
  }, []);

  const loadQuestData = async () => {
    try {
      setLoading(true);
      const response = await fetchQuests();
      if (response.success) {
        setQuests({
          activeQuests: response.data.activeQuests || [],
          completedQuests: response.data.completedQuests || [],
          allNPCQuests: {},
        });

        // Load quest data by area/NPC
        await loadNPCQuests(response.data);
      }
    } catch (error) {
      console.error("Error loading quest data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadNPCQuests = async (questData) => {
    // Group quests by area and NPC
    const npcQuestsMap = {};

    // Process active and completed quests
    [...questData.activeQuests, ...questData.completedQuests].forEach(
      (quest) => {
        const area = quest.area || "Unknown";
        const npcId = quest.npcId?.toString() || "unknown";
        const key = `${area}-${npcId}`;

        if (!npcQuestsMap[key]) {
          npcQuestsMap[key] = {
            area,
            npcId,
            npcName: quest.npcName || "Unknown NPC",
            quests: [],
          };
        }

        npcQuestsMap[key].quests.push({
          ...quest,
          status: quest.isCompleted ? "completed" : "active",
        });
      },
    );

    setQuests((prev) => ({
      ...prev,
      allNPCQuests: npcQuestsMap,
    }));
  };

  const toggleChain = (chainKey) => {
    setExpandedChains((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chainKey)) {
        newSet.delete(chainKey);
      } else {
        newSet.add(chainKey);
      }
      return newSet;
    });
  };

  const getQuestStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "✓";
      case "active":
        return "◉";
      case "available":
        return "○";
      default:
        return "○";
    }
  };

  const getQuestStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#27ae60";
      case "active":
        return "#3498db";
      case "available":
        return "#f39c12";
      default:
        return "#95a5a6";
    }
  };

  const getQuestProgress = (quest) => {
    if (!quest.stages) return 0;
    const completed = quest.stages.filter((s) => s.completed).length;
    const total = quest.stages.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="quest-chain-view">
        <div className="quest-chain-container">
          <div className="loading">Loading quest chains...</div>
        </div>
      </div>
    );
  }

  const chainKeys = Object.keys(quests.allNPCQuests);
  const filteredChains =
    selectedArea === "all"
      ? chainKeys
      : chainKeys.filter(
          (key) => quests.allNPCQuests[key].area === selectedArea,
        );

  const areas = [
    ...new Set(Object.values(quests.allNPCQuests).map((q) => q.area)),
  ];

  return (
    <div className="quest-chain-view">
      <div className="quest-chain-container">
        {/* Area Filter */}
        <div className="quest-chain-filters">
          <label>Filter by Area:</label>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="area-filter"
          >
            <option value="all">All Areas</option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        {/* Quest Chains */}
        <div className="quest-chains-list">
          {filteredChains.length === 0 ? (
            <div className="no-chains">
              <p>No quest chains found.</p>
              <p className="hint">
                Complete quests to see them organized by area and NPC.
              </p>
            </div>
          ) : (
            filteredChains.map((chainKey) => {
              const chain = quests.allNPCQuests[chainKey];
              const isExpanded = expandedChains.has(chainKey);

              return (
                <div key={chainKey} className="quest-chain-item">
                  <div
                    className="quest-chain-header-item"
                    onClick={() => toggleChain(chainKey)}
                  >
                    <div className="chain-info">
                      <span className="chain-area">{chain.area}</span>
                      <span className="chain-npc">{chain.npcName}</span>
                      <span className="chain-count">
                        {chain.quests.length} quest
                        {chain.quests.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="chain-status">
                      {chain.quests.filter((q) => q.status === "completed")
                        .length > 0 && (
                        <span className="status-badge completed">
                          {
                            chain.quests.filter((q) => q.status === "completed")
                              .length
                          }{" "}
                          Completed
                        </span>
                      )}
                      {chain.quests.filter((q) => q.status === "active")
                        .length > 0 && (
                        <span className="status-badge active">
                          {
                            chain.quests.filter((q) => q.status === "active")
                              .length
                          }{" "}
                          Active
                        </span>
                      )}
                    </div>
                    <button
                      className={`expand-button ${isExpanded ? "expanded" : ""}`}
                    >
                      {isExpanded ? "▼" : "▶"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="quest-chain-content">
                      {chain.quests.map((quest, index) => {
                        const progress = getQuestProgress(quest);
                        const statusColor = getQuestStatusColor(quest.status);

                        return (
                          <div
                            key={quest.questId || index}
                            className="chain-quest-node"
                          >
                            {/* Connection Line */}
                            {index > 0 && (
                              <div className="quest-connection-line"></div>
                            )}

                            <div
                              className={`quest-node ${quest.status}`}
                              style={{ borderColor: statusColor }}
                            >
                              <div className="quest-node-header">
                                <span
                                  className="quest-status-icon"
                                  style={{ color: statusColor }}
                                >
                                  {getQuestStatusIcon(quest.status)}
                                </span>
                                <h4 className="quest-node-title">
                                  {quest.title}
                                </h4>
                              </div>

                              <p className="quest-node-description">
                                {quest.description}
                              </p>

                              {quest.status === "active" && (
                                <div className="quest-node-progress">
                                  <div className="progress-bar">
                                    <div
                                      className="progress-fill"
                                      style={{
                                        width: `${progress}%`,
                                        backgroundColor: statusColor,
                                      }}
                                    ></div>
                                  </div>
                                  <span className="progress-text">
                                    {progress}%
                                  </span>
                                </div>
                              )}

                              {quest.status === "completed" &&
                                quest.totalRewards && (
                                  <div className="quest-node-rewards">
                                    {quest.totalRewards.exp > 0 && (
                                      <span className="reward-item">
                                        ⭐ {quest.totalRewards.exp} XP
                                      </span>
                                    )}
                                    {quest.totalRewards.items?.length > 0 && (
                                      <span className="reward-item">
                                        🎁 {quest.totalRewards.items.length}{" "}
                                        Item(s)
                                      </span>
                                    )}
                                    {quest.totalRewards.abilities?.length >
                                      0 && (
                                      <span className="reward-item">
                                        ⚡ {quest.totalRewards.abilities.length}{" "}
                                        Ability(ies)
                                      </span>
                                    )}
                                  </div>
                                )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="quest-chain-legend">
          <h4>Legend:</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-icon" style={{ color: "#27ae60" }}>
                ✓
              </span>
              <span>Completed</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon" style={{ color: "#3498db" }}>
                ◉
              </span>
              <span>Active</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon" style={{ color: "#f39c12" }}>
                ○
              </span>
              <span>Available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

QuestChainVisualization.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default QuestChainVisualization;
