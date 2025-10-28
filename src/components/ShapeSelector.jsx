import { useState, useEffect } from "react"
import useShapeStore from "../stores/shapeStore"

export const ShapeSelector = () => {
  const [selectedShape, setSelectedShape] = useState('cube')
  const setDefaultShapeType = useShapeStore((state) => state.setDefaultShapeType)
  const defaultShapeType = useShapeStore((state) => state.defaultShapeType)
  
  useEffect(() => {
    setSelectedShape(defaultShapeType)
  }, [defaultShapeType])
  
  const handleShapeChange = (shapeType) => {
    setSelectedShape(shapeType)
    setDefaultShapeType(shapeType)
  }
  
  const shapes = [
    { type: 'cube', label: 'Cube', icon: '⬜' },
    { type: 'cuboid', label: 'Cuboid', icon: '📦' },
    { type: 'cylinder', label: 'Cylinder', icon: '🥤' },
    { type: 'cone', label: 'Cone', icon: '🔺' }
  ]
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Shape Selector</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {shapes.map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => handleShapeChange(type)}
            style={{
              background: selectedShape === type ? '#4CAF50' : 'transparent',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (selectedShape !== type) {
                e.target.style.background = '#333'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedShape !== type) {
                e.target.style.background = 'transparent'
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#ccc' }}>
        Click on shapes to add new ones
        <br />
        Hold Shift + Click to delete
      </div>
    </div>
  )
}
