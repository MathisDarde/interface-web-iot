import { BrowserRouter, Route, Routes } from "react-router-dom";
import GameSelector from "./_components/GameSelector";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { AdminPage } from "./pages/Admin";
import { ProtectedRoute } from "./ProtectedRoute";

export default function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GameSelector />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
