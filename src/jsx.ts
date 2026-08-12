export const Fragment = Symbol.for("holidaylens.fragment");

type Child = SatoriElement | string | number | null | undefined | boolean | Child[];

export interface SatoriElement {
  type: string;
  props: Record<string, unknown> & { children?: unknown };
}

function normalizeChildren(children: Child[]): unknown {
  const flat = children
    .flat(Infinity as 1)
    .filter((c) => c !== null && c !== undefined && c !== false && c !== true);
  if (flat.length === 0) return undefined;
  if (flat.length === 1) return flat[0];
  return flat;
}

export function h(
  type: string | typeof Fragment,
  props: Record<string, unknown> | null,
  ...children: Child[]
): SatoriElement {
  const merged: Record<string, unknown> = { ...(props ?? {}) };
  const kids = children.length > 0 ? normalizeChildren(children) : merged.children;
  merged.children = kids;
  if (type === Fragment) {
    return { type: "div", props: { style: { display: "flex" }, children: kids } };
  }
  return { type, props: merged };
}

declare global {
  namespace JSX {
    type Element = SatoriElement;
    interface IntrinsicElements {
      [elem: string]: Record<string, unknown>;
    }
  }
}
