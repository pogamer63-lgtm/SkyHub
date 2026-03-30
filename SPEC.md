You are a highly experienced senior full-stack engineer, product designer, data engineer, and game progression analyst.

Your job is to build a modern, production-ready Hypixel SkyBlock web application for me.

IMPORTANT:
- Create the project directly in this path:
  E:\pyton\SkyHub
- If the folder does not yet contain a project, initialize it fully.
- If files already exist there, analyze them first and build on top of them intelligently instead of overwriting everything unnecessarily.
- Work cleanly, modularly, and with long-term maintainability in mind.
- The app should be inspired by sites like:
  - https://eliteskyblock.com
  - https://sky.shiiyu.moe
  but it should be significantly more helpful and feature-rich.
- The core goal of the app is:
  The user should always know what they should do next in order to improve, and what the most cost-efficient / time-efficient / progression-efficient option is.

==================================================
1. PRODUCT VISION
==================================================

I want a Hypixel SkyBlock web app that does not just display stats, but actively coaches the player.

The app should:
- analyze player profiles
- evaluate progression
- generate specific next-step recommendations
- calculate cost/benefit of upgrades
- identify dependencies between upgrades
- prioritize upgrades
- tell the user:
  - what gives the biggest improvement right now
  - what the next sensible milestone is
  - what the cheapest meaningful upgrade is
  - what the fastest meaningful upgrade is
  - which upgrades are inefficient for their cost
  - which prerequisites are missing for the next power spike
  - what common progression mistakes the player is currently making

This should be more than a stats viewer.
It should function as a:
- Progression Advisor
- Upgrade Optimizer
- Cost Efficiency Planner
- Personal SkyBlock Assistant

==================================================
2. CORE APP IDEA
==================================================

The app should automatically evaluate for each player:
- current account state
- strengths and weaknesses
- skill progression
- combat / farming / mining / fishing / magic / slayer / dungeon / garden / etc.
- gear state
- accessories / magical power / reforges / enrichments
- pets
- collections / minions / museum / unlocks
- money-making potential
- missing milestones
- progression bottlenecks
- price-performance upgrades

Then the app should generate multiple recommendation categories, such as:
1. Best next step overall
2. Cheapest meaningful upgrade
3. Best upgrade per coin spent
4. Fastest easy improvement
5. Most important long-term goal
6. Progress blockers that must be fixed first
7. Category-specific recommendations, such as:
   - Farming
   - Mining
   - Dungeons
   - Slayer
   - Fishing
   - Early / Mid / Late game progression

==================================================
3. DATA SOURCES AND RESEARCH
==================================================

Use multiple sources intelligently and combine them.

PRIORITY OF DATA:
1. Official / reliable API data and directly queryable player data
2. Structured Hypixel SkyBlock community data sources
3. Hypixel SkyBlock Fandom Wiki
4. Recent YouTube videos / guides / meta analysis
5. Other reputable SkyBlock community sources if useful

IMPORTANT:
- Do not blindly trust only one source.
- If sources conflict, decide based on:
  - recency
  - plausibility
  - community consensus
  - direct player-data relevance
- Store sources in a traceable way.
- Mark outdated or uncertain information.
- Build an internal research / knowledge layer so the app can be extended over time.

CRAWLING / RESEARCH REQUIREMENTS:
- Build crawler or ingestion logic for the Hypixel SkyBlock Fandom Wiki
- Parse pages into structured data
- Extract relevant topics such as:
  - Items
  - Armor Sets
  - Weapons
  - Pets
  - Reforges
  - Accessories
  - Enchantments
  - Skills
  - Farming Fortune sources
  - Garden upgrades
  - Heart of the Mountain / Mining progression
  - Dungeons progression
  - Slayer requirements
  - Collections
  - Minions
  - Money-making methods
  - NPC / Shop / Crafting / Bazaar / Auction House related information

