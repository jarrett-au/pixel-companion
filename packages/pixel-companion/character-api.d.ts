import type * as React from 'react';

export type PixelCompanionMode = 'walk' | 'sit' | 'stretch' | 'jump' | 'squeeze' | 'sleep' | 'drag';

export interface PixelCharacterSize {
  /** Rendered actor width in CSS pixels. */
  width: number;
  /** Rendered actor height in CSS pixels. */
  height: number;
  /** Distance from the actor's top to the platform under its feet. */
  footOffset: number;
}

export type PixelCharacterSizes = {
  default: PixelCharacterSize;
} & Partial<Record<PixelCompanionMode, PixelCharacterSize>>;

export interface PixelCharacterRenderProps {
  mode: PixelCompanionMode;
  direction: -1 | 1;
  React: typeof React;
}

export interface PixelCharacter {
  version: 1;
  /** Stable, unique lowercase slug used for selection and persistence. */
  id: string;
  name: string;
  sizes: PixelCharacterSizes;
  /** Optional character-scoped CSS. Animation names must be globally unique. */
  styles?: string;
  render(props: PixelCharacterRenderProps): React.ReactNode;
}

export interface PixelCharacterSummary {
  id: string;
  name: string;
}

export interface PixelCompanionRegistry {
  version: 1;
  register(character: PixelCharacter): () => void;
  get(id: string): PixelCharacter | null;
  list(): PixelCharacterSummary[];
  selected(): string;
  select(id: string): void;
  subscribe(listener: () => void): () => void;
}

declare global {
  interface Window {
    PixelCompanion?: PixelCompanionRegistry;
  }
}
