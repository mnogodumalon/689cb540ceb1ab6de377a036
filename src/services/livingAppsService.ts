// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS, LOOKUP_OPTIONS, FIELD_TYPES } from '@/types/app';
import type { Personalverwaltung, Bereitschaftsdienst, Einsatzprotokoll } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: unknown): string | null {
  if (!url) return null;
  if (typeof url !== 'string') return null;
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

/** Upload a file to LivingApps. Returns the file URL for use in record fields. */
export async function uploadFile(file: File | Blob, filename?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, filename ?? (file instanceof File ? file.name : 'upload'));
  const res = await fetch(`${API_BASE_URL}/files`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) throw new Error(`File upload failed: ${res.status}`);
  const data = await res.json();
  return data.url;
}

function enrichLookupFields<T extends { fields: Record<string, unknown> }>(
  records: T[], entityKey: string
): T[] {
  const opts = LOOKUP_OPTIONS[entityKey];
  if (!opts) return records;
  return records.map(r => {
    const fields = { ...r.fields };
    for (const [fieldKey, options] of Object.entries(opts)) {
      const val = fields[fieldKey];
      if (typeof val === 'string') {
        const m = options.find(o => o.key === val);
        fields[fieldKey] = m ?? { key: val, label: val };
      } else if (Array.isArray(val)) {
        fields[fieldKey] = val.map(v => {
          if (typeof v === 'string') {
            const m = options.find(o => o.key === v);
            return m ?? { key: v, label: v };
          }
          return v;
        });
      }
    }
    return { ...r, fields } as T;
  });
}

/** Normalize fields for API writes: strip lookup objects to keys, fix date formats. */
export function cleanFieldsForApi(
  fields: Record<string, unknown>,
  entityKey: string
): Record<string, unknown> {
  const clean: Record<string, unknown> = { ...fields };
  for (const [k, v] of Object.entries(clean)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && 'key' in v) clean[k] = (v as any).key;
    if (Array.isArray(v)) clean[k] = v.map((item: any) => item && typeof item === 'object' && 'key' in item ? item.key : item);
  }
  const types = FIELD_TYPES[entityKey];
  if (types) {
    for (const [k, ft] of Object.entries(types)) {
      const val = clean[k];
      if (typeof val !== 'string' || !val) continue;
      if (ft === 'date/datetimeminute') clean[k] = val.slice(0, 16);
      else if (ft === 'date/date') clean[k] = val.slice(0, 10);
    }
  }
  return clean;
}

let _cachedUserProfile: Record<string, unknown> | null = null;

export async function getUserProfile(): Promise<Record<string, unknown>> {
  if (_cachedUserProfile) return _cachedUserProfile;
  const raw = await callApi('GET', '/user');
  const skip = new Set(['id', 'image', 'lang', 'gender', 'title', 'fax', 'menus', 'initials']);
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v != null && !skip.has(k)) data[k] = v;
  }
  _cachedUserProfile = data;
  return data;
}

export interface HeaderProfile {
  firstname: string;
  surname: string;
  email: string;
  image: string | null;
  company: string | null;
}

let _cachedHeaderProfile: HeaderProfile | null = null;

export async function getHeaderProfile(): Promise<HeaderProfile> {
  if (_cachedHeaderProfile) return _cachedHeaderProfile;
  const raw = await callApi('GET', '/user');
  _cachedHeaderProfile = {
    firstname: raw.firstname ?? '',
    surname: raw.surname ?? '',
    email: raw.email ?? '',
    image: raw.image ?? null,
    company: raw.company ?? null,
  };
  return _cachedHeaderProfile;
}

export interface AppGroupInfo {
  id: string;
  name: string;
  image: string | null;
  createdat: string;
  /** Resolved link: /objects/{id}/ if the dashboard exists, otherwise /gateway/apps/{firstAppId}?template=list_page */
  href: string;
}

let _cachedAppGroups: AppGroupInfo[] | null = null;

