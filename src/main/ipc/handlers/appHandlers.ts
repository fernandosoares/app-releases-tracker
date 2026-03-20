import { ipcMain } from "electron";
import { IpcChannels } from "../channels";
import {
  AddAppPayloadSchema,
  RemoveAppPayloadSchema,
} from "../schemas/ipcSchemas";
import { toTrackedAppDto } from "../dto/TrackedAppDto";
import type { AddTrackedApp } from "../../application/AddTrackedApp";
import type { RemoveTrackedApp } from "../../application/RemoveTrackedApp";
import type { TrackedAppRepository } from "../../domain/ports/TrackedAppRepository";

interface AppHandlerDeps {
  repository: TrackedAppRepository;
  addTrackedApp: AddTrackedApp;
  removeTrackedApp: RemoveTrackedApp;
}

/**
 * Registers IPC handlers for app CRUD operations.
 * All incoming payloads are validated with Zod before reaching use cases.
 */
export function registerAppHandlers(deps: AppHandlerDeps): void {
  // -------------------------------------------------------------------------
  // apps:getAll — returns all tracked apps as DTOs
  // -------------------------------------------------------------------------
  ipcMain.handle(IpcChannels.APPS_GET_ALL, async () => {
    const apps = await deps.repository.listAll();
    return apps.map(toTrackedAppDto);
  });

  // -------------------------------------------------------------------------
  // apps:add — validates payload, adds app, returns new DTO
  // -------------------------------------------------------------------------
  ipcMain.handle(IpcChannels.APPS_ADD, async (_event, raw: unknown) => {
    const result = AddAppPayloadSchema.safeParse(raw);

    if (!result.success) {
      throw new Error(result.error.issues.map((i) => i.message).join(", "));
    }

    const output = await deps.addTrackedApp.execute(result.data);
    return output;
  });

  // -------------------------------------------------------------------------
  // apps:remove — validates ID, removes app
  // -------------------------------------------------------------------------
  ipcMain.handle(IpcChannels.APPS_REMOVE, async (_event, raw: unknown) => {
    const result = RemoveAppPayloadSchema.safeParse(raw);

    if (!result.success) {
      throw new Error(result.error.issues.map((i) => i.message).join(", "));
    }

    await deps.removeTrackedApp.execute(result.data);
  });
}
