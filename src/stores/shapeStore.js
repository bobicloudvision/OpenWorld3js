import { create } from "zustand"
import { persist } from "zustand/middleware"

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
          dimensions: { size: 0.5 }
        }
      ],
      nextId: 1,
      deleteMode: false,
      
      addShape: (x, y, z, dimensions = { size: 0.5 }) =>
        set((state) => ({
          shapes: [
            ...state.shapes,
            { 
              id: state.nextId, 
              position: [x, y, z], 
              mass: state.defaultMass,
              type: 'cube',
              dimensions
            },
          ],
          nextId: state.nextId + 1,
        })),
        
      removeShapeById: (id) =>
        set((state) => ({ shapes: state.shapes.filter((s) => s.id !== id) })),
        
      setDefaultMass: (mass) => set({ defaultMass: mass }),
      setDeleteMode: (mode) => set({ deleteMode: mode }),
      
      reset: () => set({ 
        shapes: [], 
        nextId: 0 
      }),
      
      // Helper method to add a cube
      addCube: (x, y, z, size = 0.5) => 
        get().addShape(x, y, z, { size }),
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
