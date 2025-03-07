import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import GameWorld from "./components/GameWorld";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./components/NotFound";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/game"
          element={
            <ProtectedRoute>
              <GameWorld />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
