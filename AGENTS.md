<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Meta Research — NotebookLM First

When researching Hypixel SkyBlock meta (upgrade paths, progression advice, current best-in-slot, patch changes):

**PREFERRED: Use NotebookLM** (notebooklm.google.com) via WebFetch/WebSearch to synthesize YouTube video transcripts, wiki pages, and community sources into structured research notes.

**Fallback only if NotebookLM is inaccessible:** Use direct WebSearch + WebFetch over YouTube descriptions, the Hypixel SkyBlock Wiki, patch notes, and community forums.

Store all research results in:
- `META_SOURCES.md` — sources with date, confidence score, topic tags
- `UPGRADE_RULES.json` — structured rules derived from research
- `DISPUTED_FACTS.md` — uncertain or conflicting information
- `LAST_META_REFRESH.md` — audit log of what was checked and when
