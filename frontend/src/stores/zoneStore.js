import { create } from 'zustand';

/**
 * Zone Store
 * Manages current zone state, available zones, and zone transitions
 */

const useZoneStore = create((set, get) => ({
  // Current zone player is in
  currentZone: null,
  
  // All available zones
  availableZones: [],
  
  // Portals in current zone
  portals: [],
  
  // Loading state
  isTransitioning: false,
  transitionMessage: '',
  
  // Actions
  setCurrentZone: (zone) => set({ currentZone: zone }),
  
  setAvailableZones: (zones) => set({ availableZones: zones }),
  
  setPortals: (portals) => set({ portals}),
  
  startTransition: (message = 'Traveling...') => 
    set({ isTransitioning: true, transitionMessage: message }),
  
  endTransition: () => 
    set({ isTransitioning: false, transitionMessage: '' }),
  
  // Get zone by ID
  getZoneById: (zoneId) => {
    const { availableZones } = get();
    return availableZones.find(z => z.id === zoneId);
  },
  
  // Get zone by slug
  getZoneBySlug: (slug) => {
    const { availableZones } = get();
    return availableZones.find(z => z.slug === slug);
  },
  
  // Check if player can enter zone
  canEnterZone: (zone, playerLevel = 1) => {
    if (!zone || !zone.is_active) return false;
    if (playerLevel < zone.min_level) return false;
    if (zone.max_level && playerLevel > zone.max_level) return false;
    return true;
  },
  
  // Reset store
  reset: () => set({
    currentZone: null,
    availableZones: [],
    portals: [],
    isTransitioning: false,
    transitionMessage: ''
  })
}));

export default useZoneStore;

