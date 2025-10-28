import { useEffect } from "react"
import useShapeStore from "../stores/shapeStore"

export const KeyboardShapeCreator = () => {
  const addShape = useShapeStore((state) => state.addShape)
  const defaultShapeType = useShapeStore((state) => state.defaultShapeType)
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger if no modifier keys are pressed (except for our specific shortcuts)
      if (e.ctrlKey || e.metaKey || e.altKey) return
      
      switch (e.key.toLowerCase()) {
        case 'c':
          // Add cube at origin
          addShape(0, 1, 0, 'cube', { size: 0.5 })
          break
        case 'b':
          // Add cuboid at origin
          addShape(0, 1, 0, 'cuboid', { width: 1, height: 0.5, depth: 0.5 })
          break
        case 'y':
          // Add cylinder at origin
          addShape(0, 1, 0, 'cylinder', { radius: 0.25, height: 1 })
          break
        case 'o':
          // Add cone at origin
          addShape(0, 1, 0, 'cone', { radius: 0.25, height: 1 })
          break
        case ' ':
          // Space bar - add currently selected shape type
          e.preventDefault() // Prevent page scroll
          switch (defaultShapeType) {
            case 'cube':
              addShape(0, 1, 0, 'cube', { size: 0.5 })
              break
            case 'cuboid':
              addShape(0, 1, 0, 'cuboid', { width: 1, height: 0.5, depth: 0.5 })
              break
            case 'cylinder':
              addShape(0, 1, 0, 'cylinder', { radius: 0.25, height: 1 })
              break
            case 'cone':
              addShape(0, 1, 0, 'cone', { radius: 0.25, height: 1 })
              break
          }
          break
        default:
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [addShape, defaultShapeType])
  
  return null // This component doesn't render anything
}