export async function getAppGroups(): Promise<AppGroupInfo[]> {
  if (_cachedAppGroups) return _cachedAppGroups;
  const raw = await callApi('GET', '/appgroups?with=apps');
  const groups: AppGroupInfo[] = Object.values(raw)
    .map((g: any) => {
      const firstAppId = Object.keys(g.apps ?? {})[0] ?? g.id;
      return {
        id: g.id,
        name: g.name,
        image: g.image ?? null,
        createdat: g.createdat ?? '',
        href: `/gateway/apps/${firstAppId}?template=list_page`,
        _firstAppId: firstAppId,
      };
    })
    .sort((a, b) => b.createdat.localeCompare(a.createdat));

  // Check which appgroups have a working dashboard at /objects/{id}/
  const checks = await Promise.allSettled(
    groups.map(g => fetch(`/objects/${g.id}/`, { method: 'HEAD', credentials: 'include' }))
  );
  checks.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value.ok) {
      groups[i].href = `/objects/${groups[i].id}/`;
    }
  });

  // Clean up internal helper property
  groups.forEach(g => delete (g as any)._firstAppId);

  _cachedAppGroups = groups;
  return _cachedAppGroups;
}

export class LivingAppsService {
  // --- PERSONALVERWALTUNG ---
  static async getPersonalverwaltung(): Promise<Personalverwaltung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.PERSONALVERWALTUNG}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Personalverwaltung[];
    return enrichLookupFields(records, 'personalverwaltung');
  }
  static async getPersonalverwaltungEntry(id: string): Promise<Personalverwaltung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.PERSONALVERWALTUNG}/records/${id}`);
    const record = { record_id: data.id, ...data } as Personalverwaltung;
    return enrichLookupFields([record], 'personalverwaltung')[0];
  }
  static async createPersonalverwaltungEntry(fields: Personalverwaltung['fields']) {
    return callApi('POST', `/apps/${APP_IDS.PERSONALVERWALTUNG}/records`, { fields });
  }
  static async updatePersonalverwaltungEntry(id: string, fields: Partial<Personalverwaltung['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.PERSONALVERWALTUNG}/records/${id}`, { fields });
  }
  static async deletePersonalverwaltungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.PERSONALVERWALTUNG}/records/${id}`);
  }

  // --- BEREITSCHAFTSDIENST ---
  static async getBereitschaftsdienst(): Promise<Bereitschaftsdienst[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.BEREITSCHAFTSDIENST}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Bereitschaftsdienst[];
    return enrichLookupFields(records, 'bereitschaftsdienst');
  }
  static async getBereitschaftsdienstEntry(id: string): Promise<Bereitschaftsdienst | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.BEREITSCHAFTSDIENST}/records/${id}`);
    const record = { record_id: data.id, ...data } as Bereitschaftsdienst;
    return enrichLookupFields([record], 'bereitschaftsdienst')[0];
  }
  static async createBereitschaftsdienstEntry(fields: Bereitschaftsdienst['fields']) {
    return callApi('POST', `/apps/${APP_IDS.BEREITSCHAFTSDIENST}/records`, { fields });
  }
  static async updateBereitschaftsdienstEntry(id: string, fields: Partial<Bereitschaftsdienst['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.BEREITSCHAFTSDIENST}/records/${id}`, { fields });
  }
  static async deleteBereitschaftsdienstEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.BEREITSCHAFTSDIENST}/records/${id}`);
  }

  // --- EINSATZPROTOKOLL ---
  static async getEinsatzprotokoll(): Promise<Einsatzprotokoll[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.EINSATZPROTOKOLL}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Einsatzprotokoll[];
    return enrichLookupFields(records, 'einsatzprotokoll');
  }
  static async getEinsatzprotokollEntry(id: string): Promise<Einsatzprotokoll | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.EINSATZPROTOKOLL}/records/${id}`);
    const record = { record_id: data.id, ...data } as Einsatzprotokoll;
    return enrichLookupFields([record], 'einsatzprotokoll')[0];
  }
  static async createEinsatzprotokollEntry(fields: Einsatzprotokoll['fields']) {
    return callApi('POST', `/apps/${APP_IDS.EINSATZPROTOKOLL}/records`, { fields });
  }
  static async updateEinsatzprotokollEntry(id: string, fields: Partial<Einsatzprotokoll['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.EINSATZPROTOKOLL}/records/${id}`, { fields });
  }
  static async deleteEinsatzprotokollEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.EINSATZPROTOKOLL}/records/${id}`);
  }

}