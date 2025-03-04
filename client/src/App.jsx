import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import GameWorld from "./components/GameWorld";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GameWorld />} />
      </Routes>
    </Router>
  );
}

export default App;
