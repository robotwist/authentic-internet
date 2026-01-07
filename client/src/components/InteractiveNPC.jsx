import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { calculateSkillBonuses } from "../constants/SkillTree";
import { startQuest, getAvailableQuests, completeQuestStage } from "../api/api";
import "./InteractiveNPC.css";

const InteractiveNPC = ({ npc, onClose, onQuestComplete }) => {
  const { user } = useAuth();
  const [currentDialogue, setCurrentDialogue] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [questProgress, setQuestProgress] = useState({});
  const [availableQuests, setAvailableQuests] = useState([]);
  const [activeQuests, setActiveQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [loadingQuests, setLoadingQuests] = useState(true);

  const skillBonuses = calculateSkillBonuses(user?.skills || {});

  // Fetch available quests when NPC dialog opens
  useEffect(() => {
    if (npc?._id) {
      fetchQuestData();
    }
  }, [npc?._id]);

  const fetchQuestData = async () => {
    try {
      setLoadingQuests(true);
      const response = await getAvailableQuests(npc._id);
      if (response.success) {
        setAvailableQuests(response.data.availableQuests || []);
        setActiveQuests(response.data.activeQuests || []);
        setCompletedQuests(response.data.completedQuests || []);
      }
    } catch (error) {
      console.error("Error fetching quest data:", error);
    } finally {
      setLoadingQuests(false);
    }
  };

  // NPC dialogue based on player skills and progress
  const getNPCDialogue = () => {
    const baseDialogue = npc.dialogue || [];
    const enhancedDialogue = [...baseDialogue];

    // Add skill-specific dialogue
    if (skillBonuses.exploration > 0) {
      enhancedDialogue.push({
        type: "skill",
        text: `Ah, I can see you're quite the explorer! Your knowledge of hidden paths is impressive.`,
        options: [
          { text: "Tell me about hidden areas", action: "explore_hint" },
          { text: "Share your wisdom", action: "skill_share" },
        ],
      });
    }

    if (skillBonuses.creation > 0) {
      enhancedDialogue.push({
        type: "skill",
        text: `Your creative spirit is strong! I sense great artifacts in your future.`,
        options: [
          { text: "Ask about artifact creation", action: "creation_advice" },
          { text: "Share your creations", action: "show_artifacts" },
        ],
      });
    }

    if (skillBonuses.social > 0) {
      enhancedDialogue.push({
        type: "skill",
        text: `You have a way with people! The community speaks highly of you.`,
        options: [
          { text: "Learn about the community", action: "community_info" },
          { text: "Ask about collaborations", action: "collaboration_help" },
        ],
      });
    }

    return enhancedDialogue;
  };

  const handleDialogueOption = async (option) => {
    setSelectedOption(option);
    setIsLoading(true);

    try {
      switch (option.action) {
        case "quest_accept":
          // Start a new quest using the Quest API
          try {
            const questId = option.questId;
            const response = await startQuest(npc._id, questId);
            if (response.success) {
              // Refresh quest data
              await fetchQuestData();
              alert(`Quest "${response.data.title}" started!`);
              setCurrentDialogue((prev) => prev + 1);
            } else {
              alert(
                "Failed to start quest: " +
                  (response.message || "Unknown error"),
              );
            }
          } catch (error) {
            console.error("Error starting quest:", error);
            alert(
              "Failed to start quest: " +
                (error.response?.data?.message || error.message),
            );
          }
          break;

        case "quest_complete_stage":
          // Complete a quest stage
          try {
            const { questId, stageIndex } = option;
            const response = await completeQuestStage(questId, stageIndex);
            if (response.success) {
              // Refresh quest data
              await fetchQuestData();

              // Show reward notification
              const rewards = response.data.rewards;
              let rewardText = `Stage completed!`;
              if (rewards.exp) rewardText += ` +${rewards.exp} XP`;
              if (rewards.item) rewardText += ` +${rewards.item}`;
              if (rewards.ability) rewardText += ` +${rewards.ability}`;

              alert(rewardText);

              // If quest is fully completed, trigger completion callback
              if (response.data.questCompleted && onQuestComplete) {
                onQuestComplete(response.data, rewards);
              }
            } else {
              alert(
                "Failed to complete stage: " +
                  (response.message || "Unknown error"),
              );
            }
          } catch (error) {
            console.error("Error completing quest stage:", error);
            alert(
              "Failed to complete stage: " +
                (error.response?.data?.message || error.message),
            );
          }
          break;

        case "explore_hint":
          // Give exploration hints based on skill level
          const hintLevel = Math.min(
            Math.floor(skillBonuses.exploration / 10),
            3,
          );
          const hints = [
            "I heard there are hidden passages in the ancient ruins...",
            "The old library contains maps of forgotten areas...",
            "Legend says there's a secret chamber beneath the town square...",
            "The highest skill reveals all secrets of this world...",
          ];

          setCurrentDialogue((prev) => prev + 1);
          break;

        case "creation_advice":
          // Give creation advice based on skill level
          const adviceLevel = Math.min(
            Math.floor(skillBonuses.creation / 10),
            3,
          );
          const advice = [
            "Start with simple artifacts to build your skills...",
            "Try combining different elements for unique results...",
            "Collaborate with other creators for amazing outcomes...",
            "Master creators can bend reality itself...",
          ];

          setCurrentDialogue((prev) => prev + 1);
          break;

        case "community_info":
          // Share community information
          setCurrentDialogue((prev) => prev + 1);
          break;

        default:
          setCurrentDialogue((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error handling dialogue option:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const dialogue = getNPCDialogue();
  const currentDialogueData = dialogue[currentDialogue] || dialogue[0];

  if (!currentDialogueData) {
    return (
      <div className="npc-modal">
        <div className="npc-container">
          <div className="npc-header">
            <h2>{npc.name}</h2>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="npc-content">
            <p>No dialogue available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="npc-modal">
      <div className="npc-container">
        <div className="npc-header">
          <div className="npc-info">
            <div className="npc-avatar">{npc.avatar}</div>
            <div className="npc-details">
              <h2>{npc.name}</h2>
              <p className="npc-title">{npc.title}</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="npc-content">
          <div className="dialogue-box">
            <p className="dialogue-text">{currentDialogueData.text}</p>

            {currentDialogueData.options && (
              <div className="dialogue-options">
                {currentDialogueData.options.map((option, index) => (
                  <button
                    key={index}
                    className={`dialogue-option ${selectedOption === option ? "selected" : ""}`}
                    onClick={() => handleDialogueOption(option)}
                    disabled={isLoading}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Available Quests Section */}
          {loadingQuests ? (
            <div className="quest-section">
              <p>Loading quests...</p>
            </div>
          ) : (
            <>
              {/* Available Quests */}
              {availableQuests.length > 0 && (
                <div className="quest-section">
                  <h3>Available Quests</h3>
                  {availableQuests.map((quest, index) => (
                    <div key={quest.id || index} className="quest-item">
                      <h4>{quest.title}</h4>
                      <p>{quest.description}</p>
                      {quest.stages && quest.stages.length > 0 && (
                        <div className="quest-stages-info">
                          <strong>Stages:</strong> {quest.stages.length}
                        </div>
                      )}
                      {quest.stages && quest.stages[0]?.reward && (
                        <div className="quest-rewards">
                          <strong>Rewards:</strong>
                          {quest.stages[0].reward.exp && (
                            <span> +{quest.stages[0].reward.exp} XP</span>
                          )}
                          {quest.stages[0].reward.item && (
                            <span> +{quest.stages[0].reward.item}</span>
                          )}
                          {quest.stages[0].reward.ability && (
                            <span> +{quest.stages[0].reward.ability}</span>
                          )}
                        </div>
                      )}
                      <button
                        className="quest-button accept"
                        onClick={() =>
                          handleDialogueOption({
                            action: "quest_accept",
                            questId: quest.id,
                          })
                        }
                        disabled={isLoading}
                      >
                        Accept Quest
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Active Quests */}
              {activeQuests.length > 0 && (
                <div className="quest-section">
                  <h3>Active Quests</h3>
                  {activeQuests.map((quest, index) => {
                    const completedStages =
                      quest.stages?.filter((s) => s.completed).length || 0;
                    const totalStages = quest.stages?.length || 0;
                    const currentStage = quest.currentStage || 0;
                    const nextStage = quest.stages?.[currentStage];

                    return (
                      <div
                        key={quest.questId || index}
                        className="quest-item active"
                      >
                        <h4>{quest.title}</h4>
                        <p>{quest.description}</p>
                        <div className="quest-progress">
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${(completedStages / totalStages) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="progress-text">
                            {completedStages} / {totalStages} stages completed
                          </span>
                        </div>
                        {nextStage && !nextStage.completed && (
                          <div className="current-stage">
                            <strong>Current Stage:</strong> {nextStage.task}
                            <button
                              className="quest-button complete-stage"
                              onClick={() =>
                                handleDialogueOption({
                                  action: "quest_complete_stage",
                                  questId: quest.questId,
                                  stageIndex: currentStage,
                                })
                              }
                              disabled={isLoading}
                            >
                              Complete Stage
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Completed Quests */}
              {completedQuests.length > 0 && (
                <div className="quest-section">
                  <h3>Completed Quests</h3>
                  {completedQuests.map((quest, index) => (
                    <div
                      key={quest.questId || index}
                      className="quest-item completed"
                    >
                      <h4>{quest.title}</h4>
                      <span className="quest-status">✓ Completed</span>
                      {quest.totalExp > 0 && (
                        <div className="quest-rewards">
                          <strong>Total Rewards:</strong> +{quest.totalExp} XP
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Fallback: Show NPC quests if API doesn't return any */}
              {availableQuests.length === 0 &&
                activeQuests.length === 0 &&
                completedQuests.length === 0 &&
                npc.quests &&
                npc.quests.length > 0 && (
                  <div className="quest-section">
                    <h3>Available Quests</h3>
                    {npc.quests.map((quest, index) => (
                      <div key={quest.id || index} className="quest-item">
                        <h4>{quest.title}</h4>
                        <p>{quest.description}</p>
                        <button
                          className="quest-button accept"
                          onClick={() =>
                            handleDialogueOption({
                              action: "quest_accept",
                              questId: quest.id,
                            })
                          }
                          disabled={isLoading}
                        >
                          Accept Quest
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </>
          )}

          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner">Processing...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveNPC;
