import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "20vh",
        color: "#fff",
        fontFamily: "monospace",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: "20px",
        borderRadius: "10px",
        maxWidth: "400px",
        margin: "auto",
        boxShadow: "0px 0px 15px rgba(255, 0, 0, 0.5)",
      }}
    >
      <h2
        style={{
          color: "#ff5555",
          textShadow: "2px 2px 5px rgba(255, 85, 85, 0.8)",
        }}
      >
        404 - Page Not Found
      </h2>
      <p>Oops! Looks like this path doesn't exist.</p>
      <p>
        <span style={{ color: "#ffcc00" }}>➡ Press Start to return!</span>
      </p>
      <button
        onClick={() => navigate("/")}
        style={{
          padding: "10px 20px",
          backgroundColor: "#ff5555",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          borderRadius: "5px",
          fontSize: "16px",
          fontFamily: "monospace",
          textShadow: "1px 1px 3px rgba(0, 0, 0, 0.5)",
        }}
      >
        ⏪ Go Home
      </button>
    </div>
  );
};

export default NotFound;
