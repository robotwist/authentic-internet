import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      console.log("📤 Sending Register Request:", { username, password });

      const response = await API.post("/auth/register", { username, password });
      console.log("✅ Registration Success:", response.data);

      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (err) {
      console.error("❌ Registration Failed:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div>
      <h2>Register</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleRegister}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
