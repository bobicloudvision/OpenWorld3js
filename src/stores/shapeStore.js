import { create } from "zustand"
import { persist } from "zustand/middleware"

const useShapeStore = create(
  persist(
    (set, get) => ({
      // Each shape is an object with an id, position, mass, type, and dimensions
      defaultMass: 100000,
      defaultShapeType: 'cube',
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
      
      addShape: (x, y, z, shapeType = 'cube', dimensions = { size: 0.5 }) =>
        set((state) => ({
          shapes: [
            ...state.shapes,
            { 
              id: state.nextId, 
              position: [x, y, z], 
              mass: state.defaultMass,
              type: shapeType,
              dimensions
            },
          ],
          nextId: state.nextId + 1,
        })),
        
      removeShapeById: (id) =>
        set((state) => ({ shapes: state.shapes.filter((s) => s.id !== id) })),
        
      setDefaultMass: (mass) => set({ defaultMass: mass }),
      setDefaultShapeType: (shapeType) => set({ defaultShapeType: shapeType }),
      setDeleteMode: (mode) => set({ deleteMode: mode }),
      
      reset: () => set({ 
        shapes: [], 
        nextId: 0 
      }),
      
      // Helper methods for different shape types
      addCube: (x, y, z, size = 0.5) => 
        get().addShape(x, y, z, 'cube', { size }),
        
      addCuboid: (x, y, z, width = 1, height = 0.5, depth = 0.5) => 
        get().addShape(x, y, z, 'cuboid', { width, height, depth }),
        
      addCylinder: (x, y, z, radius = 0.25, height = 1) => 
        get().addShape(x, y, z, 'cylinder', { radius, height }),
        
      addCone: (x, y, z, radius = 0.25, height = 1) => 
        get().addShape(x, y, z, 'cone', { radius, height }),
    }),
    {
      name: "ow3-shapes", // localStorage key
      partialize: (state) => ({ 
        shapes: state.shapes, 
        nextId: state.nextId, 
        defaultMass: state.defaultMass,
        defaultShapeType: state.defaultShapeType
      }),
    }
  )
)

export default useShapeStore
