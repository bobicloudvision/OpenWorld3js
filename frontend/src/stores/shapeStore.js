import { create } from "zustand"
import { persist } from "zustand/middleware"
import { DEFAULT_MATERIAL } from "../utils/materials"

const useShapeStore = create(
  persist(
    (set, get) => ({
      // Each shape is an object with an id, position, mass, and dimensions (cubes only)
      defaultMass: 100000,
      shapes: [
        { 
          id: 0, 
          position: [0, 0.5, 2], 
          mass: 100000, 
          type: 'cube',
          dimensions: { size: 0.5 },
          material: DEFAULT_MATERIAL
        }
      ],
      nextId: 1,
      deleteMode: false,
      buildingMode: false,
      
      addShape: (x, y, z, dimensions = { size: 0.5 }, material = DEFAULT_MATERIAL) =>
        set((state) => ({
          shapes: [
            ...state.shapes,
            { 
              id: state.nextId, 
              position: [x, y, z], 
              mass: state.defaultMass,
              type: 'cube',
              dimensions,
              material
            },
          ],
          nextId: state.nextId + 1,
        })),
        
      removeShapeById: (id) =>
        set((state) => ({ shapes: state.shapes.filter((s) => s.id !== id) })),
        
      setDefaultMass: (mass) => set({ defaultMass: mass }),
      setDeleteMode: (mode) => set({ deleteMode: mode }),
      setBuildingMode: (mode) => set({ buildingMode: mode }),
      toggleBuildingMode: () => set((state) => ({ buildingMode: !state.buildingMode })),
      
      reset: () => set({ 
        shapes: [], 
        nextId: 0 
      }),
      
      // Helper method to add a cube
      addCube: (x, y, z, size = 0.5, material = DEFAULT_MATERIAL) => 
        get().addShape(x, y, z, { size }, material),
    }),
    {
      name: "ow3-shapes", // localStorage key
      partialize: (state) => ({ 
        shapes: state.shapes, 
        nextId: state.nextId, 
        defaultMass: state.defaultMass
      }),
    }
  )
)

export default useShapeStore
