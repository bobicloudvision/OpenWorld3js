import { useEffect } from "react"
import useShapeStore from "../stores/shapeStore"

export const ModeIndicator = () => {
  const deleteMode = useShapeStore((state) => state.deleteMode)
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') {
        useShapeStore.getState().setDeleteMode(true)
      }
    }
    
    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        useShapeStore.getState().setDeleteMode(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      background: deleteMode ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)',
      color: 'white',
      padding: '10px 15px',
      borderRadius: '5px',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      zIndex: 1000,
      pointerEvents: 'none',
      minWidth: '200px'
    }}>
      Mode: {deleteMode ? 'DELETE' : 'ADD'}
      <br />
      <small>Hold Shift to delete</small>
      <br />
      <div style={{ marginTop: '8px', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '8px' }}>
        <strong>Keyboard Shortcuts:</strong>
        <br />
        <span style={{ fontSize: '11px' }}>
          C or P: Add Cube
          <br />
          <br />
          <strong>Click Controls:</strong>
          <br />
          Top face: Show grid for precise placement
          <br />
          Side faces: Add adjacent cubes
          <br />
          Alt+Click: Replace cube
          <br />
          Shift+Click: Delete cube
        </span>
      </div>
    </div>
  )
}
