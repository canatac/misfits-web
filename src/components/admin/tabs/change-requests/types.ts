// Types partagés pour les sous-composants de ChangeRequestsTab.
// Le contexte parent est intentionnellement large (record open) — il sera
// resserré au fil des itérations. Ces alias évitent d'exposer `any` dans
// les signatures des sous-composants.

export type CtxAny = Record<string, unknown>;

// Alias explicite pour les objets `unknown` traversés dans le JSX. Les blocs
// UI ne connaissent que peu de champs (id, title, status…). Les typer plus
// finement est une itération à part.
export type Loose = Record<string, unknown> & { [k: string]: unknown };
