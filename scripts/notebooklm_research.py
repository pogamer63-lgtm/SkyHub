"""
SkyBlock Deep Research via NotebookLM
Adds wiki sources to existing notebooks, waits for processing, asks questions, saves results.
"""
import asyncio
import notebooklm
import time

NOTEBOOK_A_ID = "da1ad161-4814-467e-b96f-f61b754d70a0"  # Core Systems
NOTEBOOK_B_ID = "810cd4e6-3976-446d-8437-c7a76cfb076c"  # Economy & Content

SOURCES_A = [
    "https://hypixel-skyblock.fandom.com/wiki/Skills",
    "https://hypixel-skyblock.fandom.com/wiki/SkyBlock_Level",
    "https://hypixel-skyblock.fandom.com/wiki/Slayer",
    "https://hypixel-skyblock.fandom.com/wiki/Dungeons",
    "https://hypixel-skyblock.fandom.com/wiki/Heart_of_the_Mountain",
    "https://hypixel-skyblock.fandom.com/wiki/Magical_Power",
    "https://hypixel-skyblock.fandom.com/wiki/Pets",
    "https://hypixel-skyblock.fandom.com/wiki/Essence",
]

SOURCES_B = [
    "https://hypixel-skyblock.fandom.com/wiki/Garden",
    "https://hypixel-skyblock.fandom.com/wiki/Farming_Fortune",
    "https://hypixel-skyblock.fandom.com/wiki/Fishing",
    "https://hypixel-skyblock.fandom.com/wiki/Foraging",
    "https://hypixel-skyblock.fandom.com/wiki/Hunting",
    "https://hypixel-skyblock.fandom.com/wiki/Kuudra",
    "https://hypixel-skyblock.fandom.com/wiki/The_Rift",
    "https://hypixel-skyblock.fandom.com/wiki/Minions",
    "https://hypixel-skyblock.fandom.com/wiki/Reforge",
    "https://hypixel-skyblock.fandom.com/wiki/Fairy_Soul",
]

QUESTIONS_A = [
    "List ALL skills in Hypixel SkyBlock with their max level, what stats they give per level, and the primary XP sources for each skill. Include the new Hunting skill.",
    "What are all the major SkyBlock Level unlock gates? List every important unlock by level number, from Level 1 to the highest known gate.",
    "What is the complete slayer unlock chain with prerequisites? List each of the 6 bosses, what level of which previous slayer is needed to unlock each one, and what armor/weapons each boss tier provides.",
    "Describe ALL dungeon floors F1 through F7 and M1 through M7. What does each floor unlock, what items drop there, and what are the key milestones?",
    "Explain the dungeon class system in detail: all 5 classes, what each class does, stat bonuses per class level, and the current meta recommendation for each game stage.",
    "List ALL Heart of the Mountain nodes for every tier from T1 to T10. For each node include the name, effect, and powder cost. Which nodes are considered must-have?",
    "How does Magical Power scaling work? What is the formula or scaling curve? List all available Power options and describe what each one does.",
    "What are the most important pets in SkyBlock organized by activity (farming, mining, dungeons, slayer, fishing, alchemy)? For each pet, what is the best pet item to equip?",
    "What is the Essence system in dungeons? List all essence types, where they drop, and what each type can be used to upgrade.",
    "What are the S+ score requirements for each dungeon floor? How is the dungeon score calculated (completion time, skill bonuses, deaths, etc.)?",
]

