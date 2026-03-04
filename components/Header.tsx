"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Header() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="navbar">
      <div className="logo">LeaseVerse</div>

      <nav className="navLinks">
        <a>Browse Rentals</a>
        <a>List Property</a>
        <a>How it Works</a>
        <a>Pricing</a>
      </nav>

      <div className="rightSection">
        <div className="searchBox">
          <input placeholder="Search rentals..." />
        </div>

        <button className="themeToggle" onClick={toggleTheme}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        <a className="loginBtn">Log in</a>
 <Link href="/signup">
          <button className="signupBtn">Sign up</button>
        </Link>      </div>
    </header>
  );
}