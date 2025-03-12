import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      console.log("📤 Sending Login Request:", { username, password });

      const response = await API.post("/auth/login", { username, password });
      console.log("✅ Login Success:", response.data);

      localStorage.setItem("token", response.data.token);
      alert("Login successful!");
      navigate("/game");
    } catch (err) {
      console.error("❌ Login Failed:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Login failed.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#f0f0f0" }}>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", width: "300px", padding: "20px", backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)" }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ marginBottom: "10px", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ marginBottom: "10px", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <button type="submit" style={{ padding: "10px", borderRadius: "4px", border: "none", backgroundColor: "#4caf50", color: "#fff", cursor: "pointer" }}>
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
