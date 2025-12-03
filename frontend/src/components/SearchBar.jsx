import React, { useState, useEffect } from "react";
import Fuse from "fuse.js";

export default function SearchBar({ subscriptions, onSearch }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "/") {
        e.preventDefault();
        document.querySelector("input[type='search']")?.focus();
      }
      if (e.key === "Escape") {
        setSearchTerm("");
        setSuggestions([]);
        onSearch("");
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onSearch]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    onSearch(value);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const fuse = new Fuse(subscriptions, {
      threshold: 0.3,
      keys: ["name"]
    });

    const results = fuse.search(value).slice(0, 5);
    setSuggestions(results.map((r) => r.item));
  };

  return (
    <div style={{ marginBottom: "12px", display: "flex", justifyContent: "flex-end" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: "320px" }}>
        <input
          aria-label="Search subscriptions"
          type="search"
          placeholder="Search subscriptions..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #D1D5DB",
            width: "100%",
            boxSizing: "border-box",
            fontSize: "14px"
          }}
        />

        {suggestions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              marginTop: "4px",
              background: "white",
              border: "1px solid #DDD",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 50
            }}
          >
            {suggestions.map((s, i) => (
              <div
                key={i}
                onClick={() => {
                  setSearchTerm(s.name);
                  setSuggestions([]);
                  onSearch(s.name);
                }}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                {s.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
