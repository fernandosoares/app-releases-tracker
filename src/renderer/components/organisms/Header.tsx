import React from "react";
import { Button } from "../atoms/Button";

interface HeaderProps {
  updateCount: number;
  onCheckAll: () => void;
  checking: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  updatesOnly: boolean;
  onToggleUpdatesOnly: () => void;
  sortBy: "name" | "status" | "lastChecked";
  onSortChange: (value: "name" | "status" | "lastChecked") => void;
}

export function Header({
  updateCount,
  onCheckAll,
  checking,
  search,
  onSearchChange,
  updatesOnly,
  onToggleUpdatesOnly,
  sortBy,
  onSortChange,
}: HeaderProps): React.JSX.Element {
  return (
    <header className="header">
      <div className="header__brand">
        <h1 className="header__title">App Releases Tracker</h1>
        {updateCount > 0 && (
          <span className="header__update-badge">
            {updateCount} update{updateCount !== 1 ? "s" : ""} available
          </span>
        )}
      </div>
      <div className="header__controls">
        <input
          className="header__search"
          type="search"
          placeholder="Search apps or URLs"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <select
          className="header__select"
          value={sortBy}
          onChange={(e) =>
            onSortChange(e.target.value as "name" | "status" | "lastChecked")
          }
        >
          <option value="status">Sort: Update status</option>
          <option value="name">Sort: Name</option>
          <option value="lastChecked">Sort: Last checked</option>
        </select>

        <Button variant="ghost" size="sm" onClick={onToggleUpdatesOnly}>
          {updatesOnly ? "Show All" : "Updates Only"}
        </Button>

        <Button
          variant="primary"
          size="sm"
          loading={checking}
          onClick={onCheckAll}
        >
          Check All
        </Button>
      </div>
    </header>
  );
}
