import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";

/**
 * Project case studies — version-controlled MDX in `content/projects/*.mdx`.
 *
 * Theme decorates; substance leads. Frontmatter carries the scannable facts a
 * recruiter needs (problem / role / stack / outcome / links); the MDX body holds
 * the longer write-up. `themedFraming` + `spell` + `glyph` carry the Hogwarts skin.
 */
export const Project = defineDocumentType(() => ({
  name: "Project",
  filePathPattern: "projects/**/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    /** Sort order on the Projects index (lower = first). */
    order: { type: "number", required: false, default: 99 },
    /** One-line magical tagline, e.g. "Lumos" or "Divination". */
    spell: { type: "string", required: false },
    /** Plain category label shown on the card, e.g. "AI", "Web Dev", "Full-Stack". */
    category: { type: "string", required: false },
    /** Cover image path (in /public) used as the card background, e.g. "/projects/aura.png". */
    cover: { type: "string", required: false },
    /** External URL the card links to — the live site or repo. */
    link: { type: "string", required: false },
    /** Optional themed framing, e.g. "Divination / crystal ball — see your financial future". */
    themedFraming: { type: "string", required: false },
    /** Plain, scannable one-liner of what it is. */
    summary: { type: "string", required: true },
    problem: { type: "string", required: false },
    role: { type: "string", required: false },
    stack: { type: "list", of: { type: "string" }, required: false, default: [] },
    outcome: { type: "string", required: false },
    /** Array of { label, href } — kept as JSON for flexible link sets. */
    links: { type: "json", required: false },
    /** A single emoji/symbol used on the spellbook card. */
    glyph: { type: "string", required: false },
    /** Optional house association for accenting the card/page subtree. */
    house: {
      type: "enum",
      options: ["neutral", "gryffindor", "slytherin", "ravenclaw", "hufflepuff"],
      required: false,
      default: "neutral",
    },
    status: {
      type: "enum",
      options: ["live", "wip", "placeholder"],
      required: false,
      default: "live",
    },
    published: { type: "boolean", required: false, default: true },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc._raw.flattenedPath.replace(/^projects\//, ""),
    },
  },
}));

export default makeSource({
  contentDirPath: "content",
  documentTypes: [Project],
  // Path alias is provided via tsconfig `paths`; Next resolves it without baseUrl.
  disableImportAliasWarning: true,
  mdx: {
    remarkPlugins: [remarkGfm],
  },
});
