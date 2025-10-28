import { useEffect } from "react"
import useShapeStore from "../stores/shapeStore"
import useMaterialStore from "../stores/materialStore"

export const KeyboardShapeCreator = () => {
  const addShape = useShapeStore((state) => state.addShape)
  const selectedMaterial = useMaterialStore((state) => state.selectedMaterial)
  const buildingMode = useShapeStore((state) => state.buildingMode)
  const toggleBuildingMode = useShapeStore((state) => state.toggleBuildingMode)
  const togglePaletteVisibility = useMaterialStore((state) => state.togglePaletteVisibility)
  const setPaletteVisibility = useMaterialStore((state) => state.setPaletteVisibility)
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger if no modifier keys are pressed
      if (e.ctrlKey || e.metaKey || e.altKey) return
      
      switch (e.key.toLowerCase()) {
        case 'b':
          // Toggle building mode (press B)
          e.preventDefault()
          const newBuildingMode = !buildingMode
          toggleBuildingMode()
          // Automatically show/hide palette based on building mode
          setPaletteVisibility(newBuildingMode)
          break
        case 'm':
          // Toggle material palette (press M)
          e.preventDefault()
          togglePaletteVisibility()
          break
        case 'c':
          // Add cube at origin (press C) - only if building mode is enabled
          if (buildingMode) {
            addShape(0, 1, 0, { size: 0.5 }, selectedMaterial)
          }
          break
        case 'p':
          // Add cube at origin (press P) - only if building mode is enabled
          if (buildingMode) {
            e.preventDefault() // Prevent page scroll
            addShape(0, 1, 0, { size: 0.5 }, selectedMaterial)
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
  }, [addShape, selectedMaterial, buildingMode, toggleBuildingMode, togglePaletteVisibility, setPaletteVisibility])
  
  return null // This component doesn't render anything
}
