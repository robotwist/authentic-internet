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
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