YOUTUBE / NOTEBOOKLM REQUIREMENTS:
- Evaluate as many recent Hypixel SkyBlock YouTube videos as necessary to understand the current meta, progression advice, and upgrade paths.
- If NotebookLM can be used directly in the current environment, use it for structured evaluation and synthesis.
- If NotebookLM cannot be automated directly, use a clean fallback:
  - YouTube transcripts
  - video descriptions
  - manual research notes
  - structured summaries
- Focus on recent videos, not outdated meta.
- Extract especially:
  - upgrade order recommendations
  - budget advice
  - typical beginner and midgame mistakes
  - current farming / mining / dungeon / slayer meta
  - price-performance advice
  - “do this next” guidance
- Store research with:
  - source
  - date
  - confidence score
  - topic tags

IMPORTANT:
- Use only publicly accessible information.
- Respect robots.txt, terms of service, and rate limits.
- No aggressive scraping.
- Do not unnecessarily download entire videos if legal metadata or transcripts are enough.

==================================================
4. API / SECRETS / SECURITY
==================================================

Use the Hypixel API key only server-side through environment variables.

Create a .env.example file with at least:
HYPIXEL_API_KEY=your_hypixel_api_key_here
DATABASE_URL=your_database_url_here
NEXT_PUBLIC_APP_NAME=SkyHub

IMPORTANT:
- Never hardcode secrets into source code
- Never commit secrets
- Never expose secrets to the frontend
- Never leak the Hypixel API key into the client bundle
- Assume I will place my real Hypixel API key into the local .env file myself

==================================================
5. GITHUB REPOSITORY / VERSION CONTROL
==================================================

The project should not only be created locally in:
E:\pyton\SkyHub

It should also be connected directly to my GitHub repository:

https://github.com/pogamer63-lgtm/SkyHub.git

REQUIREMENTS:
- Check whether the target folder already contains a git repository.
- If not, initialize git cleanly or clone the existing repository into the target folder.
- Make sure the project is connected to this remote:
  origin = https://github.com/pogamer63-lgtm/SkyHub.git
- Use clean, professional commit structure.
- Create meaningful commits after milestones instead of one giant commit.
- If git access is already configured locally, push changes directly to the repository.
- If pushing is not possible because authentication, permissions, or credentials are missing:
  1. still set everything up locally,
  2. still create clean commits,
  3. document exactly what is missing to push,
  4. output the exact git commands needed.

PREFERRED FLOW:
1. Inspect target folder
2. Inspect repository status
3. If needed: clone repo or set remote
4. Implement project
5. Create multiple meaningful commits
6. Push to GitHub if possible

IMPORTANT:
- .env must never be committed
- node_modules must never be committed
- build artifacts only if explicitly necessary
- create a proper .gitignore
- README, .env.example, config, and setup files should be committed

Example commit quality:
- chore: initialize SkyHub project structure
- feat: add player search and profile overview
- feat: implement initial recommendation engine
- feat: add farming planner and ROI calculations
- docs: add setup and hosting instructions

==================================================
6. NO VENV / NO PYTHON VIRTUAL ENVIRONMENT
==================================================

IMPORTANT:
- Do NOT use any Python virtual environment.
- Do NOT create venv, .venv, env, or virtualenv.
- All commands and setup steps must work without a virtual environment.
- Use globally available Python / Node installations on the system.
- Do not create files or instructions that assume a virtual environment.
- The README must also explain setup without venv.

Specifically:
- do not use commands like:
  - python -m venv .venv
  - .venv\Scripts\activate
  - source .venv/bin/activate
- do not assume dependencies are only installable inside a virtual environment
- use direct project commands instead

For Python-related tasks:
- if Python scripts or utilities are needed, their dependencies must be installable globally
- prefer Node.js / TypeScript-first for the main application
- only use Python where it clearly makes sense, e.g. crawler, data preparation, or research pipelines

