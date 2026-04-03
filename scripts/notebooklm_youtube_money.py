"""
NotebookLM YouTube SkyBlock Research — Full Overnight Run
Notebook ID: 5db06ce7-ad0a-465c-b7ea-ad551c728dca

210 questions × 3 min = 10.5 hours minimum runtime.
With rate-limit retries: 12-14 hours. Perfect overnight.
Saves progress after every question — safe to interrupt at any time.
"""
import asyncio
import notebooklm
from datetime import datetime

OUTPUT_FILE = r"E:\pyton\SkyHub\research_youtube_money.md"
NOTEBOOK_ID = "5db06ce7-ad0a-465c-b7ea-ad551c728dca"
START_FROM = 81   # Resume from this question number (1-indexed)

WAIT_BETWEEN_QUESTIONS = 180        # 3 minutes between questions
# Long waits so the script survives through the nightly quota reset.
# If rate-limited: tries every 30 min up to 3 hours before giving up on that question.
RATE_LIMIT_WAITS = [300, 600, 1800, 3600, 3600, 3600]  # 5, 10, 30, 60, 60, 60 min

QUESTIONS = [

    # ════════════════════════════════════════════════════════════
    # MONEY MAKING — GENERAL
    # ════════════════════════════════════════════════════════════
    "What are the top 10 money-making methods in Hypixel SkyBlock right now? Rank them by coins/hr. For each: exact coins/hr estimate, investment required, best game stage, and key tips.",
    "What is the recommended money-making progression for a brand new player going from 0 to 1M coins? What methods should they use first?",
    "How does a player go from 1M to 10M coins? What methods are most efficient at this stage and what should they invest in first?",
    "How does a player go from 10M to 100M coins? What mid-game methods unlock at this stage and what gear/skills are needed?",
    "How does a player go from 100M to 1B coins? What methods require this investment level and what is the expected return?",
    "What is the single best investment a player can make at each stage: early (under 1M), mid (1M-50M), late (50M-500M), and endgame (500M+)?",
    "What are the biggest mistakes players make that keep their income low? List the most common errors and how to fix them.",
    "What is the best daily routine for maximizing coins? What activities should players do every day, and in what order?",
    "Which money-making methods are most consistent vs. luck-based? Which methods have the most stable income?",
    "How much can a fully maxed player make per hour from each major income source? Give realistic estimates for: farming, mining, dungeons, slayer, fishing.",

    # ════════════════════════════════════════════════════════════
    # MONEY MAKING — SPECIFIC METHODS
    # ════════════════════════════════════════════════════════════
    "Explain Bazaar flipping in detail. How do you find good flips, what margins are worth targeting, and how does income scale with capital? Give examples of items to flip.",
    "Explain Auction House flipping. How is it different from Bazaar flipping, what items are best, and how much can players make?",
    "What is Ghost farming? How does it work, what gear is needed, what drops can players expect, and how much does it earn per hour?",
    "Explain passive minion income in detail. What are the best minion types (Clay, Lapis, Sugar Cane, etc.), what tier should they be, what fuel and upgrades maximize coins per day?",
    "How does the Rift economy work? What are the best ways to make Motes, and can Rift items be converted to coins on the main island?",
    "What are the best crafting methods for income? Which items are worth crafting and selling vs. just selling raw materials?",
    "What Bazaar items have the best craft margin (buy raw materials, craft, sell)? Give specific examples with estimated profit.",
    "How does fishing income work? What are trophy fish, how much do they sell for, and what setup maximizes fishing coins per hour?",
    "What are the best ways to earn Bits and what is the best way to spend them for maximum coin value?",
    "Are Skyblock events worth doing for income? Which events give the most coins/time and how should players prepare?",

    # ════════════════════════════════════════════════════════════
    # FARMING — BASICS & SETUP
    # ════════════════════════════════════════════════════════════
    "What is Farming Fortune and how does the formula work? Explain exactly how FF translates to extra drops.",
    "List every single source of Farming Fortune with exact values: Farmhand skill perk, garden plots, Jacob perk, crop upgrades, armor, enchants, pets, tools.",
    "What is the best farming setup for early-game players (Farming 1-20)? What tools, pets, and strategies should they use?",
    "What is the best farming setup for mid-game players (Farming 20-40)? What armor, pets, tools, and enchants are optimal?",
    "What is the best endgame farming setup (Farming 50+)? What is Helianthus armor, when should players switch to it, and what does it cost?",
    "Compare the Elephant pet vs Mooshroom Cow pet for farming. Which gives more Farming Fortune, which gives more coins, and which should players use at each stage?",
    "What farming tools are best at each stage? Compare: rookie hoe, advanced hoe, Euclid's Shovel, Theoretical Hoe, and specialized hoes per crop.",
    "What are the best farming enchantments? List the priority order for: Cultivating, Dedication, Harvesting, Replenish, Turbo-Crop variants, and others.",
    "What are the best farming reforges for maximizing Farming Fortune?",
    "Explain the Farmhand skill bonus. How much FF does each Farming level give and what is the max at Farming 60?",

    # ════════════════════════════════════════════════════════════
    # FARMING — JACOB & GARDEN
    # ════════════════════════════════════════════════════════════
    "Explain Jacob's Farming Contests completely. How do medals work (Bronze/Silver/Gold/Diamond), how is score calculated, and what are the best strategies for getting Diamond medals?",
    "What are all the Jacob Contest perks and in what order should players unlock them? What does each perk do?",
    "How do Unique Gold Medals work and why do they matter for raising the Farming level cap beyond 50?",
    "Explain the Garden system from the beginning. How do you unlock it, how does XP work, what are the 15 levels, and what do you unlock at each level?",
    "How does the plot system work in the Garden? How many plots are there total, how do you unlock them, and how much Farming Fortune do they give?",
    "Explain Garden crop upgrades. How many tiers are there, how much FF does each tier give, what does it cost (copper), and which crop upgrades are highest priority?",
    "How does the Garden visitor system work? What visitors should players prioritize and what items do they need?",
    "What is copper in the Garden and how do players earn it efficiently? What is the best way to spend copper?",
    "What is the Pesterminator enchantment and how does it interact with Garden pests? Is it worth using?",
    "Explain the Farming level cap system. How do players raise the cap from 50 to 60, and what Jacob milestones are required?",

    # ════════════════════════════════════════════════════════════
    # FARMING — CROPS
    # ════════════════════════════════════════════════════════════
    "Which crops give the most coins per hour at early game (no Garden, Farming 1-20)?",
    "Which crops give the most coins per hour at mid game (Garden level 3-7, Farming 20-40)?",
    "Which crops give the most coins per hour at endgame (max Garden, Farming 50-60, Helianthus armor)?",
    "Deep dive on Wheat farming: what is the coins/hr at different FF levels, what enchants/pets are best, and what collection milestones matter?",
    "Deep dive on Sugar Cane farming: setup, coins/hr at different stages, and tips for maximizing yield.",
    "Deep dive on Mushroom farming: why is it popular for XP, how much does it earn, and what is the best setup?",
    "Deep dive on Pumpkin and Melon farming: are they worth doing for coins, what is the setup, and when do they become viable?",
    "Deep dive on Nether Wart farming: setup, coins/hr, and how it compares to other crops.",
    "Deep dive on Cocoa Bean farming: is it worth it, what is the setup, and how does it compare?",
    "What are the most important Farming collection milestones to reach first? Which collections unlock the best recipes or rewards?",

    # ════════════════════════════════════════════════════════════
    # MINING — HOTM & BASICS
    # ════════════════════════════════════════════════════════════
    "Explain the Heart of the Mountain (HOTM) system completely. How does XP work, what are the 10 tiers, and what XP is needed for each?",
    "What HOTM nodes should players unlock first at HOTM 1-3? Which nodes give the most value early?",
    "What HOTM nodes should players unlock at HOTM 4-6? What changes at these tiers and what is the priority order?",
    "What HOTM nodes should players unlock at HOTM 7-10? What are the most powerful T7-T10 nodes and what do they unlock?",
    "What are HOTM Token abilities (Peak of the Mountain, etc.) and which should players unlock first?",
    "Explain how Mining powder works. What is Mithril powder, Gemstone powder, Glacite powder, and how does each get spent?",
    "What are the best ways to farm Mining powder efficiently? Compare commissions vs. active mining.",
    "What is the Glacite Tunnels area? How do you access it (HOTM level required), what do you do there, and how much XP/powder can players earn?",
    "What are Glacite Commissions? How do they work, what XP do they give, and why are they considered essential for HOTM progression?",
    "What is the Crystal Hollows? How do players unlock it, what activities are there, and what is the best reason to go there?",

    # ════════════════════════════════════════════════════════════
    # MINING — INCOME & GEAR
    # ════════════════════════════════════════════════════════════
    "Explain gemstone mining in detail. What types of gemstones are there, which are most profitable, and how does the Pristine stat affect drops?",
    "What is the best gemstone mining setup? What armor, drill, pets, and HOTM nodes are needed for maximum coins/hr?",
    "What is Divan's Armor and Divan's Drill? How are they obtained, what do they cost, and are they worth the investment?",
    "Compare income from gemstone mining at HOTM 5, HOTM 7, and HOTM 10 setups. How much do earnings increase at each stage?",
    "What are the best mining pets and when should players switch between them? Compare Scatha, Mole, Glacite Golem, Bat, Blue Whale.",
    "What mining enchantments are most important? List priority order for armor and tools.",
    "What is the best early mining income method for players at HOTM 1-3 who can't do gemstone mining yet?",
    "Explain Mithril mining. How much does it earn, when is it worth doing, and what setup is best?",
    "What are the best ways to spend Mithril Powder, Gemstone Powder, and Glacite Powder?",
    "How does the Mining skill level affect income? What unlocks at Mining 20, 30, 40, 50, 60?",

    # ════════════════════════════════════════════════════════════
    # DUNGEONS — CLASSES & META
    # ════════════════════════════════════════════════════════════
    "Explain the 5 dungeon classes: Berserker, Archer, Mage, Tank, Healer. What does each do and when is each used?",
    "What is the dungeon class meta? Which class is best for beginners, which for mid-game, and which for endgame?",
    "When should players switch from Berserker to Archer or Mage? What triggers the transition and what gear is needed?",
    "Explain the Berserker class in detail. What is the playstyle, best gear, best pets, and how does it perform at F5 vs F7 vs M7?",
    "Explain the Archer class in detail. What is the playstyle, best gear, best pets, and when does it outperform Berserker?",
    "Explain the Mage class in detail. What is the playstyle, what spells are used, what gear is optimal, and when does it shine?",
    "Explain the Tank class. Is it relevant in the current meta? When would players use Tank?",
    "Explain the Healer class. Is it used in the current meta? What does it provide to a party?",
    "How do class levels work in dungeons? How is class XP earned, and what level should each class be before attempting each floor?",
    "What is the best way to level dungeon classes quickly? Which floor gives the most class XP per hour?",

    # ════════════════════════════════════════════════════════════
    # DUNGEONS — FLOORS & INCOME
    # ════════════════════════════════════════════════════════════
    "Give a complete guide for each dungeon floor F1-F7: boss name, entry requirement, key drops, and recommended class level.",
    "What is the best floor to farm for coins at mid-game (Catacombs 15-25)? Compare F4, F5, F6.",
    "What makes F5 (Livid) valuable? What drops make it worth farming, how much can players earn per run, and what is the minimum setup needed?",
    "What makes F7 (Necron) the endgame dungeon? What drops, how much per run, and what gear is needed for fast clears?",
    "Explain Master Mode dungeons. What are the entry requirements for MM1-MM7, and what makes MM7 the most profitable?",
    "What is S+ rank in dungeons and why does it matter? How do players consistently achieve S+ rank?",
    "Explain the dungeon secrets system. How many secrets are in each floor, how do they affect loot, and how do players find them efficiently?",
    "What is dungeon essence and how is it spent? Which essence types are most valuable and what should players spend it on first?",
    "What are the most valuable drops from dungeons? List the top 10 most valuable dungeon items and which floors they come from.",
    "How does party composition affect dungeon income? What is the optimal 5-man composition for fast F7/M7 runs?",

    # ════════════════════════════════════════════════════════════
    # SLAYER
    # ════════════════════════════════════════════════════════════
    "What is the correct slayer unlock order? What are the prerequisites for unlocking Spider, Wolf, Enderman, Blaze, and Vampire slayer?",
    "Give a complete guide to Zombie (Revenant Horror) slayer. What tier should players farm, what drops are most valuable, and how much can they earn per hour?",
    "Give a complete guide to Spider (Tarantula Broodfather) slayer. Best tier, drops, income, and required gear.",
    "Give a complete guide to Wolf (Sven Packmaster) slayer. Best tier, drops, income, and required gear.",
    "Give a complete guide to Enderman (Voidgloom Seraph) slayer. What makes Enderman hard, what drops are valuable, and what gear is needed?",
    "Give a complete guide to Blaze (Inferno Demonlord) slayer. What makes Blaze slayer unique, what are Crimson Essence drops, and how much can players earn?",
    "Give a complete guide to Vampire (Riftstalker Bloodfiend) slayer. How do you access it, how does the RNG Meter work, what are the best drops?",
    "Compare all 6 slayers for coins per hour at T4. Which is most profitable, which is easiest, and which gives the best items?",
    "What is the minimum gear requirement for efficiently killing each slayer boss at T4? What stats (HP, Strength, Crit Damage) are needed?",
    "How does the Slayer RNG Meter work? Which slayers have it, how is it filled, and what guaranteed drops does it give?",

    # ════════════════════════════════════════════════════════════
    # GEAR PROGRESSION
    # ════════════════════════════════════════════════════════════
    "What is the complete armor progression path from start to endgame? List every set in order with cost and what it unlocks.",
    "What are Dragon Armor sets? Which dragons drop which sets, what do the sets do, and which is most useful?",
    "What is Shadow Assassin armor? How is it obtained, what does it cost, and why is it the key mid-game set?",
    "What is Necron's armor? What are the pieces, what does the set bonus do, and why is it the best dungeon set?",
    "Explain the Kuudra armor sets (Aurora, Terror, Crimson, Fervor, Molten). What are the differences and which should players target first?",
    "What is the best weapon progression? List weapons in order from early to endgame: Livid Dagger, Shadow Fury, Hyperion, Valkyrie, etc.",
    "What is Hyperion and why is it so valuable? How is it crafted, what does it cost, and what makes it the best weapon?",
    "Explain equipment slots (Necklace, Cloak, Belt, Bracelet, Gloves, Gauntlet). What are the best pieces at each stage?",
    "What are reforges and how do they work? Which reforges are best for combat armor, farming armor, and accessories?",
    "What is the best armor for each activity: general combat, dungeons, farming, mining, fishing? List the top choice for each.",

    # ════════════════════════════════════════════════════════════
    # ACCESSORIES & MAGICAL POWER
    # ════════════════════════════════════════════════════════════
    "Explain the Magical Power system completely. How does it work, what does the Stats Multiplier formula do, and why does it matter?",
    "What are the best accessories to get first for players with under 100 Magical Power?",
    "What are the best accessories for players building toward 500+ Magical Power? List the highest MP accessories and their sources.",
    "What are Crimson Isle Power Stones? How do they work, which Powers should players pick first, and what stats do they give?",
    "What is the Tuning Point system? How do Tuning Points work, how many can players get, and which stats should they spend them on?",
    "What accessories come from slayers and why are they important? List the key slayer accessories and their Magical Power.",
    "What are the best accessory upgrades per coin spent? Which accessories have the best MP/cost ratio?",
    "How does the accessory reforge system interact with accessories now (post Crimson Isle changes)?",
    "What is the maximum possible Magical Power and how close can a typical endgame player get?",

    # ════════════════════════════════════════════════════════════
    # PETS
    # ════════════════════════════════════════════════════════════
    "What are the best pets for each major activity: farming, mining, dungeons (each class), slayer, fishing, general combat?",
    "How does pet leveling work? What XP tables apply, how does rarity affect max level, and what is the best way to level pets?",
    "What are the best sources of pet XP? How can players level pets efficiently?",
    "Explain the Golden Dragon pet. Why is it considered the best combat pet, how is it obtained, and at what level does it become useful?",
    "What is the Scatha pet and why is it valuable for mining? How rare is it and what does it do at level 100?",
    "What are Pet Items and how do they work? What are the best pet items and which pets should they go on?",
    "Explain the Swappable Pet Items system (added in patch 0.24.1). What changed and how does it affect costs?",
    "Which Legendary pets are most worth investing in for a mid-game player? Which give the best value?",
    "What pets are best for a beginner player who can't afford Legendary pets yet?",
    "How does the Black Cat pet help in dungeons? Is it worth getting and at what level does it become effective?",

    # ════════════════════════════════════════════════════════════
    # SKILLS & PROGRESSION
    # ════════════════════════════════════════════════════════════
    "What is the most important skill to level first for a new player and why?",
    "What is the most efficient method for leveling each skill: Farming, Mining, Combat, Foraging, Fishing, Enchanting, Alchemy, Taming?",
    "How does the Combat skill level affect player stats and income? What unlocks at Combat 20, 30, 40, 50?",
    "How does Enchanting skill affect gameplay? What does it unlock and why is it important for mid-game players?",
    "How does Taming skill affect pets? What bonuses does each level give?",
    "What is the Hunting skill? How was it added, what does it do, how is it leveled, and why is it valuable?",
    "What is the Foraging skill? What stats does it give per level and how does it interact with the Foraging Update?",
    "How does skill average affect progression? Why do streamers always emphasize having a high skill average?",
    "What is the SkyBlock Level system? How is it calculated, what are the most important level gates (5, 7, 12, etc.)?",
    "What are the fastest ways to gain SkyBlock XP? Which activities give the most XP per hour?",

    # ════════════════════════════════════════════════════════════
    # SPECIFIC CONTENT AREAS
    # ════════════════════════════════════════════════════════════
    "Give a complete guide to Kuudra. What are the 5 tiers, how do you access each, what gear is needed, and what are the best drops?",
    "How much coins/hr can players expect from Kuudra T5? What is the setup required and what drops make it valuable?",
    "Give a complete guide to The Rift. How do you access it, what is Motes currency, what are the main activities, and what can players bring back to the main island?",
    "Explain the Crimson Isle completely. What zones are there, what activities, what currency (Motes/Crimson Essence), and what are the best reasons to go there?",
    "What is the Dwarven Mines area and what are the best activities there for mid-game players?",
    "What is the Foraging Update (Part I, June 2025)? What changed about Foraging, what new areas were added, and what new content did it bring?",
    "What is the Greenhouse and what mutations can happen there? What are Sunflower, Moonflower, and Wild Rose mutations?",
    "What is Backwater Bayou? How do you access it, what activities are there, and what drops are most valuable?",
    "Explain trophy fishing. What are trophy fish, where do you catch them, how much do they sell for, and what setup is needed?",
    "What is the best fishing setup for trophy fish? What rods, reels, bait, and pet are needed?",

    # ════════════════════════════════════════════════════════════
    # COLLECTIONS, MINIONS & ISLAND
    # ════════════════════════════════════════════════════════════
    "What are the most important collections to complete first? Which collections unlock the most valuable recipes or items?",
    "Explain the minion system. How many slots can players unlock, what is the maximum, and how do unique minions unlock slots?",
    "What is the best minion island setup for passive income? What combination of minion types, tiers, fuel, and upgrades maximizes coins per day?",
    "Compare the top passive income minions: Clay, Lapis, Sugar Cane, Mushroom, Diamond. What are the coins/day for each at max tier?",
    "What minion upgrades are most important? Compare Super Compactor 3000, Enchanted Hopper, Diamond Spreading, and fuel types.",
    "What is the best fuel for minions? Compare Enchanted Lava Bucket, Hamster Wheel, Foul Flesh, and Everburning Flame.",
    "When is it worth upgrading a minion from tier X to tier X+1? What is the coin/day improvement per tier?",
    "What collection milestones unlock the most valuable crafting recipes? Which are worth rushing?",
    "How does the Bazaar Community Shop work and what is worth buying from it?",
    "What are the best island upgrades to buy from the Community Shop?",

    # ════════════════════════════════════════════════════════════
    # ENCHANTMENTS & REFORGES DEEP DIVE
    # ════════════════════════════════════════════════════════════
    "What are the most important sword enchantments in order of priority? List the top 10 with what they do and why each matters.",
    "What are the most important armor enchantments in order of priority? List the top 10.",
    "What are the best bow enchantments for Archer class?",
    "What are the best enchantments for farming tools (hoes, axes)?",
    "What are the best enchantments for mining tools (pickaxes)?",
    "What are the best enchantments for fishing rods?",
    "Explain the Reforge system completely. How do reforges work, where do you apply them, and what is the reforge stone system?",
    "What are the best combat reforges for swords and armor at mid-game (Fierce, Renowned, etc.)?",
    "What reforges should endgame players use? What is the current BIS reforge setup for dungeons?",
    "What are the best accessory reforges and what stats do they prioritize?",

    # ════════════════════════════════════════════════════════════
    # SPECIFIC UPGRADE DECISIONS
    # ════════════════════════════════════════════════════════════
    "A player has 10M coins and is mid-game with Farming 25. What is the single best thing to spend it on?",
    "A player has 50M coins and is mid-game. Should they buy Shadow Assassin armor, a Legendary pet, or invest in minion upgrades?",
    "A player has 100M coins and is in late game. What gives the best long-term ROI: Necron armor, Scatha pet, or maxing out minion island?",
    "At what point should players stop upgrading minions and start investing in active income gear?",
    "Is it better to have many mediocre accessories or fewer strong accessories for Magical Power gains?",
    "When is it worth recombobulating an item (adding +1 rarity)? What items are worth recombobulating?",
    "What are Scrolls and Runes and when are they worth using?",
    "What is the Auction House vs Bazaar trade-off? When should players use each?",
    "How important is it to complete daily commissions? Which commissions are highest priority?",
    "What SkyBlock upgrades give the biggest permanent stat increases and are often overlooked?",

    # ════════════════════════════════════════════════════════════
    # GAME KNOWLEDGE & TIPS
    # ════════════════════════════════════════════════════════════
    "What are the most important keybinds and menu shortcuts that efficient SkyBlock players use?",
    "What are the most useful SkyBlock mods and why do top players use them? (NEU, Skytils, etc.)",
    "How does the SkyBlock economy fluctuate? What causes prices to crash or spike and how can players take advantage?",
    "What are the best times of day or week to buy/sell on the Bazaar for the best prices?",
    "How does the Bestiary system work? What rewards do milestone completions give and which families are most worth focusing?",
    "How do Fairy Souls work now? How many are there, where are they found, and what do they reward?",
    "What is the Museum and what rewards does it give? What is worth donating and what should players avoid donating?",
    "How does the Bank work in SkyBlock? What interest rates apply and how should players manage their bank?",
    "What is the Co-op system and how does it affect progression? What are the pros and cons of playing co-op?",
    "How does the profile system work? Should players use multiple profiles and what are the benefits?",

    # ════════════════════════════════════════════════════════════
    # ADVANCED META & ENDGAME
    # ════════════════════════════════════════════════════════════
    "What does an endgame player's daily routine look like? What activities do they do every day for maximum progression?",
    "What is the fastest way to progress from early game to the point where dungeon farming is viable?",
    "What is the most efficient way to go from F5 accessible to F7 accessible as quickly as possible?",
    "How do top SkyBlock players spend their time differently from average players? What habits separate the best from the rest?",
    "What are the hardest content milestones to achieve and what do they unlock? (First F7 clear, first M7, HOTM 10, etc.)",
    "What is the current meta for making the most coins per hour as an endgame player with unlimited gear?",
    "How has the SkyBlock meta changed over 2024-2025? What methods that used to be good are now less relevant?",
    "What new content in 2025 (Foraging Update, Greenhouse, Backwater Bayou, Hunting skill) changed the best progression paths?",
    "What content is expected to come in the future that players should prepare for?",
    "If you had to give one single piece of advice to a player who wants to maximize their long-term progression in SkyBlock, what would it be?",
]


