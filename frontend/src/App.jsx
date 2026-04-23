import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import GraphVisualizer from "./pages/GraphVisualizer";
import Login from "./pages/Login";
import Register from "./pages/Register";

import AuthLayout from "./components/AuthLayout";
import ProtectedLayout from "./components/ProtectedLayout";

function App() {
    const token = localStorage.getItem("token");

    return (
        <Router>
            <Routes>

                {/* ROOT REDIRECT */}
                <Route
                    path="/"
                    element={
                        token
                            ? <Navigate to="/graph/new" />
                            : <Navigate to="/login" />
                    }
                />

                {/* Public routes (blocked if logged in) */}
                <Route element={<AuthLayout />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Route>

                {/* Private routes */}
                <Route element={<ProtectedLayout />}>
                    <Route path="/graph/:id" element={<GraphVisualizer />} />
                </Route>

                {/* fallback */}
                <Route path="*" element={<Navigate to="/" />} />

            </Routes>
        </Router>
    );
}

export default App;