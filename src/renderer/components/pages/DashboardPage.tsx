import React, { useEffect, useMemo, useState } from "react";
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
  const [search, setSearch] = useState("");
  const [updatesOnly, setUpdatesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "status" | "lastChecked">(
    "status",
  );

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

  const visibleApps = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    const filtered = apps.filter((app) => {
      if (updatesOnly && !app.hasUpdateAvailable) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        app.name.toLowerCase().includes(normalizedQuery) ||
        app.sourceUrl.toLowerCase().includes(normalizedQuery)
      );
    });

    const sorted = [...filtered];

    if (sortBy === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      return sorted;
    }

    if (sortBy === "lastChecked") {
      sorted.sort((a, b) => {
        const ta = a.lastCheckedAt ? Date.parse(a.lastCheckedAt) : 0;
        const tb = b.lastCheckedAt ? Date.parse(b.lastCheckedAt) : 0;
        return tb - ta;
      });
      return sorted;
    }

    // status: updates first, then alphabetic name
    sorted.sort((a, b) => {
      const statusDelta =
        Number(b.hasUpdateAvailable) - Number(a.hasUpdateAvailable);
      if (statusDelta !== 0) return statusDelta;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [apps, search, updatesOnly, sortBy]);

  return (
    <div className="dashboard">
      <Header
        updateCount={updateCount}
        onCheckAll={handleCheckAll}
        checking={checkingAll}
        search={search}
        onSearchChange={setSearch}
        updatesOnly={updatesOnly}
        onToggleUpdatesOnly={() => setUpdatesOnly((v) => !v)}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <main className="dashboard__content">
        <section className="dashboard__sidebar">
          <AddAppForm onSubmit={handleAdd} />
          {addError && <p className="dashboard__add-error">{addError}</p>}
        </section>

        <section className="dashboard__main">
          <AppList
            apps={visibleApps}
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
