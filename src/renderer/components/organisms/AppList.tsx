import React from "react";
import type { TrackedAppDto } from "../../api/contracts";
import { AppCard } from "../molecules/AppCard";
import { Spinner } from "../atoms/Spinner";

interface AppListProps {
  apps: TrackedAppDto[];
  loading: boolean;
  checkingIds: Set<string>;
  onCheck: (id: string) => void;
  onRemove: (id: string) => void;
}

export function AppList({
  apps,
  loading,
  checkingIds,
  onCheck,
  onRemove,
}: AppListProps): React.JSX.Element {
  if (loading) {
    return (
      <div className="app-list app-list--loading">
        <Spinner />
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="app-list app-list--empty">
        <p>No applications tracked yet. Add one above.</p>
      </div>
    );
  }

  return (
    <ul className="app-list">
      {apps.map((app) => (
        <li key={app.id}>
          <AppCard
            app={app}
            checking={checkingIds.has(app.id)}
            onCheck={() => onCheck(app.id)}
            onRemove={() => onRemove(app.id)}
          />
        </li>
      ))}
    </ul>
  );
}
