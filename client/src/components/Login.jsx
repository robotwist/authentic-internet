import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { fetchCharacter } from "../api/api"; // Import API as default export

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
      localStorage.setItem("user", JSON.stringify(response.data.user)); // Ensure user object is stored correctly

      // Debugging log to check user object
      console.log("User object:", response.data.user);

      // ✅ Fetch character after login
      const userId = response.data.user.id; // frontend Use 'id' instead of '_id'
      if (!userId) {
        throw new Error("User ID is undefined");
      }
      const characterData = await fetchCharacter(userId);
      localStorage.setItem("character", JSON.stringify(characterData));

      alert("Login successful!");
      navigate("/game");
    } catch (err) {
      console.error("❌ Login Failed:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Login failed.");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <button type="submit">Login</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

export default Login;
