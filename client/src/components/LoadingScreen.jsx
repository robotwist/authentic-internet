import React, { useEffect, useState } from "react";
import "./LoadingScreen.css";

const LoadingScreen = ({ onComplete }) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 500);

    setTimeout(() => {
      onComplete(); // Dismiss loading screen after assets load
    }, 2500); // Adjust this to match actual loading times

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="loading-screen">
      <h1>LOADING{dots}</h1>
      <p>Initializing the world...</p>
    </div>
  );
};

export default LoadingScreen;
