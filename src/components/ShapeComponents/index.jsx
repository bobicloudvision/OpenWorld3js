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

export const Cuboid = ({ id, mass = 1000, width = 1, height = 0.5, depth = 0.5, ...props }) => {
  return (
    <BaseShape
      id={id}
      mass={mass}
      shapeType="cuboid"
      dimensions={{ width, height, depth }}
      {...props}
    />
  )
}

export const Cylinder = ({ id, mass = 1000, radius = 0.25, height = 1, ...props }) => {
  return (
    <BaseShape
      id={id}
      mass={mass}
      shapeType="cylinder"
      dimensions={{ radius, height }}
      {...props}
    />
  )
}

export const Cone = ({ id, mass = 1000, radius = 0.25, height = 1, ...props }) => {
  return (
    <BaseShape
      id={id}
      mass={mass}
      shapeType="cone"
      dimensions={{ radius, height }}
      {...props}
    />
  )
}
