import { BaseShape } from "./BaseShape"

export const Cube = ({ id, mass = 1000, size = 0.5, ...props }) => {
  return (
    <BaseShape
      id={id}
      mass={mass}
      shapeType="cube"
      dimensions={{ size }}
      {...props}
    />
  )
}