If Python helper scripts are used:
- document global installation of required packages clearly
- keep Python dependencies minimal
- avoid complicated local Python setups

==================================================
7. TECH STACK
==================================================

Choose a modern, robust stack that fits this project well.

Preferred stack:
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui or a similarly clean component system
- Prisma
- PostgreSQL
- Zod
- TanStack Query / React Query
- server-side API routes and/or server actions where appropriate
- background jobs / cron / queues if helpful
- caching for expensive calculations and external requests

Optional if appropriate:
- Redis for caching
- Drizzle instead of Prisma only if clearly better
- Docker / Docker Compose
- Playwright for tests
- Vitest or Jest
- ESLint + Prettier
- logging / observability preparation

The architecture must be scalable.

==================================================
8. APP STRUCTURE / MAIN PAGES
==================================================

Build a clean, modern information architecture.

At minimum include these areas:

1. Landing Page
- modern homepage
- clear player search by username / UUID
- hero section
- concise explanation of value
- feature highlights
- maybe example/demo profiles
- clean, high-quality, gamer-tool aesthetic without being tacky

2. Player Profile Overview
- overview of major stats
- progression snapshot
- account rating / analysis summary
- strengths / weaknesses
- recommended next steps
- warnings / bottlenecks

3. Upgrade Advisor / Next Best Steps
- this is the most important part of the app
- show concrete recommendations
- each recommendation should include:
  - title
  - explanation
  - cost
  - expected benefit
  - ROI / efficiency
  - prerequisites
  - priority
  - category
  - confidence
- filters for:
  - cheapest
  - fastest
  - best ROI
  - farming only
  - dungeons only
  - mining only
  - slayer only
  - early / mid / late game
- recommendations must be justified in a clear, understandable way

4. Farming Planner
- inspired by farming fortune optimization tools
- show relevant fortune sources
- calculate cheapest farming fortune upgrades
- show next best farming fortune upgrade
- sortable by:
  - coin cost
  - fortune gain
  - fortune per coin
  - prerequisites
- include Garden-related progression where relevant

5. Mining Planner
- HOTM / powder / gear / drill / gauntlet / pet / reforges / talismans / etc.
- show mining progression and next sensible upgrades

6. Dungeon Planner
- gear check
- accessory / magical power check
- pet recommendations
- class-related advice
- requirements / missing checkpoints
- budget and premium paths

7. Slayer Planner
- slayer level overview
- missing unlocks
- recommended order
- cost / benefit analysis

8. Accessory / Magical Power Optimizer
- accessory overview
- missing accessories
- cheapest magical power upgrades
- ROI scoring
- sensible intermediate goals

9. Gear Analyzer
- analyze armor / weapon / equipment / pet / reforge / enchants
- mark weak slots
- show cost-efficient upgrades per slot

10. Money Making / Opportunity Analysis
- identify which progression path unlocks the best money-making options for the current account
- suggest how to finance recommended upgrades
- make it account-specific, not generic

11. Research / Data Transparency
- explain at a high level where recommendations come from
- optionally show source hints / confidence / last updated

12. Admin / Data Sync
- prepare architecture for:
  - sync status
  - crawler status
  - cache status
  - last update timestamps

==================================================
9. RECOMMENDATION ENGINE
==================================================

This is the heart of the application.

Build a recommendation / progression engine with clear logic.

Each recommendation should ideally contain:
- category
- title
- description
- why_it_matters
- estimated_cost
- estimated_benefit
- roi_score
- urgency_score
- progression_score
- requirement_score
- confidence_score
- source_tags
- depends_on
- unlocks
- game_stage
- relevant_profiles_or_modes

The engine should support multiple scoring views:
A) Cheapest meaningful upgrade
B) Best ROI upgrade
C) Highest progression value
D) Fastest easy win
E) Long-term milestone unlock
F) Fix critical weakness first

