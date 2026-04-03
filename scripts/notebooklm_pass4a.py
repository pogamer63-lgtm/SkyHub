"""
Pass 4A — Add wiki content to NotebookLM Part A notebook using add_text().
Splits wiki_content.md into per-topic sources since Fandom URLs are blocked.
"""
import asyncio
import notebooklm
import re

NOTEBOOK_A_ID = "da1ad161-4814-467e-b96f-f61b754d70a0"
WIKI_FILE = r"E:\pyton\SkyHub\wiki_content.md"
OUTPUT = r"E:\pyton\SkyHub\research_pass4_core.md"

QUESTIONS_A = [
    "List ALL skills in Hypixel SkyBlock with their max level, what stats they give per level, and the primary XP sources for each skill. Include the Hunting skill (max level 25).",
    "What are all the major SkyBlock Level unlock gates? List every important unlock by level number (Level 3, 5, 6, 7, 12, 50, 100). What stat bonuses does leveling give?",
    "What is the complete slayer unlock chain with prerequisites? List each of the 6 bosses, what tier of which previous slayer is needed to unlock each one, max boss tier per slayer, and notable rewards.",
    "Describe the dungeon floor system: exact Catacombs level entry requirement for each floor F1-F7 and MM1-MM7. What are the 5 dungeon classes and what does each one do?",
    "Explain the Heart of the Mountain skill tree: XP required for each tier 1-10, how tokens work, and which nodes are most important for mining progression.",
    "How does Magical Power work? What is the exact formula for the Stats Multiplier? How much MP does each accessory rarity give? Any special accessories with extra MP?",
    "What are the most important pets in SkyBlock for: farming, mining, dungeons, and fishing? For farming, compare Elephant vs Mooshroom Cow FF totals.",
    "Explain the Garden system fully: level cap, XP sources, plot system (how many plots, FF per plot), crop upgrades (tiers and costs), and visitor mechanics.",
    "Explain the Farming Fortune system: what is the formula for extra drops? List the major sources of Farming Fortune (armor, enchants, pets, tools, upgrades).",
    "What are the key features of the Kuudra boss fight? What are the 5 tiers, their reputation requirements, and what armor sets does Kuudra drop?",
    "How does the Rift work? How do you access it (which SkyBlock level)? What is the Motes currency? What is the Vampire Slayer in the Rift (requirement: Globulate Timecharm)?",
    "How do Fairy Souls work now? What is the total count? What rewards do they give? Do they still give stat bonuses?",
]


def split_wiki_sections(filepath: str) -> list[tuple[str, str]]:
    """Split wiki_content.md into (title, content) pairs by ## headers."""
    with open(filepath, encoding="utf-8") as f:
        text = f.read()

    # Split on ## headers
    parts = re.split(r'\n(?=## )', text)
    sections = []
    for part in parts:
        lines = part.strip().split('\n')
        if lines and lines[0].startswith('## '):
            title = lines[0][3:].strip()
            content = '\n'.join(lines)
            if len(content) > 100:  # skip tiny/empty sections
                sections.append((title, content))
    return sections


async def add_text_sources(client, notebook_id: str, sections: list[tuple[str, str]]) -> list[str]:
    source_ids = []
    for title, content in sections:
        print(f"  Adding text: {title} ({len(content)} chars)...")
        try:
            source = await client.sources.add_text(
                notebook_id=notebook_id,
                title=f"SkyBlock Wiki — {title}",
                content=content,
            )
            sid = source.id if hasattr(source, 'id') else str(source)
            print(f"    -> id: {sid}")
            source_ids.append(sid)
        except Exception as e:
            print(f"    -> FAILED: {e}")
        await asyncio.sleep(2)
    return source_ids


async def ask_questions(client, notebook_id: str, questions: list[str]) -> list[tuple[str, str]]:
    results = []
    conv_id = None
    for i, q in enumerate(questions, 1):
        print(f"  Q{i}: {q[:80]}...")
        answer = None
        for attempt in range(3):
            try:
                result = await client.chat.ask(
                    notebook_id=notebook_id,
                    question=q,
                    conversation_id=conv_id,
                )
                answer = result.answer if hasattr(result, 'answer') else str(result)
                if hasattr(result, 'conversation_id') and result.conversation_id:
                    conv_id = result.conversation_id
                print(f"    -> {len(answer)} chars received")
                break
            except Exception as e:
                err = str(e)
                if 'rate' in err.lower() or 'rejected' in err.lower():
                    wait = 15 * (attempt + 1)
                    print(f"    -> Rate limited, waiting {wait}s (attempt {attempt+1}/3)...")
                    await asyncio.sleep(wait)
                else:
                    print(f"    -> FAILED: {e}")
                    answer = f"ERROR: {e}"
                    break
        if answer is None:
            answer = "ERROR: Rate limited after 3 attempts"
        results.append((q, answer))
        await asyncio.sleep(8)
    return results


def save_results(path: str, qa_pairs: list[tuple[str, str]]):
    lines = ["# SkyBlock Deep Research — Part A: Core Systems (Pass 4)", "Generated: 2026-04-01 via NotebookLM (add_text method)\n"]
    for i, (q, a) in enumerate(qa_pairs, 1):
        lines.append(f"## Q{i}: {q}\n")
        lines.append(a)
        lines.append("\n---\n")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Saved {len(qa_pairs)} answers to {path}")


async def main():
    auth = await notebooklm.AuthTokens.from_storage()
    async with notebooklm.NotebookLMClient(auth) as client:

        print("=== Checking existing sources in Part A notebook ===")
        existing = await client.sources.list(notebook_id=NOTEBOOK_A_ID)
        print(f"Existing sources: {len(existing)}")

        if len(existing) == 0:
            print("=== Adding wiki sections as text sources ===")
            sections = split_wiki_sections(WIKI_FILE)
            print(f"Found {len(sections)} sections in wiki_content.md")
            await add_text_sources(client, NOTEBOOK_A_ID, sections)
            print("Waiting 30s for sources to process...")
            await asyncio.sleep(30)
        else:
            print(f"Sources already present ({len(existing)}), skipping add step")

        print("=== Asking questions ===")
        qa = await ask_questions(client, NOTEBOOK_A_ID, QUESTIONS_A)
        save_results(OUTPUT, qa)

    print("\nDone.")


asyncio.run(main())
