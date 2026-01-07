import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tabs,
  Tab,
  Badge,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import CollaborationEngine from "../components/CollaborationEngine";
import collaborationAPI from "../api/collaboration";
import "./CollaborationPage.css";

const CollaborationPage = () => {
  const { user } = useAuth();

  // State management
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSession, setSelectedSession] = useState(null);

  // UI state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSessionForMenu, setSelectedSessionForMenu] = useState(null);

  // Form state
  const [newSessionData, setNewSessionData] = useState({
    name: "",
    description: "",
    artifactType: "GAME",
    settings: {
      allowComments: true,
      allowEditing: true,
      requireApproval: false,
      maxParticipants: 10,
      autoSave: true,
      autoSaveInterval: 30000,
      conflictResolution: "last-writer-wins",
    },
  });

  const [joinSessionData, setJoinSessionData] = useState({
    sessionId: "",
    role: "editor",
  });

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("lastActivity");

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await collaborationAPI.getSessions();
      setSessions(response.collaborations || []);
    } catch (error) {
      setError("Failed to load collaboration sessions");
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    try {
      const response = await collaborationAPI.createSession(newSessionData);
      setSessions((prev) => [response.collaboration, ...prev]);
      setShowCreateDialog(false);
      setNewSessionData({
        name: "",
        description: "",
        artifactType: "GAME",
        settings: {
          allowComments: true,
          allowEditing: true,
          requireApproval: false,
          maxParticipants: 10,
          autoSave: true,
          autoSaveInterval: 30000,
          conflictResolution: "last-writer-wins",
        },
      });
      setSuccess("Collaboration session created successfully!");
    } catch (error) {
      setError("Failed to create collaboration session");
      console.error("Error creating session:", error);
    }
  };

  const joinSession = async () => {
    try {
      const response = await collaborationAPI.joinSession(
        joinSessionData.sessionId,
        joinSessionData.role,
      );
      setSessions((prev) => [response.collaboration, ...prev]);
      setShowJoinDialog(false);
      setJoinSessionData({ sessionId: "", role: "editor" });
      setSuccess("Joined collaboration session successfully!");
    } catch (error) {
      setError("Failed to join collaboration session");
      console.error("Error joining session:", error);
    }
  };

  const leaveSession = async (sessionId) => {
    try {
      await collaborationAPI.leaveSession(sessionId);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      setSuccess("Left collaboration session successfully");
    } catch (error) {
      setError("Failed to leave collaboration session");
      console.error("Error leaving session:", error);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await collaborationAPI.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      setSuccess("Collaboration session deleted successfully");
    } catch (error) {
      setError("Failed to delete collaboration session");
      console.error("Error deleting session:", error);
    }
  };

  const openSession = (session) => {
    setSelectedSession(session);
    setActiveTab(1);
  };

  const getParticipantRole = (session) => {
    if (session.creator === user._id) return "Owner";
    const participant = session.participants.find(
      (p) => p.user._id === user._id,
    );
    return participant?.role || "Viewer";
  };

  const canEdit = (session) => {
    if (session.creator === user._id) return true;
    const participant = session.participants.find(
      (p) => p.user._id === user._id,
    );
    return participant?.role === "editor" || participant?.role === "owner";
  };

  const canDelete = (session) => {
    return session.creator === user._id;
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || session.status === statusFilter;
    const matchesType =
      typeFilter === "all" || session.artifactType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "createdAt":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "lastActivity":
        return new Date(b.lastActivity) - new Date(a.lastActivity);
      case "participants":
        return b.participants.length - a.participants.length;
      default:
        return new Date(b.lastActivity) - new Date(a.lastActivity);
    }
  });

  const handleMenuOpen = (event, session) => {
    setAnchorEl(event.currentTarget);
    setSelectedSessionForMenu(session);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSessionForMenu(null);
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

  return (
    <Box className="collaboration-page">
      {/* Header */}
      <Paper className="collaboration-header" elevation={2}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" component="h1">
              Collaboration Hub
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Create, join, and manage collaborative artifact creation sessions
            </Typography>
          </Box>

          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateDialog(true)}
            >
              Create Session
            </Button>
            <Button
              variant="contained"
              startIcon={<PeopleIcon />}
              onClick={() => setShowJoinDialog(true)}
            >
              Join Session
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box className="collaboration-content">
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
        >
          <Tab label="My Sessions" />
          <Tab label="Active Session" disabled={!selectedSession} />
        </Tabs>

        {/* Sessions List Tab */}
        {activeTab === 0 && (
          <Box className="sessions-tab">
            {/* Filters and Search */}
            <Paper className="filters-section" elevation={1}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search sessions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="paused">Paused</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      label="Type"
                    >
                      <MenuItem value="all">All Types</MenuItem>
                      <MenuItem value="GAME">Game</MenuItem>
                      <MenuItem value="STORY">Story</MenuItem>
                      <MenuItem value="PUZZLE">Puzzle</MenuItem>
                      <MenuItem value="MUSIC">Music</MenuItem>
                      <MenuItem value="ART">Art</MenuItem>
                      <MenuItem value="EXPERIENCE">Experience</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      label="Sort By"
                    >
                      <MenuItem value="lastActivity">Last Activity</MenuItem>
                      <MenuItem value="name">Name</MenuItem>
                      <MenuItem value="createdAt">Created</MenuItem>
                      <MenuItem value="participants">Participants</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* Sessions Grid */}
            <Grid container spacing={3} className="sessions-grid">
              {sortedSessions.map((session) => (
                <Grid item xs={12} md={6} lg={4} key={session._id}>
                  <Card className="session-card">
                    <CardContent>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        mb={2}
                      >
                        <Typography variant="h6" component="h3">
                          {session.name}
                        </Typography>
                        <IconButton onClick={(e) => handleMenuOpen(e, session)}>
                          <MoreVertIcon />
                        </IconButton>
                      </Box>

                      <Typography variant="body2" color="textSecondary" mb={2}>
                        {session.description}
                      </Typography>

                      <Box display="flex" gap={1} mb={2}>
                        <Chip
                          label={session.artifactType}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={session.status}
                          size="small"
                          color={
                            session.status === "active" ? "success" : "default"
                          }
                        />
                        <Chip
                          label={getParticipantRole(session)}
                          size="small"
                          color={
                            getParticipantRole(session) === "Owner"
                              ? "primary"
                              : "default"
                          }
                        />
                      </Box>

                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PeopleIcon fontSize="small" />
                          <Typography variant="body2">
                            {session.participants.length} participants
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ScheduleIcon fontSize="small" />
                          <Typography variant="body2">
                            {new Date(
                              session.lastActivity,
                            ).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>

                      {session.artifact && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <CheckCircleIcon fontSize="small" color="success" />
                          <Typography variant="body2" color="success.main">
                            Artifact created
                          </Typography>
                        </Box>
                      )}
                    </CardContent>

                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => openSession(session)}
                        disabled={!canEdit(session)}
                      >
                        Open
                      </Button>
                      <Button
                        size="small"
                        startIcon={<ShareIcon />}
                        onClick={() => setShowSessionDetails(true)}
                      >
                        Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {sortedSessions.length === 0 && (
              <Paper className="empty-state" elevation={1}>
                <Typography variant="h6" align="center" gutterBottom>
                  No collaboration sessions found
                </Typography>
                <Typography
                  variant="body2"
                  align="center"
                  color="textSecondary"
                >
                  Create a new session or join an existing one to get started
                </Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* Active Session Tab */}
        {activeTab === 1 && selectedSession && (
          <Box className="active-session-tab">
            <CollaborationEngine
              sessionId={selectedSession._id}
              onSessionUpdate={(updatedSession) => {
                setSessions((prev) =>
                  prev.map((s) =>
                    s._id === updatedSession._id ? updatedSession : s,
                  ),
                );
                setSelectedSession(updatedSession);
              }}
              onArtifactPublish={(artifact) => {
                setSuccess("Artifact published successfully!");
                setActiveTab(0);
                setSelectedSession(null);
              }}
            />
          </Box>
        )}
      </Box>

      {/* Create Session Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Collaboration Session</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Session Name"
                value={newSessionData.name}
                onChange={(e) =>
                  setNewSessionData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newSessionData.description}
                onChange={(e) =>
                  setNewSessionData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Artifact Type</InputLabel>
                <Select
                  value={newSessionData.artifactType}
                  onChange={(e) =>
                    setNewSessionData((prev) => ({
                      ...prev,
                      artifactType: e.target.value,
                    }))
                  }
                  label="Artifact Type"
                >
                  <MenuItem value="GAME">Game</MenuItem>
                  <MenuItem value="STORY">Story</MenuItem>
                  <MenuItem value="PUZZLE">Puzzle</MenuItem>
                  <MenuItem value="MUSIC">Music</MenuItem>
                  <MenuItem value="ART">Art</MenuItem>
                  <MenuItem value="EXPERIENCE">Experience</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Max Participants</InputLabel>
                <Select
                  value={newSessionData.settings.maxParticipants}
                  onChange={(e) =>
                    setNewSessionData((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        maxParticipants: e.target.value,
                      },
                    }))
                  }
                  label="Max Participants"
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newSessionData.settings.allowComments}
                    onChange={(e) =>
                      setNewSessionData((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          allowComments: e.target.checked,
                        },
                      }))
                    }
                  />
                }
                label="Allow Comments"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newSessionData.settings.allowEditing}
                    onChange={(e) =>
                      setNewSessionData((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          allowEditing: e.target.checked,
                        },
                      }))
                    }
                  />
                }
                label="Allow Editing"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={createSession}
            variant="contained"
            disabled={!newSessionData.name}
          >
            Create Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Join Session Dialog */}
      <Dialog
        open={showJoinDialog}
        onClose={() => setShowJoinDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Join Collaboration Session</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Session ID"
                value={joinSessionData.sessionId}
                onChange={(e) =>
                  setJoinSessionData((prev) => ({
                    ...prev,
                    sessionId: e.target.value,
                  }))
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={joinSessionData.role}
                  onChange={(e) =>
                    setJoinSessionData((prev) => ({
                      ...prev,
                      role: e.target.value,
                    }))
                  }
                  label="Role"
                >
                  <MenuItem value="editor">Editor</MenuItem>
                  <MenuItem value="viewer">Viewer</MenuItem>
                  <MenuItem value="commenter">Commenter</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowJoinDialog(false)}>Cancel</Button>
          <Button
            onClick={joinSession}
            variant="contained"
            disabled={!joinSessionData.sessionId}
          >
            Join Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Session Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (selectedSessionForMenu) {
              openSession(selectedSessionForMenu);
              handleMenuClose();
            }
          }}
        >
          <EditIcon /> Open Session
        </MenuItem>
        <MenuItem
          onClick={() => {
            setShowSessionDetails(true);
            handleMenuClose();
          }}
        >
          <VisibilityIcon /> View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedSessionForMenu) {
              leaveSession(selectedSessionForMenu._id);
              handleMenuClose();
            }
          }}
        >
          <PeopleIcon /> Leave Session
        </MenuItem>
        {selectedSessionForMenu && canDelete(selectedSessionForMenu) && (
          <MenuItem
            onClick={() => {
              if (selectedSessionForMenu) {
                deleteSession(selectedSessionForMenu._id);
                handleMenuClose();
              }
            }}
          >
            <DeleteIcon /> Delete Session
          </MenuItem>
        )}
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

export default CollaborationPage;
