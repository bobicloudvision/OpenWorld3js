import { Cube } from "./ShapeComponents"
import useShapeStore from "../stores/shapeStore"

export const Shapes = () => {
  const shapes = useShapeStore((state) => state.shapes)
  
  return shapes.map(({ id, position, mass, dimensions }) => (
    <Cube key={id} id={id} mass={mass} position={position} size={dimensions.size} />
  ))
}
