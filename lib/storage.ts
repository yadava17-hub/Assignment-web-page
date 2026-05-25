import { Equipment, MaintenanceLog } from "@/types/equipment";
import { SEED_EQUIPMENT, SEED_LOGS } from "./seed";

const EQ_KEY = "fc_eq_v1";
const LOG_KEY = "fc_log_v1";

function isClient() {
  return typeof window !== "undefined";
}

export function loadEquipment(): Equipment[] {
  if (!isClient()) return SEED_EQUIPMENT;
  try {
    const raw = localStorage.getItem(EQ_KEY);
    if (!raw) {
      saveEquipment(SEED_EQUIPMENT);
      return SEED_EQUIPMENT;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_EQUIPMENT;
  } catch {
    return SEED_EQUIPMENT;
  }
}

export function saveEquipment(items: Equipment[]): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(EQ_KEY, JSON.stringify(items));
  } catch {
    // storage full or private browsing
  }
}

export function loadLogs(): MaintenanceLog[] {
  if (!isClient()) return SEED_LOGS;
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) {
      saveLogs(SEED_LOGS);
      return SEED_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_LOGS;
  } catch {
    return SEED_LOGS;
  }
}

export function saveLogs(logs: MaintenanceLog[]): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch {
    // ignore
  }
}

export function resetStorage(): void {
  if (!isClient()) return;
  localStorage.removeItem(EQ_KEY);
  localStorage.removeItem(LOG_KEY);
}
