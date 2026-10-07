/**
 * components/ui/FalseCeilingCollection.tsx
 *
 * Backward-compatibility shim. The generic collection component has been
 * renamed to MaterialCollection (see ./MaterialCollection.tsx). All
 * collections now render through MaterialCollection — False Ceiling,
 * Artificial Grass, Folding Doors, PVC Wall Panels series, and future
 * additions.
 */

export { default } from "./MaterialCollection";
export type {
  CollectionCopy,
  CollectionStats,
  MaterialCollectionProps,
} from "./MaterialCollection";
