import React from "react";
import type { TrackedAppDto } from "../../api/contracts";
import { bridge } from "../../api/bridge";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";

interface AppCardProps {
  app: TrackedAppDto;
  checking: boolean;
  downloading: boolean;
  onCheck: () => void;
  onDownload: () => void;
  onRemove: () => void;
}

export function AppCard({
  app,
  checking,
  downloading,
  onCheck,
  onDownload,
  onRemove,
}: AppCardProps): React.JSX.Element {
  const versionBadge = app.hasUpdateAvailable ? (
    <Badge label={`Update: ${app.latestVersion ?? ""}`} variant="update" />
  ) : app.latestVersion ? (
    <Badge label={`v${app.latestVersion}`} variant="current" />
  ) : (
    <Badge label="Not checked" variant="unknown" />
  );

  return (
    <div
      className={`app-card${app.hasUpdateAvailable ? " app-card--has-update" : ""}`}
    >
      <div className="app-card__info">
        <span className="app-card__name">{app.name}</span>
        <a
          className="app-card__url"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            void bridge.openExternal(app.sourceUrl);
          }}
        >
          {app.sourceUrl}
        </a>
        <div className="app-card__versions">
          {app.currentVersion && (
            <span className="app-card__current">
              Current: v{app.currentVersion}
            </span>
          )}
          {versionBadge}
        </div>
        {app.lastCheckedAt && (
          <span className="app-card__checked-at">
            Checked: {new Date(app.lastCheckedAt).toLocaleString()}
          </span>
        )}
      </div>
      <div className="app-card__actions">
        <Button variant="ghost" size="sm" loading={checking} onClick={onCheck}>
          Check
        </Button>
        {app.hasUpdateAvailable && (
          <Button
            variant="primary"
            size="sm"
            loading={downloading}
            onClick={onDownload}
          >
            Update
          </Button>
        )}
        <Button variant="danger" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>
    </div>
  );
}
