
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";


import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function App() {
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route element={<PublicRoute />}>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute />}>
  <Route
    path="/dashboard"
    element={<Dashboard />}
  />
</Route>
      </Routes>
    </>
  );
}

export default App;
