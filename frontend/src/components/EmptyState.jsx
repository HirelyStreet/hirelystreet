import React from "react";

export default function EmptyState({
  emoji = "🌿",
  title = "Nothing here yet",
  text,
  action,
  onAction,
}) {
  return (
    <div className="empty-state">
      <div className="empty-emoji" aria-hidden="true">{emoji}</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action && onAction && (
        <button className="btn btn-primary" onClick={onAction}>{action}</button>
      )}
    </div>
  );
}
