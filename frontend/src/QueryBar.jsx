import React, { useState } from "react";
import { CYPHER_RE } from "./tokens";

export default function QueryBar({ onQuery }) {
  const [value, setValue] = useState("");
  const isCypher = CYPHER_RE.test(value);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onQuery(value.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="query-form">
        <span className="query-prompt">&rsaquo;</span>
        <input
          className="query-input"
          type="text"
          placeholder="what does the agent remember about restaurants..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <span className={`query-mode ${isCypher ? "query-mode--cypher" : ""}`}>
          {isCypher ? "CYPHER" : "NL"}
        </span>
        <button className="query-btn" type="submit">
          RUN
        </button>
      </div>
      <div className="query-hint">
        natural language <span className="query-hint-accent">&middot;</span> or raw
        OpenCypher (MATCH ... RETURN ...)
      </div>
    </form>
  );
}
