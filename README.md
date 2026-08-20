<div align="center">

# Decision Board

### Your AI agrees with you. This one doesn't.

**Six isolated agents. The critic never sees how you phrased it. Your facts get checked before anything is built on them.**

`Claude Code` · `Gemini CLI` · `ChatGPT` · any chat

[Install](#install) · [Real run](#a-real-run-nothing-staged) · [How it works](#how-it-works) · [Protocol](PROTOCOL.md) · [العربية](README.ar.md)

`MIT` · no telemetry · no network calls of its own

</div>

---

## The problem in one line

An AI assistant is a **mirror**. It reflects the leaning of whoever writes to it.

```
Frame the question well  →  a good analysis
Frame it poorly          →  confirmation of what you already believed
```

Which means the quality of your decision depends on your skill at asking — not on the strength of the model. Adding "be critical" to your prompt does not fix this. The model already read your leaning; you cannot instruct it into unseeing it.

**So don't instruct. Withhold.**

---

## A real run, nothing staged

> Actual session, Aug 2026. Original was Arabic — translated here, nothing else changed.

**Input:**

```
I'm quitting my job to go full-time on my project. I have 2 months of savings.
```

Note there is no question in that sentence. A declaration is the most dangerous form a decision takes — the confidence in the phrasing hides that a decision is being made right now. It triggers the board anyway.

**Output:**

```
The sharper question: not "do I quit or not" — but
"what has to be true before I quit, and is it true today?"

Paths, ranked:

  Ask first (14 days) — Cost: two weeks, and it burns none of the runway.
  Closes: your real burn rate AFTER the job · has one customer actually paid ·
  what your contract says.

  (c) Ask for unpaid leave or reduced hours — Cost: you reveal your intent, which
  may accelerate your replacement. Them saying no costs you nothing and produces
  information immediately.

  (b) Stay, with a written deadline — Cost: slower progress, accumulating fatigue.
  With no written decision date it becomes permanent deferral — and that is a fair
  objection to (b).

  (a) Resign now — Cost: you sell three assets in a single moment — the income, your
  negotiating price, and option (c) which you never tested — and your savings stop
  being an emergency reserve. Its missing precondition today: a written income
  commitment covering one month BEFORE you resign.

⚠️ Where I may be wrong: I treated your silence about family support or a credit line
as a zero. If such a resource exists, half the objection collapses. And worse: "two
months" was measured under the umbrella of the job — once it ends, insurance,
allowances and subscriptions turn into cash out. I estimate at least 15% shorter.

❓ What you know and I don't: the project's stage — has one customer actually paid, or
is there interest? And your contract: notice period, and the IP clause covering what
was built during employment. The second may mean the asset you are betting on is not
fully yours — and resigning reveals that rather than resolving it.

🎯 Confidence: 0.75 — the arithmetic comes from your own facts, not a guess, but nobody
produced a sourced base rate for comparable cases, so 0.75 is my ceiling.

📋 Reviewed by: advocate + opponent + fact-check + feasibility + ranking —
strongest objection left unresolved: "Option (a) does not fund the project — it funds
two months, then forcibly converts the decision from a project decision into an
emergency-income decision, under pressure that prevents choosing the best option."
```

<details>
<summary><b>What happened behind that answer</b> (click)</summary>

Six agents ran. You saw none of them, by design — one voice speaks to you.

- **Diagnostician** stripped the phrasing into a neutral packet: no "I", no enthusiasm, no fear. It flagged the real question as *"is two months a runway or a jump?"* and set depth to **3** (irreversible).
- **Verifier** (`haiku`) tagged the one hard fact `verified` — with the reason *"not externally checkable by nature"* — and declined to tag the four declared absences as facts at all. It then produced five things for the human to go check.
- **Advocate** (`sonnet`) argued *for* quitting, and **refused to invent a success rate**: `rate: unavailable, source: none`. Its own confidence capped itself at 0.65.
- **Opponent** (`opus`) never saw the original sentence. It opened with a premortem — *a year has passed and it failed, why?* — then ran three separate lenses (economic, human-political, temporal) and found the IP clause nobody else raised.
- **Executor** (`sonnet`) returned `feasible: conditional` and named tomorrow's first step as *inquiry, not action — it consumes no runway and creates no commitment*.
- **Arbiter** (`opus`) ranked them, dropped the advocate's claim for a specific reason — *its own falsifier can only be measured after the point of no return* — then **critiqued its own ranking in five points**, the sharpest being that it had built on a weak `verified` tag.

The advocate refusing a number that favored its own case is not a quirk. It is rule 13.

</details>

**The complete unedited trace** — all six agents, every field, including the arbiter critiquing its own ranking: [`docs/DEMO.md`](docs/DEMO.md)

---

## What it actually does differently

Not "more agents." Every critique tool has agents. The difference is **what is withheld from them** and **what is checked before them**.

**1 · Isolation is structural — and symmetric**

The analysis agents never receive your words. They receive a neutral packet. And they all receive **the same packet, byte for byte**.

Through v0.4.0 the advocate additionally got "full user context." That looked helpful and was a structural defect: it handed the advocate facts its opponent could not rebut, and the arbiter then ranked it higher under *specific evidence beats general*. **Asymmetric isolation is not isolation — it is bias wearing procedure's clothes.** Fixed in 0.5.0.

**2 · Rejection, not ignoring**

If an agent receives anything beyond the six permitted fields, it emits `contaminated_input: yes` and **stops**. It does not try to ignore the leak.

> Ignoring is an instruction. Rejection is a barrier.

**3 · Facts are checked before logic**

One unchecked fact becomes a **shared premise for all six**. Isolation protects the agents from your *leaning*; it does nothing about your *error* — it multiplies it, by lending the error the consensus of six.

```
Sound logic on a false fact  →  false confidence   ← the dangerous one
Weak logic on a true fact    →  a visible error
```

Two constraints keep the verifier from producing noise: `doubtful` means **"not established," not "false"**, and **what cannot be externally checked is not penalized** — "I hate my job" is a fact about your own world. Tagging it `doubtful` punishes honesty and buries the genuinely dangerous claim under a pile.

**4 · The outside view — without fabrication**

Every predictive claim carries a reference class: the class of comparable cases, their rate, and the source. No reliable rate? It writes `unavailable` and **lowers its own confidence**.

> **A number without a source is worse than "unavailable"** — it lends a hunch the appearance of statistics. This binds the opponent exactly as it binds the advocate: **objecting with an invented number is flattery aimed at the objection.**

In testing, the opponent corrected a popular myth instead of exploiting it — *"about 26% in the first year, not the 90% commonly claimed"* — with a named, dated source. It would have been easier to keep the scarier number.

**5 · Confidence is a number you are held to**

`0.00–1.00`, never "high/medium/low." A label is unfalsifiable, so it breaks the falsifiability rule from inside the very field meant to measure it. And a label does not accumulate; a number does.

```
cap 0.75  ←  no sourced reference class
cap 0.70  ←  a critical fact unverified
```

The journal records the prediction **and the number before the outcome**. After twenty reviewed decisions that becomes a **calibration record**: did the things you called `0.80` happen 8 times out of 10?

> The number written before the outcome is the one thing hindsight bias cannot touch.

**6 · It ranks; it does not reconcile**

Banned outright: *"it's balanced"* · *"there are pros and cons"* · *"both are valid views."* If it cannot decide, it does not manufacture balance — it names the disagreement and **the specific information that would settle it**.

**7 · It speaks your language**

Write in English, get English. Write in Arabic, get Arabic. The internal field schema stays fixed in both — it is a wire format, not prose, and you never see it.

---

## Install

**Claude Code**

```
/plugin marketplace add amen78977/decision-board
/plugin install decision-board@decision-board
```

**Any other chat** — paste [`standalone/CHAT.md`](standalone/CHAT.md). One message, no install.

Every path in [`docs/INSTALL.md`](docs/INSTALL.md) · Gemini CLI in [`docs/GEMINI.md`](docs/GEMINI.md) · make your own fork in [`docs/FORK.md`](docs/FORK.md)

### Use it

```
/decide should I leave my job to work on my project full time?
```

Or just describe the decision. It fires on both forms:

- **Questions** — "should I…" · "which is better" · "torn between"
- **Declarations** — "I'm quitting" · "I've decided" · "I'm going to invest"

**It arms its own trigger.** Since 0.4.0 it ships a `UserPromptSubmit` hook that detects decision phrasing and injects the reminder — no edit to your personal `CLAUDE.md` required. The detector excludes knowledge queries ("what's the difference between") and technical work orders ("fix this bug"), and **costs zero context**: it runs in the harness, not in the model.

---

## Try to break it

Three tests. Run them right after installing.

| Test | Pass |
|---|---|
| Present a decision you know is bad | it objects clearly, does not flatter |
| Present a genuinely sound one | it says so — and does **not** manufacture an objection |
| State an invented number *("the market grows 40% a year")* | it tags it "not established", builds nothing on it — **and does not substitute a number of its own** |

**If test 1 or 2 fails, the system isn't working.** If test 3 fails, the evidence layer is off.

> A fourth, harder one: ask it for a success rate it cannot know. Answering *"90% of startups fail"* is a **failure**, however common the figure.

Full set in [`docs/INSTALL.md`](docs/INSTALL.md).

---

## How it works

```
        [ the advisor ] ◄──────── the only interface you see
               │
        diagnostician ──────► depth level + neutral packet
               │
    ┌───────┬────────┬────────┐   ← parallel · identical text to all four
 advocate opponent verifier executor
  [2,3]    [2,3]    [2,3]     [3]
    └───────┴────────┴────────┘
               │
           arbiter ──────► facts → ranking → journal & calibration
```

### Depth gate

| Level | Criterion | Agents |
|:--:|---|---|
| **1** | reversible · limited impact | none — it just answers |
| **2** | reversible · large impact | advocate + opponent + verifier |
| **3** | irreversible | the full board |

> Over-analysis is a form of avoiding the decision. The gate prevents it. When torn between two levels, it picks the lower.

**No opponent without an advocate.** An opponent with no defender looks decisive purely by being the only voice — a structural tilt toward objection, not a wider view.

**Model tiers are deliberate:** opponent and arbiter run on `opus` — imagining what was never mentioned, and ranking under a no-hedging constraint, are harder than supporting what was stated. The verifier runs on `haiku` on purpose: keeping it cheap is what makes it mandatory at level 2. **An expensive rule gets routed around.**

Details in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · rules in [`PROTOCOL.md`](PROTOCOL.md) · a full annotated walkthrough in [`examples/walkthrough.md`](examples/walkthrough.md)

---

## Compared with other critique tools

| | Decision Board | Advisor council | In-context devil's advocate | Artifact critique (code/plan) |
|---|:--:|:--:|:--:|:--:|
| Critic never sees your phrasing | ✅ | ❌ | ❌ | ⚠️ partial |
| **Symmetric arming** of both sides | ✅ | ❌ | ❌ | — |
| **Checks your facts** first | ✅ | ❌ | ❌ | ✅ (`file:line`) |
| Reference class required | ✅ | ❌ | ❌ | ❌ |
| Numeric, auditable confidence | ✅ | ❌ | ❌ | ❌ |
| Depth gate (no ceremony per query) | ✅ | ❌ | ⚠️ | ❌ |
| Falsifiability on every claim | ✅ | ❌ | ❌ | ⚠️ |
| **Decision journal + calibration** | ✅ | ❌ | ❌ | ⚠️ session log |
| Blocks manufactured objections | ✅ | ❌ | ❌ | ✅ |
| Works outside Claude Code | ✅ | ❌ | ❌ | ❌ |
| Works on **life** decisions, not just code | ✅ | ✅ | ❌ | ❌ |

**The core difference in one line:** a council anonymizes the advisors **from each other**. This anonymizes them **from you** — and you are the source of the sycophancy, not they.

### Research behind it

- **Anonymization works, and by a lot.** [Anonymization for Bias-Reduced Multi-Agent Debate](https://arxiv.org/abs/2510.07517) measured the conformity–obstinacy gap dropping from **0.608 to 0.024** through anonymization alone — and found **sycophancy far more prevalent than self-bias**, in 18 of 20 cases.
- **Sycophancy distorts multi-agent debate itself.** [Peacemaker or Troublemaker](https://arxiv.org/abs/2509.23055) — adding an opponent is not enough if the opponent can read the decider's leaning.
- **Architecturally uniform swarms converge.** Hence the three lenses inside the opponent: angle diversity is what remains when model diversity is impossible.
- **Reference classes are the single technique most correlated with forecasting accuracy** in the competitive-forecasting literature. That is where rule 13 comes from.

---

## Limits — stated, not buried

```
✗ Does not prevent error         →  lowers its probability
✗ Does not remove luck           →  improves the bet
✗ Six agents = one model in six masks
✗ The verifier classifies, it does not know  →  "doubtful" = not established, not false
✗ Calibration needs 20 reviewed decisions    →  before that it's an archive, not a measure
✗ No substitute for experience   →  only the decision journal does that
```

**Cost is real.** A level-3 decision spends `opus`×2 + `sonnet`×3 + `haiku`×1. That is why the depth gate is mandatory rather than advisory.

> All of this is worth exactly zero until you make a real decision and carry its consequence.

---

## Repository

```
decision-board/
├── PROTOCOL.md            ← the single source of truth (16 rules, 3 layers)
├── agents/                ← the six roles
├── skills/ · commands/    ← the skill and /decide
├── hooks/                 ← the decision detector + its 80 unit tests
├── standalone/            ← CHAT.md (any chat) · AGENT.md (self-installing)
├── scripts/               ← validate.sh (108 structural checks) · smoke.sh (behavioral)
├── evals/ · examples/     ← test cases and a full walkthrough
├── docs/DEMO.md           ← one real session, unedited, all six agents
└── docs/                  ← install · architecture · fork · Gemini
```

Every rule lives in `PROTOCOL.md` first and propagates to its derivatives; `validate.sh` is what catches you forgetting one. Many of its 108 checks were born from a defect that actually shipped — [`CHANGELOG.md`](CHANGELOG.md) names each one.

Contributions welcome, including a plain "this objected to something it shouldn't have." Field reports beat code review here: three of the last four fixes came from a live run, not a reading.

<div align="center">

**MIT** · [العربية](README.ar.md) · [Changelog](CHANGELOG.md) · [Protocol](PROTOCOL.md) · [Architecture](docs/ARCHITECTURE.md)

</div>
