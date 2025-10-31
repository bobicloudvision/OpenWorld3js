import { create } from 'zustand'

export const useEffectsStore = create((set) => ({
  effects: [],
  addEffect: (effect) => set((state) => ({ effects: [...state.effects, effect] })),
  removeEffect: (id) => set((state) => ({ effects: state.effects.filter((e) => e.id !== id) })),
}))

export function addVfx(position, magicType, radius = 3, duration = 2000) {
  const id = Date.now() + Math.random()
  useEffectsStore.getState().addEffect({ id, position, magicType, radius, duration })
  setTimeout(() => {
    useEffectsStore.getState().removeEffect(id)
  }, duration)
}
