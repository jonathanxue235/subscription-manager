import React from "react";

export default function HighlightedText({ text, matches }) {
  if (!matches || matches.length === 0 || !text) return text;

  const sorted = [...matches].sort((a, b) => a[0] - b[0]);

  let last = 0;
  const parts = [];

  for (let i = 0; i < sorted.length; i++) {
    const [start, end] = sorted[i];

    if (start > last) {
      parts.push(text.slice(last, start));
    }

    parts.push(
      <mark
        key={i}
        style={{
          backgroundColor: "#FEF08A",
          padding: 0,
          lineHeight: "inherit",
          fontWeight: "inherit",
        }}
      >
        {text.slice(start, end + 1)}
      </mark>
    );

    last = end + 1;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return <>{parts}</>;
}
