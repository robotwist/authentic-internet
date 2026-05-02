import React, { useCallback } from "react";
import PropTypes from "prop-types";
import "./GameDock.css";

const TABS = [
  { id: "status", label: "Status" },
  { id: "talk", label: "Talk" },
  { id: "create", label: "Create" },
  { id: "bag", label: "Bag" },
  { id: "chat", label: "Chat" },
  { id: "map", label: "Map" },
  { id: "guide", label: "Help" },
  { id: "quotes", label: "Quotes" },
  { id: "feedback", label: "Feedback" },
];

/**
 * Bottom dock: tabs + optional expanded body for status, NPC, inventory, world chat.
 */
const GameDock = ({
  dockExpanded,
  dockTab,
  onSetDockTab,
  onToggleDockExpanded,
  onOpenBag,
  areaName,
  level,
  experience,
  experienceToNextLevel,
  health,
  maxHealth,
  showNPCDialog,
  statusPanel,
  talkPanel,
  bagPanel,
  chatPanel,
  mapPanel,
  guidePanel,
  quotesPanel,
  feedbackPanel,
  createPanel,
}) => {
  const selectTab = useCallback(
    (id) => {
      if (id === "bag" && onOpenBag) {
        onOpenBag();
      }
      onSetDockTab(id);
      if (!dockExpanded) {
        onToggleDockExpanded(true);
      }
    },
    [dockExpanded, onOpenBag, onSetDockTab, onToggleDockExpanded],
  );

  return (
    <footer
      className="game-dock"
      role="region"
      aria-label="Game menu and messages"
    >
      <div className="game-dock-bar">
        <div
          className="game-dock-tabs"
          role="tablist"
          aria-label="Panel sections"
        >
          {TABS.map(({ id, label }) => {
            const talkDisabled = id === "talk" && !showNPCDialog;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={dockTab === id}
                aria-controls={`game-dock-panel-${id}`}
                disabled={talkDisabled}
                className="game-dock-tab"
                onClick={() => {
                  if (id === "talk" && !showNPCDialog) return;
                  selectTab(id);
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        {!dockExpanded && (
          <div className="game-dock-strip" aria-hidden="true">
            <span>
              <strong>{areaName}</strong>
            </span>
            <span>
              Lv {level} · HP {health}/{maxHealth}
            </span>
          </div>
        )}
        <button
          type="button"
          className="game-dock-toggle"
          onClick={() => onToggleDockExpanded(!dockExpanded)}
          aria-expanded={dockExpanded}
          aria-label={dockExpanded ? "Collapse panel" : "Expand panel"}
        >
          {dockExpanded ? "▼" : "▲"}
        </button>
      </div>

      <div
        className={`game-dock-body ${dockExpanded ? "is-expanded" : "is-collapsed"}`}
      >
        <div
          id="game-dock-panel-status"
          className="game-dock-panel"
          role="tabpanel"
          hidden={dockTab !== "status"}
        >
          {statusPanel ?? (
            <div className="game-dock-status">
              <dl>
                <dt>Area</dt>
                <dd>{areaName}</dd>
                <dt>Level</dt>
                <dd>{level}</dd>
                <dt>Experience</dt>
                <dd>
                  {experience} / {experienceToNextLevel} to next level
                </dd>
                <dt>Health</dt>
                <dd>
                  {health} / {maxHealth}
                </dd>
              </dl>
            </div>
          )}
        </div>

        <div
          id="game-dock-panel-talk"
          className="game-dock-panel"
          role="tabpanel"
          hidden={dockTab !== "talk"}
        >
          {talkPanel}
        </div>

        <div
          id="game-dock-panel-create"
          className="game-dock-panel game-dock-panel--scroll"
          role="tabpanel"
          hidden={dockTab !== "create"}
        >
          {createPanel}
        </div>

        <div
          id="game-dock-panel-bag"
          className="game-dock-panel"
          role="tabpanel"
          hidden={dockTab !== "bag"}
        >
          {bagPanel}
        </div>

        <div
          id="game-dock-panel-chat"
          className="game-dock-panel game-dock-panel--chat"
          role="tabpanel"
          hidden={dockTab !== "chat"}
        >
          {chatPanel}
        </div>

        <div
          id="game-dock-panel-map"
          className="game-dock-panel game-dock-panel--scroll"
          role="tabpanel"
          hidden={dockTab !== "map"}
        >
          {mapPanel}
        </div>

        <div
          id="game-dock-panel-guide"
          className="game-dock-panel game-dock-panel--scroll"
          role="tabpanel"
          hidden={dockTab !== "guide"}
        >
          {guidePanel}
        </div>

        <div
          id="game-dock-panel-quotes"
          className="game-dock-panel game-dock-panel--scroll"
          role="tabpanel"
          hidden={dockTab !== "quotes"}
        >
          {quotesPanel}
        </div>

        <div
          id="game-dock-panel-feedback"
          className="game-dock-panel game-dock-panel--scroll"
          role="tabpanel"
          hidden={dockTab !== "feedback"}
        >
          {feedbackPanel}
        </div>
      </div>
    </footer>
  );
};

GameDock.propTypes = {
  dockExpanded: PropTypes.bool.isRequired,
  dockTab: PropTypes.oneOf([
    "status",
    "talk",
    "create",
    "bag",
    "chat",
    "map",
    "guide",
    "quotes",
    "feedback",
  ]).isRequired,
  onSetDockTab: PropTypes.func.isRequired,
  onToggleDockExpanded: PropTypes.func.isRequired,
  areaName: PropTypes.string.isRequired,
  level: PropTypes.number.isRequired,
  experience: PropTypes.number.isRequired,
  experienceToNextLevel: PropTypes.number.isRequired,
  health: PropTypes.number.isRequired,
  maxHealth: PropTypes.number.isRequired,
  onOpenBag: PropTypes.func,
  showNPCDialog: PropTypes.bool.isRequired,
  statusPanel: PropTypes.node,
  talkPanel: PropTypes.node,
  bagPanel: PropTypes.node,
  chatPanel: PropTypes.node,
  mapPanel: PropTypes.node,
  guidePanel: PropTypes.node,
  quotesPanel: PropTypes.node,
  feedbackPanel: PropTypes.node,
  createPanel: PropTypes.node,
};

export default GameDock;
