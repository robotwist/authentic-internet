import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/shared/Layout";
import ArtifactCard from "../components/ArtifactCard";
import ArtifactForm from "../components/ArtifactForm";
import AdvancedSearch from "../components/AdvancedSearch";
import DiscoveryEngine from "../components/DiscoveryEngine";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import RecommendationEngine from "../components/RecommendationEngine";
import Button from "../components/shared/Button";
import { useAuth } from "../context/AuthContext";
import {
  fetchArtifacts as apiFetchArtifacts,
  deleteArtifact,
  updateArtifact,
  createArtifact as apiCreateArtifact,
} from "../api/api";
import "../styles/ArtifactsPage.css";
import { Typography } from "@mui/material";

const ArtifactsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artifacts, setArtifacts] = useState([]);
  const [filteredArtifacts, setFilteredArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingArtifact, setEditingArtifact] = useState(null);
  const [viewMode, setViewMode] = useState("browse"); // browse, search, discovery, analytics, recommendations
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchArtifacts();
  }, []);

  // Update filtered artifacts when artifacts change
  useEffect(() => {
    setFilteredArtifacts(artifacts);
  }, [artifacts]);

  const fetchArtifacts = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError("");

      // Build query parameters
      const queryParams = new URLSearchParams();

      console.log("Fetching artifacts with params:", queryParams.toString());

      // Check for network connectivity
      if (!navigator.onLine) {
        throw new Error(
          "You appear to be offline. Please check your internet connection.",
        );
      }

      const data = await apiFetchArtifacts();
      console.log("Fetched artifacts:", data);

      if (!Array.isArray(data)) {
        console.warn(
          "Server returned non-array data. Using fallback empty array.",
        );
        setArtifacts([]);
      } else {
        console.log(`Successfully loaded ${data.length} artifacts`);
        setArtifacts(data);
      }
    } catch (err) {
      console.error("Error fetching artifacts:", err);

      if (retryCount < 3) {
        console.log(`Retrying fetch (attempt ${retryCount + 1})...`);
        setTimeout(
          () => fetchArtifacts(retryCount + 1),
          2000 * (retryCount + 1),
        );
      } else {
        setError(err.message || "Failed to load artifacts. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArtifact = async (formData) => {
    try {
      setLoading(true);
      setError("");

      const newArtifact = await apiCreateArtifact(formData);

      // Add the new artifact to the list
      setArtifacts((prev) => [newArtifact, ...prev]);

      // Reset form state
      setShowForm(false);

      // Show success message
      alert("Artifact created successfully!");
    } catch (err) {
      console.error("Error creating artifact:", err);
      setError(err.message || "Failed to create artifact. Please try again.");
      alert(`Failed to create artifact: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateArtifact = async (formData) => {
    try {
      setLoading(true);
      setError("");

      // Use our enhanced updateArtifact API function for all updates
      // It now properly handles both FormData and regular JSON data
      const updatedArtifact = await updateArtifact(
        editingArtifact._id,
        formData,
      );

      // Update the artifacts list with the updated artifact
      setArtifacts((prev) =>
        prev.map((artifact) =>
          artifact._id === editingArtifact._id ? updatedArtifact : artifact,
        ),
      );

      // Reset form state
      setEditingArtifact(null);
      setShowForm(false);

      // Show success message
      alert("Artifact updated successfully!");
    } catch (err) {
      console.error("Error updating artifact:", err);
      setError(err.message || "Failed to update artifact. Please try again.");
      alert(`Failed to update artifact: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArtifact = async (id) => {
    if (!window.confirm("Are you sure you want to delete this artifact?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteArtifact(id);

      // Update the local state
      setArtifacts((prev) => prev.filter((artifact) => artifact._id !== id));
    } catch (err) {
      console.error("Error deleting artifact:", err);
      setError(err.message || "Failed to delete artifact. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id) => {
    try {
      const response = await fetch(`/api/artifacts/${id}/vote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to vote on artifact");
      }

      const data = await response.json();

      // Update the artifact in the state
      setArtifacts((prev) =>
        prev.map((artifact) => {
          if (artifact._id === id) {
            // Check if user has already voted
            const hasVoted = artifact.voters?.includes(user?.id);

            return {
              ...artifact,
              votes: data.votes,
              voters: hasVoted
                ? artifact.voters.filter((voter) => voter !== user?.id)
                : [...(artifact.voters || []), user?.id],
            };
          }
          return artifact;
        }),
      );
    } catch (err) {
      console.error("Error voting on artifact:", err);
      alert("Failed to vote. Please try again.");
    }
  };

  const handleComment = async (id, text) => {
    try {
      const response = await fetch(`/api/artifacts/${id}/comment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const data = await response.json();

      // Update the artifact in the state
      setArtifacts((prev) =>
        prev.map((artifact) => {
          if (artifact._id === id) {
            return {
              ...artifact,
              comments: [...(artifact.comments || []), data.comment],
            };
          }
          return artifact;
        }),
      );
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment. Please try again.");
    }
  };

  // Handle search results
  const handleSearchResults = (results) => {
    setSearchResults(results);
    setViewMode("search");
  };

  // Handle search change
  const handleSearchChange = (searchData) => {
    setSearchLoading(searchData.loading || false);
  };

  // Handle artifact selection from discovery
  const handleArtifactSelect = (artifact) => {
    // Navigate to artifact details or show in modal
    console.log("Selected artifact:", artifact);
  };

  // Render view mode content
  const renderViewMode = () => {
    switch (viewMode) {
      case "search":
        return (
          <div className="search-results">
            <div className="search-results-header">
              <Button
                onClick={() => setViewMode("browse")}
                variant="outlined"
                size="small"
              >
                ← Back to Browse
              </Button>
              <Typography variant="h6">
                Search Results ({searchResults.length})
              </Typography>
            </div>
            <div className="artifacts-grid">
              {searchResults.map((artifact) => (
                <ArtifactCard
                  key={artifact._id || artifact.id}
                  artifact={artifact}
                  onDelete={handleDeleteArtifact}
                  onEdit={() => {
                    setEditingArtifact(artifact);
                    setShowForm(true);
                  }}
                  onVote={() => handleVote(artifact._id)}
                  onComment={(text) => handleComment(artifact._id, text)}
                  currentUser={user}
                />
              ))}
            </div>
          </div>
        );

      case "discovery":
        return (
          <DiscoveryEngine
            artifacts={artifacts}
            onArtifactSelect={handleArtifactSelect}
            loading={loading}
          />
        );

      case "analytics":
        return <AnalyticsDashboard artifacts={artifacts} loading={loading} />;

      case "recommendations":
        return <RecommendationEngine artifacts={artifacts} loading={loading} />;

      default: // browse
        return (
          <div className="artifacts-grid">
            {filteredArtifacts.map((artifact) => (
              <ArtifactCard
                key={artifact._id || artifact.id}
                artifact={artifact}
                onDelete={handleDeleteArtifact}
                onEdit={() => {
                  setEditingArtifact(artifact);
                  setShowForm(true);
                }}
                onVote={() => handleVote(artifact._id)}
                onComment={(text) => handleComment(artifact._id, text)}
                currentUser={user}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="artifacts-page">
        <div className="artifacts-header">
          <h1>Artifacts</h1>
          {user && (
            <Button
              onClick={() => setShowForm(true)}
              className="create-artifact-btn primary-btn"
            >
              Create New Artifact
            </Button>
          )}
        </div>

        <div className="artifacts-description">
          <p>
            Browse all artifacts created by the community. You can create new
            artifacts here or press the 'e' key while in the game world to
            create artifacts at your character's location.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="view-mode-tabs">
          <Button
            variant={viewMode === "browse" ? "contained" : "outlined"}
            onClick={() => setViewMode("browse")}
            startIcon={<span>📚</span>}
          >
            Browse
          </Button>
          <Button
            variant={viewMode === "search" ? "contained" : "outlined"}
            onClick={() => setViewMode("search")}
            startIcon={<span>🔍</span>}
          >
            Search
          </Button>
          <Button
            variant={viewMode === "discovery" ? "contained" : "outlined"}
            onClick={() => setViewMode("discovery")}
            startIcon={<span>🌟</span>}
          >
            Discover
          </Button>
          <Button
            variant={viewMode === "analytics" ? "contained" : "outlined"}
            onClick={() => setViewMode("analytics")}
            startIcon={<span>📊</span>}
          >
            Analytics
          </Button>
          <Button
            variant={viewMode === "recommendations" ? "contained" : "outlined"}
            onClick={() => setViewMode("recommendations")}
            startIcon={<span>👍</span>}
          >
            Recommendations
          </Button>
        </div>

        {/* Advanced Search Component */}
        {viewMode === "search" && (
          <AdvancedSearch
            artifacts={artifacts}
            onSearchResults={handleSearchResults}
            onSearchChange={handleSearchChange}
            loading={searchLoading}
            showAdvanced={true}
          />
        )}

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading artifacts...</div>
        ) : (
          renderViewMode()
        )}

        {showForm && (
          <ArtifactForm
            onSubmit={
              editingArtifact ? handleUpdateArtifact : handleCreateArtifact
            }
            onClose={() => {
              setShowForm(false);
              setEditingArtifact(null);
            }}
            initialData={editingArtifact}
            isEditing={!!editingArtifact}
          />
        )}
      </div>
    </Layout>
  );
};

export default ArtifactsPage;