async def ask_with_retry(client, notebook_id: str, question: str) -> str:
    for attempt, wait in enumerate(RATE_LIMIT_WAITS):
        try:
            print(f"  Asking... ({datetime.now().strftime('%H:%M:%S')})")
            result = await client.chat.ask(notebook_id=notebook_id, question=question)
            return result.answer if hasattr(result, 'answer') else str(result)
        except Exception as e:
            err = str(e).lower()
            if 'rate' in err or 'limit' in err or 'reject' in err or 'rpc' in err or 'null' in err or 'notebook' in err or 'timeout' in err or 'network' in err:
                if attempt < len(RATE_LIMIT_WAITS) - 1:
                    resume = datetime.fromtimestamp(
                        datetime.now().timestamp() + wait
                    ).strftime('%H:%M:%S')
                    print(f"  Rate limited. Waiting {wait}s — resume at {resume} (attempt {attempt+1}/{len(RATE_LIMIT_WAITS)})")
                    await asyncio.sleep(wait)
                else:
                    return "ERROR: Rate limited after all retry attempts"
            else:
                return f"ERROR: {type(e).__name__}: {e}"
    return "ERROR: Rate limited after all retry attempts"


async def main():
    total = len(QUESTIONS)
    remaining = total - (START_FROM - 1)
    est_min = remaining * WAIT_BETWEEN_QUESTIONS // 60
    print(f"Resuming from Q{START_FROM} — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Notebook: {NOTEBOOK_ID}")
    print(f"Questions remaining: {remaining}/{total} (Q{START_FROM}–Q{total})")
    print(f"Wait between questions: {WAIT_BETWEEN_QUESTIONS}s ({WAIT_BETWEEN_QUESTIONS//60} min)")
    print(f"Estimated runtime: {est_min} min (~{est_min//60}h {est_min%60}m)\n")

    auth = await notebooklm.AuthTokens.from_storage()
    async with notebooklm.NotebookLMClient(auth) as client:

        for i, question in enumerate(QUESTIONS, 1):
            if i < START_FROM:
                continue

            section = question.split('?')[0][:70]
            print(f"Q{i}/{total}: {section}...")

            answer = await ask_with_retry(client, NOTEBOOK_ID, question)
            print(f"  -> {len(answer)} chars")

            # Append to existing file after every question — safe to interrupt
            with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
                f.write(f"## Q{i}: {question}\n\n")
                f.write("**Answer:**\n\n")
                f.write(answer)
                f.write("\n\n---\n\n")

            if i < total:
                resume = datetime.fromtimestamp(
                    datetime.now().timestamp() + WAIT_BETWEEN_QUESTIONS
                ).strftime('%H:%M:%S')
                print(f"  Next question at {resume} (Q{i+1}/{total})\n")
                await asyncio.sleep(WAIT_BETWEEN_QUESTIONS)

    print(f"\nAll {total} questions complete — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Output: {OUTPUT_FILE}")


asyncio.run(main())
