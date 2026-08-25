import { supabase } from '../lib/supabase';

export interface BlessingRequestItem {
  id: string;
  gender: 'male' | 'female';
  full_name: string;
  last_name?: string;
  mother_name: string;
  good_resolution: string;
  blessing_request: string;
  formatted_text: string;
  created_at: string;
}

const LOCAL_STORAGE_KEY = 'chabad_blessing_requests_v1';

export function formatBlessingSentence(item: {
  gender: 'male' | 'female';
  full_name: string;
  last_name?: string;
  mother_name: string;
  good_resolution: string;
  blessing_request: string;
}): string {
  const isMale = item.gender === 'male';
  const firstNameStr = item.full_name.trim();
  const motherNameStr = item.mother_name.trim();
  const lastNameStr = item.last_name ? item.last_name.trim() : '';

  const namePart = lastNameStr
    ? `${firstNameStr} ${isMale ? 'בן' : 'בת'} ${motherNameStr} ${lastNameStr}`
    : `${firstNameStr} ${isMale ? 'בן' : 'בת'} ${motherNameStr}`;

  const resText = item.good_resolution.trim();
  let resolutionPart = '';
  if (resText) {
    const prefix = isMale ? 'מקבל על עצמי להתחזק' : 'מקבלת על עצמי להתחזק';
    const formattedRes = resText.startsWith('ב') ? resText : `ב${resText}`;
    resolutionPart = ` ${prefix} ${formattedRes}`;
  }

  const blessingText = item.blessing_request.trim();
  let blessingPart = '';
  if (blessingText) {
    const hasRes = Boolean(resText);
    const prefix = hasRes
      ? (isMale ? 'ומבקש ברכה' : 'ומבקשת ברכה')
      : (isMale ? 'מבקש ברכה' : 'מבקשת ברכה');

    const formattedBlessing = blessingText.startsWith('ל') ? blessingText : `ל${blessingText}`;
    blessingPart = ` ${prefix} ${formattedBlessing}`;
  }

  return `${namePart}${resolutionPart}${blessingPart}`.trim();
}

export const blessingService = {
  // Get all blessing requests (from Supabase first, merge with localStorage)
  async getAllRequests(): Promise<BlessingRequestItem[]> {
    let supabaseItems: BlessingRequestItem[] = [];
    try {
      const { data, error } = await supabase
        .from('blessing_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        supabaseItems = data.map((d: any) => ({
          ...d,
          formatted_text: d.formatted_text || formatBlessingSentence(d)
        }));
      }
    } catch (e) {
      console.warn('Supabase fetch blessing requests skipped/failed, using local storage.', e);
    }

    // LocalStorage fallback / sync
    const localDataRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    let localItems: BlessingRequestItem[] = localDataRaw ? JSON.parse(localDataRaw) : [];

    // Merge unique by ID
    const mergedMap = new Map<string, BlessingRequestItem>();
    [...supabaseItems, ...localItems].forEach(item => {
      if (!item.formatted_text) {
        item.formatted_text = formatBlessingSentence(item);
      }
      mergedMap.set(item.id, item);
    });

    const result = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return result;
  },

  // Save a new request
  async createRequest(payload: {
    gender: 'male' | 'female';
    full_name: string;
    last_name?: string;
    mother_name: string;
    good_resolution: string;
    blessing_request: string;
  }): Promise<BlessingRequestItem> {
    const newItem: BlessingRequestItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      gender: payload.gender,
      full_name: payload.full_name.trim(),
      last_name: payload.last_name ? payload.last_name.trim() : undefined,
      mother_name: payload.mother_name.trim(),
      good_resolution: payload.good_resolution.trim(),
      blessing_request: payload.blessing_request.trim(),
      formatted_text: formatBlessingSentence(payload),
      created_at: new Date().toISOString(),
    };

    // 1. Save to LocalStorage immediately
    const localDataRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const localItems: BlessingRequestItem[] = localDataRaw ? JSON.parse(localDataRaw) : [];
    localItems.unshift(newItem);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localItems));

    // 2. Save to Supabase if table exists
    try {
      await supabase.from('blessing_requests').insert([
        {
          id: newItem.id,
          gender: newItem.gender,
          full_name: newItem.full_name,
          last_name: newItem.last_name || null,
          mother_name: newItem.mother_name,
          good_resolution: newItem.good_resolution,
          blessing_request: newItem.blessing_request,
          formatted_text: newItem.formatted_text,
          created_at: newItem.created_at
        }
      ]);
    } catch (e) {
      console.warn('Supabase save failed/table not found, saved locally.', e);
    }

    return newItem;
  },

  // Delete a request
  async deleteRequest(id: string): Promise<void> {
    // 1. Remove from LocalStorage
    const localDataRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localDataRaw) {
      const localItems: BlessingRequestItem[] = JSON.parse(localDataRaw);
      const filtered = localItems.filter(item => item.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }

    // 2. Remove from Supabase
    try {
      await supabase.from('blessing_requests').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete failed.', e);
    }
  },

  // Delete multiple requests in batch
  async deleteBatchRequests(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);

    // 1. Remove from LocalStorage
    const localDataRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localDataRaw) {
      const localItems: BlessingRequestItem[] = JSON.parse(localDataRaw);
      const filtered = localItems.filter(item => !idSet.has(item.id));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }

    // 2. Remove from Supabase
    try {
      await supabase.from('blessing_requests').delete().in('id', ids);
    } catch (e) {
      console.warn('Supabase batch delete failed.', e);
    }
  },

  // Update an existing request
  async updateRequest(id: string, payload: {
    gender: 'male' | 'female';
    full_name: string;
    last_name?: string;
    mother_name: string;
    good_resolution: string;
    blessing_request: string;
  }): Promise<BlessingRequestItem> {
    const formatted_text = formatBlessingSentence(payload);
    
    // 1. Update in LocalStorage
    const localDataRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    let updatedItem: BlessingRequestItem | null = null;
    if (localDataRaw) {
      const localItems: BlessingRequestItem[] = JSON.parse(localDataRaw);
      const index = localItems.findIndex(item => item.id === id);
      if (index !== -1) {
        localItems[index] = {
          ...localItems[index],
          ...payload,
          full_name: payload.full_name.trim(),
          last_name: payload.last_name ? payload.last_name.trim() : undefined,
          mother_name: payload.mother_name.trim(),
          good_resolution: payload.good_resolution.trim(),
          blessing_request: payload.blessing_request.trim(),
          formatted_text
        };
        updatedItem = localItems[index];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localItems));
      }
    }

    if (!updatedItem) {
      updatedItem = {
        id,
        gender: payload.gender,
        full_name: payload.full_name.trim(),
        last_name: payload.last_name ? payload.last_name.trim() : undefined,
        mother_name: payload.mother_name.trim(),
        good_resolution: payload.good_resolution.trim(),
        blessing_request: payload.blessing_request.trim(),
        formatted_text,
        created_at: new Date().toISOString()
      };
    }

    // 2. Update in Supabase
    try {
      await supabase.from('blessing_requests').update({
        gender: payload.gender,
        full_name: payload.full_name.trim(),
        last_name: payload.last_name ? payload.last_name.trim() : null,
        mother_name: payload.mother_name.trim(),
        good_resolution: payload.good_resolution.trim(),
        blessing_request: payload.blessing_request.trim(),
        formatted_text
      }).eq('id', id);
    } catch (e) {
      console.warn('Supabase update failed.', e);
    }

    return updatedItem;
  }
};