QUESTIONS_B = [
    "Explain the complete Garden system: how to unlock it, all 20 levels and what each gives, the crop upgrade system, visitor rewards, the pest system, and the Greenhouse mutations.",
    "What is Farming Fortune? Give the complete formula and list ALL sources of Farming Fortune: gear enchantments, pets, garden upgrades, Jacob perks, Bestiary, and any other sources.",
    "Explain Jacob's Farming Contests completely: how they work, the medal system (bronze/silver/gold/diamond), unique golds, and what perks or rewards they unlock.",
    "Explain the complete fishing system: all sea creature types, trophy fishing mechanics, the Backwater Bayou island, fishing fortune sources, and fishing armor progression.",
    "What changed in the Foraging skill with the Foraging Update? Explain the new Hunting skill completely — its max level, XP sources, what it unlocks, and how it relates to Foraging.",
    "Explain Kuudra completely: all 5 tiers, access requirements, what each tier drops, the armor progression from Aurora through Molten, and how the Mage/Barbarian faction system works.",
    "Explain the Rift: how to access it via Timecharm, what content exists there, Vampire Slayer location and full mechanics, and the Motes currency and what it can buy.",
    "What are the best money-making methods in current SkyBlock (2025-2026)? Give realistic coins per hour estimates for each major method, organized by investment level (early/mid/late game).",
    "What are the best reforges for combat armor, mining armor, farming armor, and accessories? Include reforge stone names and where to get them.",
    "What are the most important enchantments for a sword, armor pieces, bow, and farming tool? Include the enchantment level and why it matters.",
    "How does the minion system work? Which minions are best for passive income, and what is the optimal minion setup (fuel, compactors, etc.)?",
    "How does the Fairy Soul system work? What is the total number of fairy souls, what are all the exchange bonuses, and where can souls generally be found?",
]

OUTPUT_A = r"E:\pyton\SkyHub\research_pass4_core.md"
OUTPUT_B = r"E:\pyton\SkyHub\research_pass4_economy.md"


async def add_sources(client, notebook_id: str, urls: list[str]) -> list[str]:
    source_ids = []
    for url in urls:
        print(f"  Adding: {url}")
        try:
            source = await client.sources.add_url(
                notebook_id=notebook_id,
                url=url,
                wait=True,
                wait_timeout=180.0,
            )
            print(f"    -> status: {source.status if hasattr(source, 'status') else 'added'} | id: {source.id if hasattr(source, 'id') else '?'}")
            source_ids.append(source.id if hasattr(source, 'id') else str(source))
        except Exception as e:
            print(f"    -> FAILED: {e}")
        await asyncio.sleep(3)
    return source_ids


async def ask_questions(client, notebook_id: str, questions: list[str]) -> list[tuple[str, str]]:
    results = []
    conv_id = None
    for i, q in enumerate(questions, 1):
        print(f"  Q{i}: {q[:80]}...")
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
            results.append((q, answer))
        except Exception as e:
            print(f"    -> FAILED: {e}")
            results.append((q, f"ERROR: {e}"))
        await asyncio.sleep(2)
    return results


def save_results(path: str, title: str, qa_pairs: list[tuple[str, str]]):
    lines = [f"# {title}", f"Generated: 2026-04-01 via NotebookLM\n"]
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

        # ── Part A: Core Systems ──────────────────────────────────────────────
        print("\n=== PART A: Core Systems ===")
        existing_a = await client.sources.list(notebook_id=NOTEBOOK_A_ID)
        if len(existing_a) < len(SOURCES_A):
            print(f"Adding {len(SOURCES_A) - len(existing_a)} new sources...")
            await add_sources(client, NOTEBOOK_A_ID, SOURCES_A[len(existing_a):])
        else:
            print(f"Sources already present: {len(existing_a)}")

        print("Asking questions Part A...")
        qa_a = await ask_questions(client, NOTEBOOK_A_ID, QUESTIONS_A)
        save_results(OUTPUT_A, "SkyBlock Deep Research — Part A: Core Systems", qa_a)

        # ── Part B: Economy & Content ─────────────────────────────────────────
        print("\n=== PART B: Economy & Content ===")
        existing_b = await client.sources.list(notebook_id=NOTEBOOK_B_ID)
        if len(existing_b) < len(SOURCES_B):
            print(f"Adding {len(SOURCES_B) - len(existing_b)} new sources...")
            await add_sources(client, NOTEBOOK_B_ID, SOURCES_B[len(existing_b):])
        else:
            print(f"Sources already present: {len(existing_b)}")

        print("Asking questions Part B...")
        qa_b = await ask_questions(client, NOTEBOOK_B_ID, QUESTIONS_B)
        save_results(OUTPUT_B, "SkyBlock Deep Research — Part B: Economy & Content", qa_b)

    print("\nDone.")


asyncio.run(main())
