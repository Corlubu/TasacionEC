import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";

// Import idb-keyval for IndexedDB storage
// Note: idb-keyval will be automatically installed by the environment
import { get, set, del } from "idb-keyval";

interface PendingProperty {
  id: string; // temporary local ID
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  type: "HOUSE" | "APARTMENT" | "COMMERCIAL" | "LAND" | "INDUSTRIAL";
  latitude: number;
  longitude: number;
  landArea?: number;
  builtArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  yearBuilt?: number;
  roofMaterial?: string;
  wallMaterial?: string;
  floorMaterial?: string;
  conservationState?: "EXCELLENT" | "GOOD" | "REGULAR" | "POOR" | "VERY_POOR";
  checklist?: ChecklistItem[];
  timestamp: number;
  synced: boolean;
}

interface PendingPhoto {
  id: string;
  propertyLocalId: string;
  file: string; // base64 encoded - IndexedDB can handle large strings
  fileName: string;
  fileType: string;
  category: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
  timestamp: number;
  synced: boolean;
}

interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  checked: boolean;
  notes?: string;
  required: boolean;
}

interface OfflineStore {
  isOnline: boolean;
  pendingProperties: PendingProperty[];
  pendingPhotos: PendingPhoto[];
  
  // Actions
  setOnlineStatus: (status: boolean) => void;
  addPendingProperty: (property: Omit<PendingProperty, "id" | "timestamp" | "synced">) => string;
  addPendingPhoto: (photo: Omit<PendingPhoto, "id" | "timestamp" | "synced">) => void;
  markPropertySynced: (localId: string, serverId: number) => void;
  markPhotoSynced: (localId: string) => void;
  removeSyncedItems: () => void;
  getPendingCount: () => number;
  updatePropertyChecklist: (localId: string, checklist: ChecklistItem[]) => void;
}

// Create custom storage engine using IndexedDB via idb-keyval
// This resolves the 5MB localStorage limit and can handle large base64 photos
const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await get(name);
      return value || null;
    } catch (error) {
      console.error("Error reading from IndexedDB:", error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch (error) {
      console.error("Error writing to IndexedDB:", error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch (error) {
      console.error("Error deleting from IndexedDB:", error);
    }
  },
};

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set, get) => ({
      isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
      pendingProperties: [],
      pendingPhotos: [],
      
      setOnlineStatus: (status: boolean) => set({ isOnline: status }),
      
      addPendingProperty: (property) => {
        const id = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newProperty: PendingProperty = {
          ...property,
          id,
          timestamp: Date.now(),
          synced: false,
        };
        
        set((state) => ({
          pendingProperties: [...state.pendingProperties, newProperty],
        }));
        
        return id;
      },
      
      addPendingPhoto: (photo) => {
        const id = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newPhoto: PendingPhoto = {
          ...photo,
          id,
          timestamp: Date.now(),
          synced: false,
        };
        
        set((state) => ({
          pendingPhotos: [...state.pendingPhotos, newPhoto],
        }));
      },
      
      markPropertySynced: (localId: string, serverId: number) => {
        set((state) => ({
          pendingProperties: state.pendingProperties.map((p) =>
            p.id === localId ? { ...p, synced: true } : p
          ),
        }));
      },
      
      markPhotoSynced: (localId: string) => {
        set((state) => ({
          pendingPhotos: state.pendingPhotos.map((p) =>
            p.id === localId ? { ...p, synced: true } : p
          ),
        }));
      },
      
      removeSyncedItems: () => {
        set((state) => ({
          pendingProperties: state.pendingProperties.filter((p) => !p.synced),
          pendingPhotos: state.pendingPhotos.filter((p) => !p.synced),
        }));
      },
      
      getPendingCount: () => {
        const state = get();
        return (
          state.pendingProperties.filter((p) => !p.synced).length +
          state.pendingPhotos.filter((p) => !p.synced).length
        );
      },
      
      updatePropertyChecklist: (localId: string, checklist: ChecklistItem[]) => {
        set((state) => ({
          pendingProperties: state.pendingProperties.map((p) =>
            p.id === localId ? { ...p, checklist } : p
          ),
        }));
      },
    }),
    {
      name: "tasacionec-offline",
      storage: createJSONStorage(() => indexedDBStorage),
    }
  )
);

// Helper to initialize online status listener
export function initializeOfflineSync() {
  if (typeof window === "undefined") return;
  
  const store = useOfflineStore.getState();
  
  window.addEventListener("online", () => {
    store.setOnlineStatus(true);
    console.log("Back online - ready to sync");
  });
  
  window.addEventListener("offline", () => {
    store.setOnlineStatus(false);
    console.log("Offline mode activated - using IndexedDB for storage");
  });
}
