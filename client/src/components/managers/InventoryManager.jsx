import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { updateArtifact, deleteArtifact } from "../../api/api";
import Inventory from "../Inventory";

const InventoryManager = ({
  showInventory,
  setShowInventory,
  character,
  inventory,
  artifacts,
  currentArea,
  setSelectedUserArtifact,
  refreshArtifactList,
  setInventory,
  updateUIState,
}) => {
  // Function to handle user artifact management
  const handleUserArtifactUpdate = useCallback(
    async (artifact, action) => {
      try {
        if (action === "place") {
          setSelectedUserArtifact(artifact);
          updateUIState({ isPlacingArtifact: true });
          setShowInventory(false);
        } else if (action === "update" && artifact._id) {
          // Note: updateArtifact function should be passed as prop or imported
          await updateArtifact(artifact);
          refreshArtifactList();
        } else if (action === "delete" && artifact._id) {
          // Note: deleteArtifact function should be passed as prop or imported
          await deleteArtifact(artifact._id);
          setInventory((prev) =>
            prev.filter((item) => item._id !== artifact._id),
          );
          refreshArtifactList();
        }
      } catch (error) {
        console.error(`❌ Error ${action}ing artifact:`, error);
      }
    },
    [setSelectedUserArtifact, updateUIState, setShowInventory, refreshArtifactList, setInventory],
  );

  if (!showInventory || !character) {
    return null;
  }

  return (
    <Inventory
      onClose={() => setShowInventory(false)}
      character={character}
      inventory={inventory}
      artifacts={artifacts}
      currentArea={currentArea}
      onManageUserArtifact={handleUserArtifactUpdate}
    />
  );
};

InventoryManager.propTypes = {
  showInventory: PropTypes.bool.isRequired,
  setShowInventory: PropTypes.func.isRequired,
  character: PropTypes.object,
  inventory: PropTypes.array.isRequired,
  artifacts: PropTypes.array,
  currentArea: PropTypes.string.isRequired,
  setSelectedUserArtifact: PropTypes.func.isRequired,
  refreshArtifactList: PropTypes.func.isRequired,
  setInventory: PropTypes.func.isRequired,
  updateUIState: PropTypes.func.isRequired,
};

export default InventoryManager;