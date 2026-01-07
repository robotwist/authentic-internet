import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tabs,
  Tab,
  Badge,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Edit as EditIcon,
  Chat as ChatIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Publish as PublishIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import "./CollaborationEngine.css";

const CollaborationEngine = ({
  sessionId,
  onSessionUpdate,
  onArtifactPublish,
  initialArtifactData = null,
}) => {
  const { user } = useAuth();
  const { socket, isConnected } = useWebSocket();

  // State management
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [comments, setComments] = useState([]);
  const [artifactData, setArtifactData] = useState(
    initialArtifactData || {
      name: "",
      description: "",
      type: "GAME",
      content: "",
      gameConfig: {},
      media: [],
    },
  );
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Real-time editing state
  const [editingUsers, setEditingUsers] = useState(new Map());
  const [cursorPositions, setCursorPositions] = useState(new Map());
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState("general");
  const [anchorEl, setAnchorEl] = useState(null);

  // Refs
  const contentRef = useRef(null);
  const autoSaveRef = useRef(null);
  const lastChangeRef = useRef(null);

  // Load session data
  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  // WebSocket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join collaboration room
    socket.emit("collaboration:join", { sessionId });

    // Listen for real-time updates
    socket.on("collaboration:user-joined", handleUserJoined);
    socket.on("collaboration:user-left", handleUserLeft);
    socket.on("collaboration:user-editing", handleUserEditing);
    socket.on("collaboration:user-stopped-editing", handleUserStoppedEditing);
    socket.on("collaboration:cursor-update", handleCursorUpdate);
    socket.on("collaboration:content-update", handleContentUpdate);
    socket.on("collaboration:comment-added", handleCommentAdded);
    socket.on("collaboration:comment-resolved", handleCommentResolved);
    socket.on("collaboration:version-saved", handleVersionSaved);
    socket.on("collaboration:settings-updated", handleSettingsUpdated);

    return () => {
      socket.emit("collaboration:leave", { sessionId });
      socket.off("collaboration:user-joined");
      socket.off("collaboration:user-left");
      socket.off("collaboration:user-editing");
      socket.off("collaboration:user-stopped-editing");
      socket.off("collaboration:cursor-update");
      socket.off("collaboration:content-update");
      socket.off("collaboration:comment-added");
      socket.off("collaboration:comment-resolved");
      socket.off("collaboration:version-saved");
      socket.off("collaboration:settings-updated");
    };
  }, [socket, isConnected, sessionId]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && session?.settings?.autoSave) {
      const interval = setInterval(() => {
        if (
          lastChangeRef.current &&
          Date.now() - lastChangeRef.current > 5000
        ) {
          saveProgress();
        }
      }, session?.settings?.autoSaveInterval || 30000);

      autoSaveRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [autoSaveEnabled, session]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/collaboration/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load collaboration session");
      }

      const data = await response.json();
      setSession(data.collaboration);
      setParticipants(data.collaboration.participants);
      setComments(data.collaboration.comments);

      if (data.collaboration.artifact) {
        setArtifactData(data.collaboration.artifact);
      }

      setLastSaved(new Date());
    } catch (error) {
      setError("Failed to load collaboration session");
      console.error("Error loading session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserJoined = (data) => {
    setParticipants((prev) => [...prev, data.user]);
    setSuccess(`${data.user.username} joined the session`);
  };

  const handleUserLeft = (data) => {
    setParticipants((prev) => prev.filter((p) => p.user._id !== data.userId));
    setEditingUsers((prev) => {
      const newMap = new Map(prev);
      newMap.delete(data.userId);
      return newMap;
    });
    setSuccess(`${data.username} left the session`);
  };

  const handleUserEditing = (data) => {
    setEditingUsers((prev) =>
      new Map(prev).set(data.userId, {
        username: data.username,
        field: data.field,
        timestamp: new Date(),
      }),
    );
  };

  const handleUserStoppedEditing = (data) => {
    setEditingUsers((prev) => {
      const newMap = new Map(prev);
      newMap.delete(data.userId);
      return newMap;
    });
  };

  const handleCursorUpdate = (data) => {
    setCursorPositions((prev) =>
      new Map(prev).set(data.userId, {
        position: data.position,
        field: data.field,
        timestamp: new Date(),
      }),
    );
  };

  const handleContentUpdate = (data) => {
    setArtifactData((prev) => ({
      ...prev,
      [data.field]: data.value,
    }));
    lastChangeRef.current = Date.now();
  };

  const handleCommentAdded = (data) => {
    setComments((prev) => [...prev, data.comment]);
  };

  const handleCommentResolved = (data) => {
    setComments((prev) =>
      prev.map((c) =>
        c._id === data.commentId ? { ...c, resolved: true } : c,
      ),
    );
  };

  const handleVersionSaved = (data) => {
    setLastSaved(new Date());
    setSuccess("Progress saved successfully");
  };

  const handleSettingsUpdated = (data) => {
    setSession((prev) => ({
      ...prev,
      settings: data.settings,
    }));
    setSuccess("Settings updated successfully");
  };

  const saveProgress = async (showNotification = true) => {
    try {
      setSaving(true);

      const response = await fetch(
        `/api/collaboration/sessions/${sessionId}/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            artifactData,
            version: session?.versionHistory?.length + 1,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save progress");
      }

      const data = await response.json();
      setLastSaved(new Date());

      if (showNotification) {
        setSuccess("Progress saved successfully");
      }

      // Emit save event to other participants
      if (socket && isConnected) {
        socket.emit("collaboration:version-saved", {
          sessionId,
          version: data.artifact.versionHistory?.length,
        });
      }
    } catch (error) {
      setError("Failed to save progress");
      console.error("Error saving progress:", error);
    } finally {
      setSaving(false);
    }
  };

  const publishArtifact = async () => {
    try {
      setSaving(true);

      const response = await fetch(
        `/api/collaboration/sessions/${sessionId}/publish`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to publish artifact");
      }

      const data = await response.json();
      setSuccess("Artifact published successfully!");

      if (onArtifactPublish) {
        onArtifactPublish(data.artifact);
      }
    } catch (error) {
      setError("Failed to publish artifact");
      console.error("Error publishing artifact:", error);
    } finally {
      setSaving(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(
        `/api/collaboration/sessions/${sessionId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            content: newComment,
            type: commentType,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const data = await response.json();
      setComments((prev) => [...prev, data.comment]);
      setNewComment("");

      // Emit comment event to other participants
      if (socket && isConnected) {
        socket.emit("collaboration:comment-added", {
          sessionId,
          comment: data.comment,
        });
      }
    } catch (error) {
      setError("Failed to add comment");
      console.error("Error adding comment:", error);
    }
  };

  const handleContentChange = (field, value) => {
    setArtifactData((prev) => ({
      ...prev,
      [field]: value,
    }));

    lastChangeRef.current = Date.now();

    // Emit content update to other participants
    if (socket && isConnected) {
      socket.emit("collaboration:content-update", {
        sessionId,
        field,
        value,
      });
    }
  };

  const handleFieldFocus = (field) => {
    if (socket && isConnected) {
      socket.emit("collaboration:user-editing", {
        sessionId,
        field,
      });
    }
  };

  const handleFieldBlur = () => {
    if (socket && isConnected) {
      socket.emit("collaboration:user-stopped-editing", {
        sessionId,
      });
    }
  };

  const getParticipantRole = (userId) => {
    if (session?.creator === userId) return "Owner";
    const participant = participants.find((p) => p.user._id === userId);
    return participant?.role || "Viewer";
  };

  const canEdit = () => {
    if (!session || !user) return false;
    if (session.creator === user._id) return true;
    const participant = participants.find((p) => p.user._id === user._id);
    return participant?.role === "editor" || participant?.role === "owner";
  };

  const canPublish = () => {
    return session?.creator === user._id;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return (
      <Alert severity="error">
        Collaboration session not found or you don't have access to it.
      </Alert>
    );
  }

  return (
    <Box className="collaboration-engine">
      {/* Header */}
      <Paper className="collaboration-header" elevation={2}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" component="h1">
              {session.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {session.description}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            {/* Connection status */}
            <Chip
              icon={isConnected ? <CheckCircleIcon /> : <WarningIcon />}
              label={isConnected ? "Connected" : "Disconnected"}
              color={isConnected ? "success" : "warning"}
              size="small"
            />

            {/* Participants count */}
            <Tooltip title="View participants">
              <IconButton onClick={() => setShowParticipants(true)}>
                <Badge badgeContent={participants.length} color="primary">
                  <PeopleIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Comments count */}
            <Tooltip title="View comments">
              <IconButton onClick={() => setActiveTab(2)}>
                <Badge badgeContent={comments.length} color="secondary">
                  <ChatIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Settings */}
            <Tooltip title="Session settings">
              <IconButton onClick={() => setShowSettings(true)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            {/* More options */}
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Action buttons */}
        <Box display="flex" gap={2} mt={2}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveProgress}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Progress"}
          </Button>

          {canPublish() && (
            <Button
              variant="outlined"
              startIcon={<PublishIcon />}
              onClick={publishArtifact}
              disabled={saving}
            >
              Publish Artifact
            </Button>
          )}

          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={() => setShowParticipants(true)}
          >
            Invite Participants
          </Button>
        </Box>
      </Paper>

      {/* Main content */}
      <Box className="collaboration-content">
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
        >
          <Tab label="Editor" icon={<EditIcon />} />
          <Tab label="Comments" icon={<ChatIcon />} />
          <Tab label="History" icon={<HistoryIcon />} />
        </Tabs>

        {/* Editor Tab */}
        {activeTab === 0 && (
          <Box className="editor-tab">
            <Paper className="artifact-form" elevation={1}>
              <Typography variant="h6" gutterBottom>
                Artifact Details
              </Typography>

              <TextField
                fullWidth
                label="Name"
                value={artifactData.name}
                onChange={(e) => handleContentChange("name", e.target.value)}
                onFocus={() => handleFieldFocus("name")}
                onBlur={handleFieldBlur}
                disabled={!canEdit()}
                margin="normal"
              />

              <TextField
                fullWidth
                label="Description"
                value={artifactData.description}
                onChange={(e) =>
                  handleContentChange("description", e.target.value)
                }
                onFocus={() => handleFieldFocus("description")}
                onBlur={handleFieldBlur}
                disabled={!canEdit()}
                multiline
                rows={3}
                margin="normal"
              />

              <TextField
                fullWidth
                label="Content"
                value={artifactData.content}
                onChange={(e) => handleContentChange("content", e.target.value)}
                onFocus={() => handleFieldFocus("content")}
                onBlur={handleFieldBlur}
                disabled={!canEdit()}
                multiline
                rows={8}
                margin="normal"
                ref={contentRef}
              />
            </Paper>

            {/* Editing indicators */}
            {editingUsers.size > 0 && (
              <Paper className="editing-indicators" elevation={1}>
                <Typography variant="subtitle2" gutterBottom>
                  Currently Editing:
                </Typography>
                {Array.from(editingUsers.entries()).map(([userId, data]) => (
                  <Chip
                    key={userId}
                    label={`${data.username} - ${data.field}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    className="editing-chip"
                  />
                ))}
              </Paper>
            )}
          </Box>
        )}

        {/* Comments Tab */}
        {activeTab === 1 && (
          <Box className="comments-tab">
            <Paper className="comments-section" elevation={1}>
              <Typography variant="h6" gutterBottom>
                Comments & Feedback
              </Typography>

              {/* Add comment */}
              <Box display="flex" gap={2} mb={3}>
                <TextField
                  fullWidth
                  label="Add a comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  multiline
                  rows={2}
                />
                <TextField
                  select
                  label="Type"
                  value={commentType}
                  onChange={(e) => setCommentType(e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="suggestion">Suggestion</MenuItem>
                  <MenuItem value="question">Question</MenuItem>
                  <MenuItem value="review">Review</MenuItem>
                  <MenuItem value="feedback">Feedback</MenuItem>
                </TextField>
                <IconButton onClick={addComment} color="primary">
                  <SendIcon />
                </IconButton>
              </Box>

              {/* Comments list */}
              <List>
                {comments.map((comment) => (
                  <ListItem key={comment._id} alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar>{comment.user.username[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2">
                            {comment.user.username}
                          </Typography>
                          <Chip
                            label={comment.type}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {comment.resolved && (
                            <Chip
                              label="Resolved"
                              size="small"
                              color="success"
                              icon={<CheckCircleIcon />}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2">
                            {comment.content}
                          </Typography>
                          <Typography
                            variant="caption"
                            display="block"
                            color="textSecondary"
                          >
                            {new Date(comment.timestamp).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        )}

        {/* History Tab */}
        {activeTab === 2 && (
          <Box className="history-tab">
            <Paper className="version-history" elevation={1}>
              <Typography variant="h6" gutterBottom>
                Version History
              </Typography>

              {session.versionHistory?.length > 0 ? (
                <List>
                  {session.versionHistory.map((version) => (
                    <ListItem key={version.version}>
                      <ListItemText
                        primary={`Version ${version.version}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {version.changes}
                            </Typography>
                            <Typography
                              variant="caption"
                              display="block"
                              color="textSecondary"
                            >
                              Saved by {version.savedBy.username} on{" "}
                              {new Date(version.timestamp).toLocaleString()}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No version history available yet.
                </Typography>
              )}
            </Paper>
          </Box>
        )}
      </Box>

      {/* Participants Dialog */}
      <Dialog
        open={showParticipants}
        onClose={() => setShowParticipants(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Session Participants</DialogTitle>
        <DialogContent>
          <List>
            {participants.map((participant) => (
              <ListItem key={participant.user._id}>
                <ListItemAvatar>
                  <Avatar>{participant.user.username[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={participant.user.username}
                  secondary={`${participant.role} • Joined ${new Date(participant.joinedAt).toLocaleDateString()}`}
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={participant.role}
                    size="small"
                    color={participant.role === "owner" ? "primary" : "default"}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowParticipants(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Session Settings</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            Configure collaboration settings and permissions.
          </Typography>
          {/* Settings form would go here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* More Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setShowHistory(true)}>
          <HistoryIcon /> View History
        </MenuItem>
        <MenuItem onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}>
          {autoSaveEnabled ? <VisibilityOffIcon /> : <VisibilityIcon />}
          {autoSaveEnabled ? "Disable" : "Enable"} Auto-save
        </MenuItem>
      </Menu>

      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CollaborationEngine;
