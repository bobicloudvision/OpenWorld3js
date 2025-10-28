import useMaterialStore from "../stores/materialStore"
import { getAllMaterials } from "../utils/materials"

// Individual material preview component
const MaterialPreview = ({ material, isSelected, onClick }) => {
  return (
    <div 
      className={`material-preview ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      title={material.name}
    >
      <div className="material-preview-texture">
        <div 
          className="texture-sample"
          style={{
            backgroundColor: material.color,
            backgroundImage: `url(${material.texture})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      </div>
      <div className="material-preview-name">{material.name}</div>
    </div>
  )
}

// Main material palette component
export const MaterialPalette = () => {
  const selectedMaterial = useMaterialStore((state) => state.selectedMaterial)
  const setSelectedMaterial = useMaterialStore((state) => state.setSelectedMaterial)
  const allMaterials = getAllMaterials()
  
  return (
    <div className="material-palette">
      <div className="material-palette-header">
        <h3>Materials</h3>
        <div className="selected-material-info">
          Selected: <span className="selected-material-name">{selectedMaterial.name}</span>
        </div>
      </div>
      
      <div className="material-palette-grid">
        {allMaterials.map((material) => (
          <MaterialPreview
            key={material.id}
            material={material}
            isSelected={selectedMaterial.id === material.id}
            onClick={() => setSelectedMaterial(material.id)}
          />
        ))}
      </div>
      
      <div className="material-palette-instructions">
        <p>Click a material to select it for new shapes</p>
      </div>
    </div>
  )
}
