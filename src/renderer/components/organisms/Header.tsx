import React from "react";
import { Button } from "../atoms/Button";

interface HeaderProps {
  updateCount: number;
  onCheckAll: () => void;
  checking: boolean;
}

export function Header({
  updateCount,
  onCheckAll,
  checking,
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
      <Button
        variant="primary"
        size="sm"
        loading={checking}
        onClick={onCheckAll}
      >
        Check All
      </Button>
    </header>
  );
}
