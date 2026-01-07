import { useState, useEffect, useCallback } from "react";
import {
  fetchArtifacts,
  createArtifact,
  updateArtifact,
  deleteArtifact,
} from "../api/api";

/**
 * Custom hook for managing artifacts in the application
 * Provides functions to fetch, create, update, and delete artifacts
 * as well as managing the loading and error states
 *
 * @returns {Object} The artifact data and utility functions
 */
export const useArtifacts = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collectedArtifacts, setCollectedArtifacts] = useState([]);

  // Load artifacts from server
  const loadArtifacts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchArtifacts();
      console.log("Fetched artifacts:", data);
      setArtifacts(data || []);

      // Load collected artifacts from localStorage
      try {
        const savedCollected = localStorage.getItem("collectedArtifacts");
        if (savedCollected) {
          setCollectedArtifacts(JSON.parse(savedCollected));
        }
      } catch (err) {
        console.error(
          "Error loading collected artifacts from localStorage:",
          err,
        );
      }
    } catch (err) {
      console.error("Error fetching artifacts:", err);
      setError(err.message || "Failed to load artifacts");
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new artifact
  const addArtifact = useCallback(async (artifactData) => {
    setLoading(true);
    setError(null);

    try {
      const newArtifact = await createArtifact(artifactData);
      setArtifacts((prev) => [...prev, newArtifact]);
      return newArtifact;
    } catch (err) {
      console.error("Error creating artifact:", err);
      setError(err.message || "Failed to create artifact");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing artifact
  const updateArtifactById = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);

    try {
      const updatedArtifact = await updateArtifact(id, updates);
      setArtifacts((prev) =>
        prev.map((artifact) =>
          artifact.id === id ? { ...artifact, ...updatedArtifact } : artifact,
        ),
      );
      return updatedArtifact;
    } catch (err) {
      console.error("Error updating artifact:", err);
      setError(err.message || "Failed to update artifact");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove an artifact
  const removeArtifact = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      await deleteArtifact(id);
      setArtifacts((prev) => prev.filter((artifact) => artifact.id !== id));
      return true;
    } catch (err) {
      console.error("Error deleting artifact:", err);
      setError(err.message || "Failed to delete artifact");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle collecting an artifact
  const collectArtifact = useCallback((artifact) => {
    // Add to collected artifacts
    setCollectedArtifacts((prev) => {
      const updated = [
        ...prev,
        { ...artifact, collectedAt: new Date().toISOString() },
      ];

      // Save to localStorage
      try {
        localStorage.setItem("collectedArtifacts", JSON.stringify(updated));
      } catch (err) {
        console.error("Error saving to localStorage:", err);
      }

      return updated;
    });

    // Remove from visible artifacts if it's a collectible
    if (artifact.isCollectible !== false) {
      setArtifacts((prev) =>
        prev.map((a) =>
          a.id === artifact.id ? { ...a, collected: true, visible: false } : a,
        ),
      );
    }

    return true;
  }, []);

  // Get artifact by ID
  const getArtifactById = useCallback(
    (id) => {
      return artifacts.find((artifact) => artifact.id === id);
    },
    [artifacts],
  );

  // Load artifacts on mount
  useEffect(() => {
    loadArtifacts();
  }, [loadArtifacts]);

  return {
    artifacts,
    collectedArtifacts,
    loading,
    error,
    loadArtifacts,
    addArtifact,
    updateArtifactById,
    removeArtifact,
    collectArtifact,
    getArtifactById,
  };
};
