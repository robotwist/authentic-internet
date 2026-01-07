import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  Slider,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Collapse,
  Divider,
  Autocomplete,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  FilterList,
  Clear,
  TrendingUp,
  Star,
  AccessTime,
  Person,
  Category,
  LocationOn,
  ExpandMore,
  ExpandLess,
  Save,
  Refresh,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import "./AdvancedSearch.css";

const AdvancedSearch = ({
  artifacts,
  onSearchResults,
  onSearchChange,
  loading = false,
  showAdvanced = false,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    type: "all",
    area: "all",
    creator: "all",
    rating: [0, 5],
    difficulty: "all",
    tags: [],
    dateRange: "all",
    sortBy: "relevance",
    sortOrder: "desc",
    showCollected: true,
    showUncollected: true,
    showMyArtifacts: false,
    showOthersArtifacts: true,
  });
  const [showFilters, setShowFilters] = useState(showAdvanced);
  const [savedSearches, setSavedSearches] = useState([]);
  const [currentSavedSearch, setCurrentSavedSearch] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    if (!artifacts || artifacts.length === 0) {
      return {
        types: [],
        areas: [],
        creators: [],
        tags: [],
        difficulties: [],
      };
    }

    const types = [...new Set(artifacts.map((a) => a.type).filter(Boolean))];
    const areas = [...new Set(artifacts.map((a) => a.area).filter(Boolean))];
    const creators = [
      ...new Set(artifacts.map((a) => a.createdBy).filter(Boolean)),
    ];
    const tags = [
      ...new Set(artifacts.flatMap((a) => a.tags || []).filter(Boolean)),
    ];
    const difficulties = ["beginner", "intermediate", "advanced"];

    return {
      types: types.sort(),
      areas: areas.sort(),
      creators: creators.sort(),
      tags: tags.sort(),
      difficulties,
    };
  }, [artifacts]);

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("savedSearches");
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading saved searches:", error);
      }
    }

    const history = localStorage.getItem("searchHistory");
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (error) {
        console.error("Error loading search history:", error);
      }
    }
  }, []);

  // Perform search with current query and filters
  const performSearch = useCallback(() => {
    if (!artifacts) return [];

    let results = [...artifacts];

    // Text search (semantic search across multiple fields)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter((artifact) => {
        const searchableText = [
          artifact.name,
          artifact.description,
          artifact.content,
          artifact.type,
          artifact.area,
          artifact.createdBy,
          ...(artifact.tags || []),
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    // Type filter
    if (filters.type !== "all") {
      results = results.filter((artifact) => artifact.type === filters.type);
    }

    // Area filter
    if (filters.area !== "all") {
      results = results.filter((artifact) => artifact.area === filters.area);
    }

    // Creator filter
    if (filters.creator !== "all") {
      results = results.filter(
        (artifact) => artifact.createdBy === filters.creator,
      );
    }

    // Rating filter
    results = results.filter((artifact) => {
      const rating = artifact.rating || 0;
      return rating >= filters.rating[0] && rating <= filters.rating[1];
    });

    // Difficulty filter
    if (filters.difficulty !== "all") {
      results = results.filter((artifact) => {
        const exp = artifact.exp || 0;
        switch (filters.difficulty) {
          case "beginner":
            return exp <= 20;
          case "intermediate":
            return exp > 20 && exp <= 50;
          case "advanced":
            return exp > 50;
          default:
            return true;
        }
      });
    }

    // Tags filter
    if (filters.tags.length > 0) {
      results = results.filter((artifact) =>
        filters.tags.some((tag) => (artifact.tags || []).includes(tag)),
      );
    }

    // Date range filter
    if (filters.dateRange !== "all") {
      const now = new Date();
      const cutoffDate = new Date();

      switch (filters.dateRange) {
        case "today":
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      results = results.filter((artifact) => {
        const artifactDate = new Date(artifact.createdAt || artifact.updatedAt);
        return artifactDate >= cutoffDate;
      });
    }

    // Collection status filter
    if (!filters.showCollected || !filters.showUncollected) {
      const collectedArtifacts = JSON.parse(
        localStorage.getItem("collectedArtifacts") || "[]",
      );
      results = results.filter((artifact) => {
        const isCollected = collectedArtifacts.includes(
          artifact.id || artifact._id,
        );
        return (
          (filters.showCollected && isCollected) ||
          (filters.showUncollected && !isCollected)
        );
      });
    }

    // User artifacts filter
    if (!filters.showMyArtifacts || !filters.showOthersArtifacts) {
      results = results.filter((artifact) => {
        const isMyArtifact = artifact.createdBy === user?.id;
        return (
          (filters.showMyArtifacts && isMyArtifact) ||
          (filters.showOthersArtifacts && !isMyArtifact)
        );
      });
    }

    // Sort results
    results.sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case "name":
          aValue = a.name || "";
          bValue = b.name || "";
          break;
        case "rating":
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case "exp":
          aValue = a.exp || 0;
          bValue = b.exp || 0;
          break;
        case "created":
          aValue = new Date(a.createdAt || a.updatedAt);
          bValue = new Date(b.createdAt || b.updatedAt);
          break;
        case "updated":
          aValue = new Date(a.updatedAt || a.createdAt);
          bValue = new Date(b.updatedAt || b.createdAt);
          break;
        case "relevance":
        default:
          // Relevance is based on search query match strength
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const aScore = calculateRelevanceScore(a, query);
            const bScore = calculateRelevanceScore(b, query);
            aValue = aScore;
            bValue = bScore;
          } else {
            aValue = a.rating || 0;
            bValue = b.rating || 0;
          }
          break;
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return results;
  }, [artifacts, searchQuery, filters, user]);

  // Calculate relevance score for semantic search
  const calculateRelevanceScore = (artifact, query) => {
    let score = 0;
    const queryWords = query.split(" ");

    // Name matches get highest weight
    if (artifact.name && artifact.name.toLowerCase().includes(query)) {
      score += 100;
    }

    // Description matches
    if (
      artifact.description &&
      artifact.description.toLowerCase().includes(query)
    ) {
      score += 50;
    }

    // Content matches
    if (artifact.content && artifact.content.toLowerCase().includes(query)) {
      score += 30;
    }

    // Tag matches
    if (artifact.tags) {
      queryWords.forEach((word) => {
        if (artifact.tags.some((tag) => tag.toLowerCase().includes(word))) {
          score += 20;
        }
      });
    }

    // Type and area matches
    if (artifact.type && artifact.type.toLowerCase().includes(query)) {
      score += 15;
    }
    if (artifact.area && artifact.area.toLowerCase().includes(query)) {
      score += 15;
    }

    // Creator matches
    if (
      artifact.createdBy &&
      artifact.createdBy.toLowerCase().includes(query)
    ) {
      score += 10;
    }

    return score;
  };

  // Update search results when search changes
  useEffect(() => {
    const results = performSearch();
    onSearchResults?.(results);
    onSearchChange?.({ query: searchQuery, filters, results });
  }, [performSearch, onSearchResults, onSearchChange]);

  // Save search to history
  const saveToHistory = useCallback(() => {
    if (
      !searchQuery.trim() &&
      Object.values(filters).every(
        (v) =>
          v === "all" ||
          (Array.isArray(v) && v.length === 0) ||
          (typeof v === "boolean" && v === true),
      )
    ) {
      return; // Don't save empty searches
    }

    const searchEntry = {
      id: Date.now(),
      query: searchQuery,
      filters: { ...filters },
      timestamp: new Date().toISOString(),
      resultCount: performSearch().length,
    };

    const newHistory = [
      searchEntry,
      ...searchHistory.filter(
        (h) =>
          h.query !== searchQuery ||
          JSON.stringify(h.filters) !== JSON.stringify(filters),
      ),
    ].slice(0, 10); // Keep only last 10 searches

    setSearchHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  }, [searchQuery, filters, searchHistory, performSearch]);

  // Save current search
  const saveSearch = () => {
    if (!searchQuery.trim()) {
      alert("Please enter a search query to save");
      return;
    }

    const searchName = prompt("Enter a name for this search:");
    if (!searchName) return;

    const savedSearch = {
      id: Date.now(),
      name: searchName,
      query: searchQuery,
      filters: { ...filters },
      timestamp: new Date().toISOString(),
    };

    const newSavedSearches = [...savedSearches, savedSearch];
    setSavedSearches(newSavedSearches);
    localStorage.setItem("savedSearches", JSON.stringify(newSavedSearches));
  };

  // Load saved search
  const loadSavedSearch = (savedSearch) => {
    setSearchQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    setCurrentSavedSearch(savedSearch);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilters({
      type: "all",
      area: "all",
      creator: "all",
      rating: [0, 5],
      difficulty: "all",
      tags: [],
      dateRange: "all",
      sortBy: "relevance",
      sortOrder: "desc",
      showCollected: true,
      showUncollected: true,
      showMyArtifacts: false,
      showOthersArtifacts: true,
    });
    setCurrentSavedSearch(null);
  };

  // Update filter
  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Box className="advanced-search">
      {/* Search Bar */}
      <Card className="search-bar-card">
        <CardContent>
          <Box className="search-input-container">
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search artifacts by name, description, content, tags, creator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  saveToHistory();
                }
              }}
              InputProps={{
                startAdornment: <Search className="search-icon" />,
                endAdornment: (
                  <Box className="search-actions">
                    {loading && <CircularProgress size={20} />}
                    <IconButton onClick={() => setShowFilters(!showFilters)}>
                      {showFilters ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                    <IconButton onClick={clearFilters}>
                      <Clear />
                    </IconButton>
                  </Box>
                ),
              }}
              className="search-input"
            />
          </Box>

          {/* Quick Stats */}
          <Box className="search-stats">
            <Typography variant="body2" color="textSecondary">
              {performSearch().length} results
              {searchQuery && ` for "${searchQuery}"`}
            </Typography>
            <Box className="search-actions">
              <Button
                size="small"
                startIcon={<Save />}
                onClick={saveSearch}
                disabled={!searchQuery.trim()}
              >
                Save Search
              </Button>
              <Button
                size="small"
                startIcon={<Refresh />}
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <Collapse in={showFilters}>
        <Card className="filters-card">
          <CardContent>
            <Grid container spacing={3}>
              {/* Basic Filters */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" className="filter-section-title">
                  <FilterList /> Basic Filters
                </Typography>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type}
                    onChange={(e) => updateFilter("type", e.target.value)}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    {filterOptions.types.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Area</InputLabel>
                  <Select
                    value={filters.area}
                    onChange={(e) => updateFilter("area", e.target.value)}
                  >
                    <MenuItem value="all">All Areas</MenuItem>
                    {filterOptions.areas.map((area) => (
                      <MenuItem key={area} value={area}>
                        {area}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Creator</InputLabel>
                  <Select
                    value={filters.creator}
                    onChange={(e) => updateFilter("creator", e.target.value)}
                  >
                    <MenuItem value="all">All Creators</MenuItem>
                    {filterOptions.creators.map((creator) => (
                      <MenuItem key={creator} value={creator}>
                        {creator}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Difficulty</InputLabel>
                  <Select
                    value={filters.difficulty}
                    onChange={(e) => updateFilter("difficulty", e.target.value)}
                  >
                    <MenuItem value="all">All Difficulties</MenuItem>
                    {filterOptions.difficulties.map((difficulty) => (
                      <MenuItem key={difficulty} value={difficulty}>
                        {difficulty.charAt(0).toUpperCase() +
                          difficulty.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Advanced Filters */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" className="filter-section-title">
                  <Star /> Advanced Filters
                </Typography>

                <Box margin="normal">
                  <Typography gutterBottom>Rating Range</Typography>
                  <Slider
                    value={filters.rating}
                    onChange={(e, newValue) => updateFilter("rating", newValue)}
                    valueLabelDisplay="auto"
                    min={0}
                    max={5}
                    step={0.1}
                    marks={[
                      { value: 0, label: "0" },
                      { value: 5, label: "5" },
                    ]}
                  />
                </Box>

                <Autocomplete
                  multiple
                  options={filterOptions.tags}
                  value={filters.tags}
                  onChange={(e, newValue) => updateFilter("tags", newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tags"
                      margin="normal"
                      fullWidth
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                      />
                    ))
                  }
                />

                <FormControl fullWidth margin="normal">
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={filters.dateRange}
                    onChange={(e) => updateFilter("dateRange", e.target.value)}
                  >
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="week">Last Week</MenuItem>
                    <MenuItem value="month">Last Month</MenuItem>
                    <MenuItem value="year">Last Year</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={filters.sortBy}
                    onChange={(e) => updateFilter("sortBy", e.target.value)}
                  >
                    <MenuItem value="relevance">Relevance</MenuItem>
                    <MenuItem value="name">Name</MenuItem>
                    <MenuItem value="rating">Rating</MenuItem>
                    <MenuItem value="exp">Experience Points</MenuItem>
                    <MenuItem value="created">Date Created</MenuItem>
                    <MenuItem value="updated">Date Updated</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Sort Order</InputLabel>
                  <Select
                    value={filters.sortOrder}
                    onChange={(e) => updateFilter("sortOrder", e.target.value)}
                  >
                    <MenuItem value="desc">Descending</MenuItem>
                    <MenuItem value="asc">Ascending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Visibility Filters */}
              <Grid item xs={12}>
                <Divider />
                <Typography variant="h6" className="filter-section-title">
                  <Visibility /> Visibility Options
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={filters.showCollected}
                          onChange={(e) =>
                            updateFilter("showCollected", e.target.checked)
                          }
                        />
                      }
                      label="Show Collected Artifacts"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={filters.showUncollected}
                          onChange={(e) =>
                            updateFilter("showUncollected", e.target.checked)
                          }
                        />
                      }
                      label="Show Uncollected Artifacts"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={filters.showMyArtifacts}
                          onChange={(e) =>
                            updateFilter("showMyArtifacts", e.target.checked)
                          }
                        />
                      }
                      label="Show My Artifacts"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={filters.showOthersArtifacts}
                          onChange={(e) =>
                            updateFilter(
                              "showOthersArtifacts",
                              e.target.checked,
                            )
                          }
                        />
                      }
                      label="Show Others' Artifacts"
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Collapse>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <Card className="saved-searches-card">
          <CardContent>
            <Typography variant="h6" className="filter-section-title">
              <Save /> Saved Searches
            </Typography>
            <Box className="saved-searches-list">
              {savedSearches.map((search) => (
                <Chip
                  key={search.id}
                  label={search.name}
                  onClick={() => loadSavedSearch(search)}
                  className={
                    currentSavedSearch?.id === search.id ? "active" : ""
                  }
                  deleteIcon={<Clear />}
                  onDelete={() => {
                    const newSavedSearches = savedSearches.filter(
                      (s) => s.id !== search.id,
                    );
                    setSavedSearches(newSavedSearches);
                    localStorage.setItem(
                      "savedSearches",
                      JSON.stringify(newSavedSearches),
                    );
                  }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && (
        <Card className="search-history-card">
          <CardContent>
            <Typography variant="h6" className="filter-section-title">
              <AccessTime /> Recent Searches
            </Typography>
            <Box className="search-history-list">
              {searchHistory.slice(0, 5).map((search) => (
                <Chip
                  key={search.id}
                  label={`${search.query || "No query"} (${search.resultCount} results)`}
                  onClick={() => {
                    setSearchQuery(search.query);
                    setFilters(search.filters);
                  }}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AdvancedSearch;
