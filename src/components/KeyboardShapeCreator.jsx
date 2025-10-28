import { useEffect } from "react"
import useShapeStore from "../stores/shapeStore"
import useMaterialStore from "../stores/materialStore"

export const KeyboardShapeCreator = () => {
  const addShape = useShapeStore((state) => state.addShape)
  const selectedMaterial = useMaterialStore((state) => state.selectedMaterial)
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger if no modifier keys are pressed
      if (e.ctrlKey || e.metaKey || e.altKey) return
      
      switch (e.key.toLowerCase()) {
        case 'c':
          // Add cube at origin (press C)
          addShape(0, 1, 0, { size: 0.5 }, selectedMaterial)
          break
        case 'p':
          // Add cube at origin (press P)
          e.preventDefault() // Prevent page scroll
          addShape(0, 1, 0, { size: 0.5 }, selectedMaterial)
          break
        default:
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [addShape, selectedMaterial])
  
  return null // This component doesn't render anything
}
