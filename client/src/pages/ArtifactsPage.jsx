import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/shared/Layout';
import ArtifactCard from '../components/ArtifactCard';
import ArtifactForm from '../components/ArtifactForm';
import Button from '../components/shared/Button';
import { useAuth } from '../context/AuthContext';
import { fetchArtifacts as apiFetchArtifacts, deleteArtifact, updateArtifact, createArtifact as apiCreateArtifact } from '../api/api';
import '../styles/ArtifactsPage.css';

const ArtifactsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingArtifact, setEditingArtifact] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchArtifacts();
  }, [filter, sortBy]);

  const fetchArtifacts = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError('');
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filter !== 'all') {
        queryParams.append('filter', filter);
      }
      queryParams.append('sort', sortBy);
      
      console.log("Fetching artifacts with params:", queryParams.toString());
      
      // Check for network connectivity
      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection.');
      }
      
      const data = await apiFetchArtifacts();
      console.log("Fetched artifacts:", data);
      
      if (!Array.isArray(data)) {
        console.warn("Server returned non-array data. Using fallback empty array.");
        setArtifacts([]);
      } else {
        console.log(`Successfully loaded ${data.length} artifacts`);
        setArtifacts(data);
      }
    } catch (err) {
      console.error('Error fetching artifacts:', err);
      
      // Implement retry logic for network errors (3 retries max)
      if (retryCount < 3 && (err.message.includes('offline') || err.message.includes('network') || !err.response)) {
        console.log(`Retrying fetch artifacts (Attempt ${retryCount + 1}/3)...`);
        setTimeout(() => fetchArtifacts(retryCount + 1), 1500 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      setError(`Failed to load artifacts: ${err.message}`);
      // Don't clear artifacts if we already have some
      if (artifacts.length === 0) {
        // Set sample artifacts as fallback so the UI isn't empty
        setArtifacts([
          {
            _id: 'sample1',
            name: 'Sample Artifact',
            description: 'This is a sample artifact shown when network is unavailable',
            content: 'Sample content - real artifacts will appear when connection is restored',
            location: { x: 0, y: 0 },
            creator: { username: 'System' },
            createdAt: new Date().toISOString(),
            isSample: true
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArtifact = async (formData) => {
    try {
      setLoading(true);
      setError('');
      
      console.log("Creating artifact with data:", formData);
      
      // Handle FormData differently than JSON data
      let result;
      
      if (formData instanceof FormData) {
        // Create a proper FormData object for file upload
        const token = localStorage.getItem('token');
        
        // Make the API request with FormData
        const response = await fetch('/api/artifacts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || `Error ${response.status}: Failed to create artifact`);
        }
        
        result = await response.json();
      } else {
        // Ensure required fields are present and properly formatted
        if (!formData.name || formData.name.trim().length < 1) {
          throw new Error('Artifact name is required');
        }
        if (!formData.description || formData.description.trim().length < 1) {
          throw new Error('Artifact description is required');
        }
        
        // Make sure content is set (use description if content is missing)
        if (!formData.content || formData.content.trim().length < 1) {
          formData.content = formData.description;
        }
        
        // Make sure area is set
        if (!formData.area) {
          formData.area = 'Overworld';
        }
        
        // Ensure location is properly formatted
        if (!formData.location || typeof formData.location.x === 'undefined' || typeof formData.location.y === 'undefined') {
          // Generate random coordinates if not provided
          formData.location = {
            x: Math.floor(Math.random() * 100),
            y: Math.floor(Math.random() * 100)
          };
        }
        
        // Set default values for other required fields
        formData.exp = formData.exp || 10;
        formData.visible = formData.visible !== undefined ? formData.visible : true;
        formData.status = formData.status || 'dropped';
        formData.type = formData.type || 'artifact';
        
        // Use the API function for JSON data
        result = await apiCreateArtifact(formData);
      }
      
      console.log("Artifact created successfully:", result);
      
      // Add the new artifact to state
      const newArtifact = result.artifact || result;
      setArtifacts(prevArtifacts => [newArtifact, ...prevArtifacts]);
      
      // Close the form
      setShowForm(false);
      
      // Show success message
      alert('Artifact created successfully!');
    } catch (err) {
      console.error('Error creating artifact:', err);
      alert(`Failed to create artifact: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateArtifact = async (formData) => {
    if (!editingArtifact?._id) {
      throw new Error('No artifact selected for editing');
    }

    try {
      setLoading(true);
      setError('');

      // When formData is a FormData object, we need special handling for file uploads
      if (formData instanceof FormData) {
        // Preserve the file upload if one exists
        const token = localStorage.getItem('token');
        
        // Add the token to headers but don't directly modify the FormData object
        const response = await fetch(`/api/artifacts/${editingArtifact._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || `Error ${response.status}: Failed to update artifact`);
        }
        
        const updatedArtifact = await response.json();
        
        // Update the artifacts list with the updated artifact
        setArtifacts(prev => 
          prev.map(artifact => 
            artifact._id === editingArtifact._id ? updatedArtifact : artifact
          )
        );
      } else {
        // For regular JSON data, use the API function
        const updateData = formData;
        const updatedArtifact = await updateArtifact(editingArtifact._id, updateData);
        
        // Update the artifacts list with the updated artifact
        setArtifacts(prev => 
          prev.map(artifact => 
            artifact._id === editingArtifact._id ? updatedArtifact : artifact
          )
        );
      }

      // Reset form state
      setEditingArtifact(null);
      setShowForm(false);

      // Show success message
      alert('Artifact updated successfully!');
    } catch (err) {
      console.error('Error updating artifact:', err);
      setError(err.message || 'Failed to update artifact. Please try again.');
      alert(`Failed to update artifact: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArtifact = async (id) => {
    if (!window.confirm('Are you sure you want to delete this artifact?')) {
      return;
    }
    
    try {
      setLoading(true);
      await deleteArtifact(id);
      
      // Update the local state
      setArtifacts(prev => prev.filter(artifact => artifact._id !== id));
      
    } catch (err) {
      console.error('Error deleting artifact:', err);
      setError(err.message || 'Failed to delete artifact. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id) => {
    try {
      const response = await fetch(`/api/artifacts/${id}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to vote on artifact');
      }
      
      const data = await response.json();
      
      // Update the artifact in the state
      setArtifacts(prev => 
        prev.map(artifact => {
          if (artifact._id === id) {
            // Check if user has already voted
            const hasVoted = artifact.voters?.includes(user?.id);
            
            return {
              ...artifact,
              votes: data.votes,
              voters: hasVoted 
                ? artifact.voters.filter(voter => voter !== user?.id)
                : [...(artifact.voters || []), user?.id]
            };
          }
          return artifact;
        })
      );
    } catch (err) {
      console.error('Error voting on artifact:', err);
      alert('Failed to vote. Please try again.');
    }
  };

  const handleComment = async (id, text) => {
    try {
      const response = await fetch(`/api/artifacts/${id}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      
      const data = await response.json();
      
      // Update the artifact in the state
      setArtifacts(prev => 
        prev.map(artifact => {
          if (artifact._id === id) {
            return {
              ...artifact,
              comments: [...(artifact.comments || []), data.comment]
            };
          }
          return artifact;
        })
      );
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="artifacts-page">
        <div className="artifacts-header">
          <h1>Artifacts</h1>
          {user && (
            <Button onClick={() => setShowForm(true)} className="create-artifact-btn">
              Create New Artifact
            </Button>
          )}
        </div>

        <div className="artifacts-filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Artifacts</option>
            <option value="mine">My Artifacts</option>
            <option value="others">Other's Artifacts</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="mostVoted">Most Voted</option>
            <option value="mostCommented">Most Commented</option>
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading artifacts...</div>
        ) : (
          <div className="artifacts-grid">
            {artifacts.map((artifact) => (
              <ArtifactCard
                key={artifact._id}
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
        )}

        {showForm && (
          <ArtifactForm
            onSubmit={editingArtifact ? handleUpdateArtifact : handleCreateArtifact}
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