import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Sun, Moon } from "lucide-react";

function Header({ theme, setTheme, T }) {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const email = localStorage.getItem("email") || "user@example.com";

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const toggleTheme = () => {
        setTheme(prev => (prev === "dark" ? "light" : "dark"));
    };

    return (
        <div className={`flex items-center px-4 py-3 ${T.panel} border ${T.border} rounded-lg`}>

            {/* Left: Title */}
            <h1 className={`text-lg font-semibold ${T.accent}`}>
                Graph Visualizer
            </h1>

            {/* Right: Profile */}
            <div className="ml-auto relative">

                <button
                    onClick={() => setOpen(p => !p)}
                    className={`flex items-center gap-2 px-3 py-1 rounded ${T.button}`}
                >
                    <User size={16} />
                    <span className="text-sm">Profile</span>
                </button>

                {open && (
                    <div className={`absolute right-0 mt-2 w-56 ${T.panel} border ${T.border} rounded shadow-lg z-50 flex flex-col`}>

                        {/* Email */}
                        <div className={`px-3 py-2 text-xs ${T.subtext} border-b ${T.border}`}>
                            {email}
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`flex items-center gap-2 px-3 py-2 text-sm ${T.hover}`}
                        >
                            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                            {theme === "dark" ? "Light Mode" : "Dark Mode"}
                        </button>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>

                    </div>
                )}
            </div>
        </div>
    );
}

export default Header;