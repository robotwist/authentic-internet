import React, { useState, useEffect } from 'react';
import { handleNPCInteraction } from '../../api/api';
import { API_CONFIG, buildApiUrl } from '../../utils/apiConfig';
import axios from 'axios';
import './NPC.css';

const Zeus = ({ onInteract, onClose }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weatherIcon, setWeatherIcon] = useState('☀️'); // Default sunny icon
  
  useEffect(() => {
    // When Zeus is rendered, fetch current weather data
    fetchWeatherData();
  }, []);
  
  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch weather directly first
      const coords = await getCurrentPosition();
      
      if (coords) {
        try {
          // Use our API config to get weather data
          const params = {
            lat: coords.latitude,
            lon: coords.longitude,
            appid: API_CONFIG.weather.apiKey,
            units: 'metric'
          };
          
          const url = `${API_CONFIG.weather.baseUrl}${API_CONFIG.weather.endpoints.current}`;
          const weatherResponse = await axios.get(url, { params });
          
          if (weatherResponse.status === 200) {
            setWeatherData(weatherResponse.data);
            setWeatherIcon(getWeatherIcon(weatherResponse.data.weather[0].main));
            setLoading(false);
            return;
          }
        } catch (directWeatherError) {
          console.log('Direct weather API failed, falling back to NPC API', directWeatherError);
        }
      }
      
      // Fallback to NPC interaction
      const response = await handleNPCInteraction({
        npcId: 'zeus',
        message: "What's the weather like today?",
        userId: localStorage.getItem('userId'),
        requestWeather: true
      });
      
      if (response && response.weatherData) {
        setWeatherData(response.weatherData);
        setWeatherIcon(getWeatherIcon(response.weatherData.weather[0].main));
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to get user's current position
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        (err) => reject(err),
        { timeout: 5000 }
      );
    });
  };
  
  const getWeatherIcon = (weatherCondition) => {
    switch (weatherCondition.toLowerCase()) {
      case 'clear':
        return '☀️';
      case 'clouds':
        return '☁️';
      case 'rain':
        return '🌧️';
      case 'thunderstorm':
        return '⛈️';
      case 'snow':
        return '❄️';
      case 'mist':
      case 'fog':
        return '🌫️';
      default:
        return '🌤️';
    }
  };
  
  const handleInteract = async () => {
    // Refresh weather data when interacting
    await fetchWeatherData();
    onInteract('zeus');
  };
  
  return (
    <div className="npc zeus" onClick={handleInteract}>
      <div className="npc-avatar">
        {loading ? (
          <div className="loading-spinner"></div>
        ) : (
          <span className="zeus-emoji">⚡</span>
        )}
      </div>
      
      {weatherData && (
        <div className="weather-indicator">
          <div className="weather-icon">{weatherIcon}</div>
          <div className="weather-temp">{Math.round(weatherData.main.temp)}°</div>
        </div>
      )}
      
      <div className="npc-info">
        <div className="npc-name">Zeus</div>
        <div className="zeus-title">Weather Oracle</div>
      </div>
    </div>
  );
};

export default Zeus; 