import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BASE_URL } from "../constants";

function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [msg, setMsg] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg("");

        if (form.password !== form.confirmPassword) {
            setMsg("Passwords do not match");
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || "Error");

            setMsg("Registered successfully");
            setTimeout(() => navigate("/login"), 1000);

        } catch (err) {
            setMsg(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
            <form
                onSubmit={handleSubmit}
                className="bg-neutral-900 p-8 rounded-xl w-96 flex flex-col gap-5 border border-neutral-800 shadow-lg"
            >
                <h2 className="text-xl font-semibold text-center">Create Account</h2>

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    className="px-3 py-2 rounded bg-neutral-800 border border-neutral-700 focus:border-green-500 outline-none"
                    required
                />

                {/* Password */}
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded bg-neutral-800 border border-neutral-700 focus:border-green-500 outline-none"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-2 top-2 text-xs text-neutral-400"
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>

                {/* Confirm Password */}
                <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="px-3 py-2 rounded bg-neutral-800 border border-neutral-700 focus:border-green-500 outline-none"
                    required
                />

                <button className="bg-green-600 hover:bg-green-500 py-2 rounded font-medium">
                    Register
                </button>

                {msg && (
                    <p className="text-sm text-center text-red-400">{msg}</p>
                )}

                <p className="text-sm text-center text-neutral-400">
                    Already have an account?{" "}
                    <Link to="/login" className="text-green-400 hover:underline">
                        Login
                    </Link>
                </p>
            </form>
        </div>
    );
}

export default Register;