The recommendations must not be purely mathematically cheap.
They must be meaningful.
Examples:
- A very cheap but irrelevant upgrade should not rank above a slightly more expensive but extremely impactful upgrade.
- Account for prerequisites and synergies.
- Account for dead-end purchases and common trap purchases.
- Detect when the player first needs to solve a foundational blocker.

Make the engine easy to extend later.

==================================================
10. ITEM TEXTURES / VISUAL ASSETS
==================================================

For item textures and visual item representation, use this texture pack as the primary reference or source:

https://furfsky.net

REQUIREMENTS:
- Use FurfSky as the primary style / asset reference for SkyBlock item visuals.
- Before using any external assets directly, check the license, terms, and reuse rules carefully.
- Do not blindly embed or redistribute files if the legal situation is unclear.
- If direct reuse of original assets is legally or technically problematic:
  - implement a clean asset-provider layer
  - use FurfSky as the preferred mapping / style reference
  - clearly document which assets can be used directly and which are only style references
- Build the architecture so item textures can be centrally mapped, for example by:
  - item id
  - internal item slug
  - texture path
  - source
  - asset version
  - fallback texture

GOAL:
- The app should have visually high-quality Hypixel SkyBlock item representations.
- Use FurfSky-compatible textures or a compatible mapping system where possible.
- If some items do not have a matching texture, use a clear fallback mechanism.

==================================================
11. PLAYER SKINS / AVATARS
==================================================

For player skins and skin-related profile visuals, use this source:

https://namemc.com

REQUIREMENTS:
- Use NameMC as the primary reference source for player skins, skin previews, player profile linking, or skin-related rendering references.
- Implement skin display modularly, so per player the app can show:
  - head / avatar
  - skin preview
  - profile link to NameMC
  - username
  - UUID
- Do not use NameMC aggressively or in any way that violates terms, robots.txt, or rate limits.
- If direct NameMC-based skin fetching is unreliable or not appropriate:
  - use an abstracted skin-provider interface
  - keep NameMC as the preferred external profile / reference source
  - implement clean fallbacks for actual skin rendering

Suggested architecture examples:
- SkinProvider interface
- NameMCProfileProvider
- FallbackAvatarRenderer
- optional alternative resolvers later

IMPORTANT:
- no dirty hotlinking without verification
- no aggressive bulk requests
- prefer caching + fallbacks
- linking to NameMC player pages should be easy

==================================================
12. EXPLICIT ASSET / PROVIDER ARCHITECTURE
==================================================

Implement a clean, extensible architecture for external visual sources, for example:

- src/lib/assets/
- src/lib/providers/
- src/lib/providers/skins/
- src/lib/providers/textures/
- src/lib/mappers/

Example files / modules:
- texture-registry.ts
- skin-provider.ts
- namemc-provider.ts
- furfsky-mapper.ts
- asset-cache.ts

The app should support more sources later, but initially:
- Item textures: FurfSky-first
- Player skins: NameMC-first

==================================================
13. UX / UI REQUIREMENTS
==================================================

The app should look modern, fast, clean, and high-quality.

Design goals:
- dark, elegant, clear
- gaming utility look
- modern dashboard feeling
- responsive
- very good search UX
- clear visual hierarchy
- not overloaded
- still information-dense

Important UI expectations:
- strong cards / panels
- good tables with sorting, filtering, search
- nice progress bars / milestones
- color emphasis for:
  - good
  - medium
  - bad
  - very important
  - cheap
  - expensive
- mobile does not need to be perfect first, but it must not be broken
- desktop-first is acceptable

Build useful reusable UI components for:
- recommendation cards
- comparison tables
- upgrade trees
- milestone checklists
- stat badges
- ROI indicators
- warnings / blockers
- profile summaries

==================================================
14. PERFORMANCE
==================================================

The app must be performant.

Please account for:
- caching
- deduping of external requests
- sensible revalidation
- loading states
- skeletons
- robust error handling
- empty states
- rate-limit-friendly behavior
- incremental synchronization instead of unnecessary full refreshes

