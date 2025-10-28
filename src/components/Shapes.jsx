import { Cube, Cuboid, Cylinder, Cone } from "./ShapeComponents"
import useShapeStore from "../stores/shapeStore"

export const Shapes = () => {
  const shapes = useShapeStore((state) => state.shapes)
  
  return shapes.map(({ id, position, mass, type, dimensions }) => {
    const commonProps = { id, mass, position }
    
    switch (type) {
      case 'cube':
        return <Cube key={id} {...commonProps} size={dimensions.size} />
      case 'cuboid':
        return <Cuboid key={id} {...commonProps} width={dimensions.width} height={dimensions.height} depth={dimensions.depth} />
      case 'cylinder':
        return <Cylinder key={id} {...commonProps} radius={dimensions.radius} height={dimensions.height} />
      case 'cone':
        return <Cone key={id} {...commonProps} radius={dimensions.radius} height={dimensions.height} />
      default:
        return <Cube key={id} {...commonProps} size={dimensions.size} />
    }
  })
}
