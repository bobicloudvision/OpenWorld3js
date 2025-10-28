import { create } from "zustand"
import { persist } from "zustand/middleware"
import { DEFAULT_MATERIAL, MATERIALS } from "../utils/materials"

const useMaterialStore = create(
  persist(
    (set, get) => ({
      // Currently selected material
      selectedMaterial: DEFAULT_MATERIAL,
      
      // Set the selected material
      setSelectedMaterial: (materialId) => {
        const material = MATERIALS[materialId] || DEFAULT_MATERIAL
        set({ selectedMaterial: material })
      },
      
      // Get the currently selected material
      getSelectedMaterial: () => get().selectedMaterial,
      
      // Get all available materials
      getAllMaterials: () => Object.values(MATERIALS),
      
      // Reset to default material
      resetToDefault: () => set({ selectedMaterial: DEFAULT_MATERIAL }),
    }),
    {
      name: "ow3-materials", // localStorage key
      partialize: (state) => ({ 
        selectedMaterial: state.selectedMaterial
      }),
    }
  )
)

export default useMaterialStore
