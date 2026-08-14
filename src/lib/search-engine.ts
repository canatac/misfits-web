/**
 * Barrel : point d'entrée public du moteur de recherche.
 *
 * Le module a été découpé en 4 unités cohérentes :
 * - text-utils : normalisation, stripHtml, Levenshtein, matchTerm
 * - matcher    : filtres opérateurs + collecte des highlights
 * - scorer     : ranking par pertinence + facettes
 * - engine     : SearchIndex + fonctions publiques (searchEmails, ...)
 *
 * Le parser (query → AST filtres+termes) vit dans `@/lib/search-parser`.
 * L'API publique reste strictement identique à la version pré-refactor.
 */
export {
  SearchIndex,
  initSearchIndex,
  getSearchIndex,
  searchEmails,
  searchParsed,
} from "./search-engine/engine";
