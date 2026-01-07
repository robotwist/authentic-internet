import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  Timeline,
  People,
  Visibility,
  Star,
  AccessTime,
  Category,
  LocationOn,
  Download,
  Refresh,
  CalendarToday,
  Analytics,
  Insights,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./AnalyticsDashboard.css";

const AnalyticsDashboard = ({ artifacts, loading = false }) => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetrics, setSelectedMetrics] = useState([
    "engagement",
    "creation",
    "discovery",
  ]);
  const [viewMode, setViewMode] = useState("overview");
  const [refreshKey, setRefreshKey] = useState(0);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!artifacts || artifacts.length === 0) {
      return {
        overview: {},
        trends: [],
        topContent: [],
        userBehavior: {},
        contentPerformance: {},
        geographicData: [],
        categoryBreakdown: [],
      };
    }

    const now = new Date();
    const timeRanges = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365,
    };

    const daysBack = timeRanges[timeRange] || 30;
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Filter artifacts within time range
    const recentArtifacts = artifacts.filter((artifact) => {
      const artifactDate = new Date(artifact.createdAt || artifact.updatedAt);
      return artifactDate >= cutoffDate;
    });

    // Overview metrics
    const overview = {
      totalArtifacts: artifacts.length,
      recentArtifacts: recentArtifacts.length,
      totalCreators: new Set(artifacts.map((a) => a.createdBy).filter(Boolean))
        .size,
      activeCreators: new Set(
        recentArtifacts.map((a) => a.createdBy).filter(Boolean),
      ).size,
      averageRating:
        artifacts.reduce((sum, a) => sum + (a.rating || 0), 0) /
          artifacts.length || 0,
      totalViews: artifacts.reduce((sum, a) => sum + (a.viewCount || 0), 0),
      totalReviews: artifacts.reduce(
        (sum, a) => sum + (a.reviews?.length || 0),
        0,
      ),
    };

    // Trends data
    const trends = calculateTrends(artifacts, daysBack);

    // Top performing content
    const topContent = artifacts
      .map((artifact) => ({
        ...artifact,
        performanceScore: calculatePerformanceScore(artifact),
      }))
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 10);

    // User behavior analysis
    const userBehavior = analyzeUserBehavior(artifacts);

    // Content performance by type
    const contentPerformance = analyzeContentPerformance(artifacts);

    // Geographic data
    const geographicData = analyzeGeographicData(artifacts);

    // Category breakdown
    const categoryBreakdown = analyzeCategoryBreakdown(artifacts);

    return {
      overview,
      trends,
      topContent,
      userBehavior,
      contentPerformance,
      geographicData,
      categoryBreakdown,
    };
  }, [artifacts, timeRange, refreshKey]);

  // Calculate trends over time
  const calculateTrends = (artifacts, daysBack) => {
    const trends = [];
    const now = new Date();

    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayArtifacts = artifacts.filter((artifact) => {
        const artifactDate = new Date(artifact.createdAt || artifact.updatedAt);
        return artifactDate >= dayStart && artifactDate < dayEnd;
      });

      trends.push({
        date: date.toISOString().split("T")[0],
        artifacts: dayArtifacts.length,
        creators: new Set(dayArtifacts.map((a) => a.createdBy).filter(Boolean))
          .size,
        averageRating:
          dayArtifacts.length > 0
            ? dayArtifacts.reduce((sum, a) => sum + (a.rating || 0), 0) /
              dayArtifacts.length
            : 0,
        totalViews: dayArtifacts.reduce(
          (sum, a) => sum + (a.viewCount || 0),
          0,
        ),
      });
    }

    return trends;
  };

  // Calculate performance score for content
  const calculatePerformanceScore = (artifact) => {
    let score = 0;

    // Rating contribution
    score += (artifact.rating || 0) * 20;

    // Review count contribution
    score += (artifact.reviews?.length || 0) * 10;

    // View count contribution
    score += (artifact.viewCount || 0) * 0.1;

    // Recency bonus
    const createdAt = new Date(artifact.createdAt || artifact.updatedAt);
    const daysSinceCreation =
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation <= 7) score += 50;
    else if (daysSinceCreation <= 30) score += 25;

    // Creator reputation bonus
    if (artifact.creatorReputation) {
      score += artifact.creatorReputation * 5;
    }

    return score;
  };

  // Analyze user behavior
  const analyzeUserBehavior = (artifacts) => {
    const behavior = {
      preferredTypes: {},
      preferredAreas: {},
      preferredCreators: {},
      averageSessionDuration: 0,
      bounceRate: 0,
      returnRate: 0,
    };

    // Type preferences
    artifacts.forEach((artifact) => {
      if (artifact.type) {
        behavior.preferredTypes[artifact.type] =
          (behavior.preferredTypes[artifact.type] || 0) + 1;
      }
    });

    // Area preferences
    artifacts.forEach((artifact) => {
      if (artifact.area) {
        behavior.preferredAreas[artifact.area] =
          (behavior.preferredAreas[artifact.area] || 0) + 1;
      }
    });

    // Creator preferences
    artifacts.forEach((artifact) => {
      if (artifact.createdBy) {
        behavior.preferredCreators[artifact.createdBy] =
          (behavior.preferredCreators[artifact.createdBy] || 0) + 1;
      }
    });

    return behavior;
  };

  // Analyze content performance by type
  const analyzeContentPerformance = (artifacts) => {
    const performance = {};

    artifacts.forEach((artifact) => {
      if (!artifact.type) return;

      if (!performance[artifact.type]) {
        performance[artifact.type] = {
          count: 0,
          totalRating: 0,
          totalViews: 0,
          totalReviews: 0,
        };
      }

      performance[artifact.type].count++;
      performance[artifact.type].totalRating += artifact.rating || 0;
      performance[artifact.type].totalViews += artifact.viewCount || 0;
      performance[artifact.type].totalReviews += artifact.reviews?.length || 0;
    });

    // Calculate averages
    Object.keys(performance).forEach((type) => {
      const data = performance[type];
      data.averageRating = data.count > 0 ? data.totalRating / data.count : 0;
      data.averageViews = data.count > 0 ? data.totalViews / data.count : 0;
      data.averageReviews = data.count > 0 ? data.totalReviews / data.count : 0;
    });

    return performance;
  };

  // Analyze geographic data
  const analyzeGeographicData = (artifacts) => {
    const geographic = {};

    artifacts.forEach((artifact) => {
      if (artifact.area) {
        if (!geographic[artifact.area]) {
          geographic[artifact.area] = {
            count: 0,
            totalRating: 0,
            totalViews: 0,
          };
        }

        geographic[artifact.area].count++;
        geographic[artifact.area].totalRating += artifact.rating || 0;
        geographic[artifact.area].totalViews += artifact.viewCount || 0;
      }
    });

    return Object.entries(geographic).map(([area, data]) => ({
      area,
      count: data.count,
      averageRating: data.count > 0 ? data.totalRating / data.count : 0,
      totalViews: data.totalViews,
    }));
  };

  // Analyze category breakdown
  const analyzeCategoryBreakdown = (artifacts) => {
    const categories = {};

    artifacts.forEach((artifact) => {
      if (artifact.type) {
        categories[artifact.type] = (categories[artifact.type] || 0) + 1;
      }
    });

    return Object.entries(categories).map(([category, count]) => ({
      name: category,
      value: count,
    }));
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Export data
  const handleExport = () => {
    const dataStr = JSON.stringify(analyticsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-${timeRange}-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Chart colors
  const chartColors = [
    "#667eea",
    "#764ba2",
    "#f093fb",
    "#f5576c",
    "#4facfe",
    "#00f2fe",
    "#43e97b",
    "#38f9d7",
  ];

  if (loading) {
    return (
      <Box className="analytics-dashboard loading">
        <CircularProgress />
        <Typography>Loading analytics...</Typography>
      </Box>
    );
  }

  return (
    <Box className="analytics-dashboard">
      {/* Header */}
      <Card className="dashboard-header-card">
        <CardContent>
          <Box className="dashboard-header">
            <Box className="dashboard-title-section">
              <Typography variant="h4" className="dashboard-title">
                <Analytics /> Analytics Dashboard
              </Typography>
              <Typography variant="body1" className="dashboard-subtitle">
                Comprehensive insights into platform performance and user
                behavior
              </Typography>
            </Box>

            <Box className="dashboard-controls">
              <FormControl size="small">
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  label="Time Range"
                >
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                  <MenuItem value="90d">Last 90 Days</MenuItem>
                  <MenuItem value="1y">Last Year</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
              >
                Refresh
              </Button>

              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleExport}
              >
                Export
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Overview Metrics */}
      <Grid container spacing={3} className="metrics-grid">
        <Grid item xs={12} sm={6} md={3}>
          <Card className="metric-card">
            <CardContent>
              <Box className="metric-header">
                <Typography variant="h6" className="metric-title">
                  Total Artifacts
                </Typography>
                <BarChart className="metric-icon" />
              </Box>
              <Typography variant="h3" className="metric-value">
                {analyticsData.overview.totalArtifacts}
              </Typography>
              <Typography variant="body2" className="metric-change positive">
                <TrendingUp /> +{analyticsData.overview.recentArtifacts} this
                period
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="metric-card">
            <CardContent>
              <Box className="metric-header">
                <Typography variant="h6" className="metric-title">
                  Active Creators
                </Typography>
                <People className="metric-icon" />
              </Box>
              <Typography variant="h3" className="metric-value">
                {analyticsData.overview.activeCreators}
              </Typography>
              <Typography variant="body2" className="metric-change positive">
                <TrendingUp /> +
                {analyticsData.overview.activeCreators -
                  (analyticsData.overview.totalCreators -
                    analyticsData.overview.activeCreators)}{" "}
                vs previous
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="metric-card">
            <CardContent>
              <Box className="metric-header">
                <Typography variant="h6" className="metric-title">
                  Avg Rating
                </Typography>
                <Star className="metric-icon" />
              </Box>
              <Typography variant="h3" className="metric-value">
                {analyticsData.overview.averageRating.toFixed(1)}
              </Typography>
              <Typography variant="body2" className="metric-change">
                <AccessTime /> Based on {analyticsData.overview.totalReviews}{" "}
                reviews
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="metric-card">
            <CardContent>
              <Box className="metric-header">
                <Typography variant="h6" className="metric-title">
                  Total Views
                </Typography>
                <Visibility className="metric-icon" />
              </Box>
              <Typography variant="h3" className="metric-value">
                {analyticsData.overview.totalViews.toLocaleString()}
              </Typography>
              <Typography variant="body2" className="metric-change positive">
                <TrendingUp /> Growing engagement
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} className="charts-grid">
        {/* Trends Chart */}
        <Grid item xs={12} lg={8}>
          <Card className="chart-card">
            <CardContent>
              <Typography variant="h6" className="chart-title">
                <Timeline /> Activity Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.trends}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.7)"
                    fontSize={12}
                  />
                  <YAxis stroke="rgba(255,255,255,0.7)" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.9)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="artifacts"
                    stroke="#667eea"
                    strokeWidth={2}
                    name="Artifacts Created"
                  />
                  <Line
                    type="monotone"
                    dataKey="creators"
                    stroke="#764ba2"
                    strokeWidth={2}
                    name="Active Creators"
                  />
                  <Line
                    type="monotone"
                    dataKey="averageRating"
                    stroke="#f093fb"
                    strokeWidth={2}
                    name="Avg Rating"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Breakdown */}
        <Grid item xs={12} lg={4}>
          <Card className="chart-card">
            <CardContent>
              <Typography variant="h6" className="chart-title">
                <Category /> Content Types
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={analyticsData.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {analyticsData.categoryBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.9)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Content Performance */}
        <Grid item xs={12} lg={6}>
          <Card className="chart-card">
            <CardContent>
              <Typography variant="h6" className="chart-title">
                <BarChart /> Content Performance by Type
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart
                  data={Object.entries(analyticsData.contentPerformance).map(
                    ([type, data]) => ({
                      type,
                      averageRating: data.averageRating,
                      averageViews: data.averageViews,
                      count: data.count,
                    }),
                  )}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="type"
                    stroke="rgba(255,255,255,0.7)"
                    fontSize={12}
                  />
                  <YAxis stroke="rgba(255,255,255,0.7)" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.9)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="averageRating"
                    fill="#667eea"
                    name="Avg Rating"
                  />
                  <Bar dataKey="count" fill="#764ba2" name="Count" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Geographic Distribution */}
        <Grid item xs={12} lg={6}>
          <Card className="chart-card">
            <CardContent>
              <Typography variant="h6" className="chart-title">
                <LocationOn /> Geographic Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={analyticsData.geographicData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="area"
                    stroke="rgba(255,255,255,0.7)"
                    fontSize={12}
                  />
                  <YAxis stroke="rgba(255,255,255,0.7)" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.9)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#f093fb" name="Artifacts" />
                  <Bar
                    dataKey="averageRating"
                    fill="#f5576c"
                    name="Avg Rating"
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Performing Content */}
      <Card className="top-content-card">
        <CardContent>
          <Typography variant="h6" className="chart-title">
            <Star /> Top Performing Content
          </Typography>
          <Grid container spacing={2}>
            {analyticsData.topContent.slice(0, 6).map((artifact, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={artifact.id || artifact._id}
              >
                <Card className="content-item-card">
                  <CardContent>
                    <Box className="content-item-header">
                      <Typography variant="h6" className="content-item-title">
                        {artifact.name}
                      </Typography>
                      <Chip
                        label={`#${index + 1}`}
                        size="small"
                        className="rank-chip"
                      />
                    </Box>
                    <Typography variant="body2" className="content-item-type">
                      {artifact.type} • {artifact.area}
                    </Typography>
                    <Box className="content-item-stats">
                      <Typography variant="body2">
                        ⭐ {artifact.rating?.toFixed(1) || "N/A"}
                      </Typography>
                      <Typography variant="body2">
                        👁️ {artifact.viewCount || 0} views
                      </Typography>
                      <Typography variant="body2">
                        💬 {artifact.reviews?.length || 0} reviews
                      </Typography>
                    </Box>
                    <Typography variant="body2" className="content-item-score">
                      Performance Score: {artifact.performanceScore.toFixed(0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AnalyticsDashboard;