==================================================
15. DATA MODEL
==================================================

Design a clean, extensible data model.

At minimum prepare for:
- users / searched profiles
- cached player snapshots
- skills / slayers / dungeons / farming / mining / etc.
- items
- upgrades
- upgrade sources
- research sources
- extracted wiki entries
- extracted video insights
- recommendation rules
- generated recommendations
- sync metadata
- price snapshots if used
- content freshness metadata

If external pricing sources are used:
- wrap them cleanly
- document the source
- provide fallback capability

==================================================
16. DEVELOPMENT APPROACH
==================================================

Work in sensible phases.

Phase 1:
- analyze / initialize project
- create core architecture
- create UI foundation
- implement search and profile page
- connect Hypixel API
- create .env.example
- create README skeleton

Phase 2:
- player parsing / normalization
- first recommendation engine version
- first upgrade advisor version
- farming planner MVP
- base data model

Phase 3:
- wiki ingestion / research pipeline
- video / meta research ingestion
- stronger scoring logic
- more categories

Phase 4:
- UI polish
- tests
- error handling
- caching / performance
- hosting docs finalized

Be pragmatic:
I want a working project at the end, not just theory.

==================================================
17. CODE QUALITY
==================================================

Requirements:
- clean, readable, modular code
- good folder structure
- understandable naming
- no giant unmaintainable files
- centralized configuration
- clear separation of services / libs / components
- typesafe
- comments only where truly useful
- no fake implementation without clear labeling
- if something cannot be fully automated due to external limitations, document it honestly and implement the most realistic fallback possible

==================================================
18. README.MD
==================================================

Create a genuinely useful README.md.

It must include at minimum:
1. Project description
2. Feature overview
3. Tech stack
4. Project structure
5. Requirements / prerequisites
6. Local installation on Windows
7. .env setup
8. Development start
9. Build / production start
10. Hosting instructions
11. GitHub repository workflow
12. Asset / texture / skin handling notes
13. No-venv setup note

The hosting guide must explain at minimum:
- local execution
- Docker / Docker Compose
- self-hosting on a server / VPS
- recommended production setup with Nginx reverse proxy
- database connection
- environment variable handling
- caching / background jobs if present

README must also explain:
- how the repository is connected to GitHub
- how I can commit and push locally
- what asset sources are used for textures
- how player skin rendering works
- what technical / legal notes apply to external asset sources
- how to start the project after cloning
- that no Python virtual environment is used

If external asset sources cannot be fully automated, document the manual setup process clearly.

Optionally also include:
- troubleshooting
- common mistakes
- API limit notes
- deployment checklist

==================================================
19. CONCRETE IMPLEMENTATION EXPECTATIONS
==================================================

Do not only plan. Start actual implementation immediately.

Expected outcome:
- complete project in E:\pyton\SkyHub
- clean source code
- runnable setup
- README.md
- .env.example
- sensible base pages
- recommendation engine in a usable first version
- clear foundation for future expansion
- git initialized / connected properly
- clean commit history
- push to GitHub if possible

When decisions are needed:
- make sensible technical choices autonomously
- briefly document major decisions
- prefer pragmatism + extensibility

==================================================
20. IMPORTANT RULES
==================================================

- Do not use secrets in source code.
- Keep everything modular.
- Create a professional folder structure.
- If external data sources are uncertain, wrap them cleanly and document them.
- Prioritize actual player usefulness.
- The app should not just show stats, it should really say:
  “This is what you should do next because it makes the most sense for your account right now.”
- The app must be extendable long-term.
- Use dev/demo seed or mock fallback only where clearly marked and only where necessary.
- Recommendation quality matters more than flashy visuals.
- No venv / no virtual environment.

==================================================
21. PRACTICAL PRIORITY ORDER
==================================================

