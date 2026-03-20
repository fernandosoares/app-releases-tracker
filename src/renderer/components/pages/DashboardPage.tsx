import React, { useEffect, useState } from "react";
import { useAppsStore } from "../../store/appsStore";
import { bridge } from "../../api/bridge";
import { Header } from "../organisms/Header";
import { AppList } from "../organisms/AppList";
import { AddAppForm } from "../molecules/AddAppForm";

export function DashboardPage(): React.JSX.Element {
  const {
    apps,
    loading,
    checkingIds,
    loadApps,
    addApp,
    removeApp,
    checkAll,
    checkOne,
    applyUpdates,
  } = useAppsStore();

  const [checkingAll, setCheckingAll] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Load apps on mount and subscribe to push updates
  useEffect(() => {
    loadApps();

    const handler = (
      updates: Array<{ id: string; name: string; latestVersion: string }>,
    ): void => {
      applyUpdates(updates);
    };

    bridge.onUpdatesAvailable(handler);
    return () => bridge.offUpdatesAvailable(handler);
  }, [loadApps, applyUpdates]);

  async function handleCheckAll(): Promise<void> {
    setCheckingAll(true);
    try {
      await checkAll();
    } finally {
      setCheckingAll(false);
    }
  }

  async function handleAdd(name: string, sourceUrl: string): Promise<void> {
    setAddError(null);
    try {
      await addApp(name, sourceUrl);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : String(err));
    }
  }

  const updateCount = apps.filter((a) => a.hasUpdateAvailable).length;

  return (
    <div className="dashboard">
      <Header
        updateCount={updateCount}
        onCheckAll={handleCheckAll}
        checking={checkingAll}
      />

      <main className="dashboard__content">
        <section className="dashboard__sidebar">
          <AddAppForm onSubmit={handleAdd} />
          {addError && <p className="dashboard__add-error">{addError}</p>}
        </section>

        <section className="dashboard__main">
          <AppList
            apps={apps}
            loading={loading}
            checkingIds={checkingIds}
            onCheck={checkOne}
            onRemove={removeApp}
          />
        </section>
      </main>
    </div>
  );
}