Prioritize these tasks:
1. correctly connect the GitHub repository
2. create clean project structure
3. add .gitignore and .env.example
4. implement player search and profile basics
5. implement recommendation engine MVP
6. prepare texture / skin architecture
7. finish README with hosting and GitHub setup

If technical or legal limits exist, document them clearly, but still deliver the most complete, production-oriented base possible.

==================================================
22. TOKEN BUDGET / PAUSE / CONTINUATION BEHAVIOR
==================================================

You must continuously monitor your remaining context / token budget while working.

IMPORTANT:
- If the environment explicitly exposes token usage, remaining tokens, context window usage, or similar budget information, check it regularly and use it actively.
- If the environment does NOT expose exact remaining-token information, estimate conservatively based on:
  - conversation length
  - file sizes
  - amount of generated code
  - number of open tasks
  - amount of inline reasoning/output already produced

You must NEVER continue blindly if you are at risk of running out of context or output budget.

Before the remaining token/context budget becomes critically low, you must PAUSE in a controlled way and leave a clear continuation state.

Define a safety threshold:
- When budget appears to be getting low, stop early rather than too late.
- Prefer pausing with enough room left for a good handoff summary.
- Do not wait until failure is imminent.

When pausing, you must create a clear “resume state” in plain text inside the repository, for example in one or more files such as:
- CONTINUE.md
- WORKLOG.md
- TASK_STATE.json
- NEXT_STEPS.md

The saved continuation state must include:
1. what has already been completed
2. what files were created or modified
3. what is currently in progress
4. what the next exact step should be
5. what commands should be run next
6. any blockers or missing credentials
7. any important assumptions
8. which tasks are done, partially done, or not started
9. what should be committed before continuing
10. what should be checked first when resuming

Also maintain a concise progress log throughout the work so continuation is easy even across multiple sessions.

When you pause because of low token/context budget:
- save the continuation state to disk
- make sure the working tree is in a clean, understandable state
- commit current progress if appropriate
- write a short final note explaining exactly where to continue next

Your pause behavior must be deliberate and resumable.

==================================================
23. RESUME WORKFLOW
==================================================

Assume I may later return and simply say:
“mach weiter”
or
“continue”

Therefore, structure your work so that it can be resumed cleanly.

When resuming:
1. first read the continuation files you created
2. inspect git status
3. inspect the last completed milestone
4. continue from the saved next step instead of repeating already completed work
5. avoid redoing finished tasks unless necessary

Your saved continuation notes must be good enough that another competent engineer could resume the work immediately.

==================================================
24. CHECKPOINTING RULES
==================================================

You must checkpoint progress regularly, not only at the very end.

Checkpoint after major milestones such as:
- project initialization
- repository setup
- base app scaffold
- API integration
- profile page implementation
- recommendation engine milestone
- README completion
- asset-provider setup

Each checkpoint should include:
- milestone name
- status
- files touched
- next actions
- known issues

Use a clear, compact format that is easy to scan.

==================================================
25. FAILURE PREVENTION
==================================================

Do not let the session fail due to context exhaustion if it can be avoided.

Rules:
- prefer concise progress notes over verbose repetition
- do not duplicate huge code blocks unnecessarily
- do not restate large plans repeatedly
- checkpoint before large generation steps if budget is getting tight
- split work into resumable milestones
- always leave a useful resume trail

The goal is:
If token/context budget runs low, you pause safely, save your state, and I can later tell you to continue without losing progress.

==================================================
26. START NOW
==================================================

Start immediately with:
1. inspect the target folder
2. inspect git / GitHub repository state
3. initialize or connect project structure
4. set up the application architecture
5. integrate Hypixel API
6. build the first player profile page
7. build the first recommendation system
8. prepare texture and skin provider architecture
9. create README.md and .env.example
10. create clean commits
11. push to GitHub if local auth allows it

Work in a structured, implementation-first way and complete as much as possible directly.