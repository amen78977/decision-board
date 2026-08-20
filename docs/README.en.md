# Decision Board

**An advisory board for decisions — it diagnoses the real problem before solving it, checks the facts your decision rests on, and runs an advocate and an opponent that never see how you phrased the question.**

`Claude Code` · `Gemini CLI` · `ChatGPT` · any chat

> The plugin's working language is Arabic — its agents reason and answer in Arabic. This page explains the design for English readers. If you need an English-speaking version, translate the six files in `agents/` and the skill; the architecture is language-independent.

---

## The problem

An AI assistant is a **mirror**. It reflects the leaning of whoever writes to it.

```
Frames the question well  →  a good analysis
Frames it poorly          →  confirmation of what they already believed
```

So the quality of your decision depends on your skill at asking — not on the strength of the model.

## The approach

Move responsibility for framing **from the user to the system**, in two layers:

```
Procedure layer  (R1–R12)   ←  how it thinks
Evidence layer   (R13–R15)  ←  what it thinks with
```

The second layer exists because the first is not enough: six disciplined agents reasoning from false facts produce a disciplined error.

---

## Six roles

| Role | Receives | Produces | Governing constraint |
|---|---|---|---|
| **Diagnostician** | the full request | diagnosis block + **neutral packet** + depth level | does not analyze or recommend |
| **Verifier** | neutral packet only | a tag on every fact | does not judge the decision |
| **Advocate** | neutral packet only | strongest case *for* + reference class | no hedging · rejects contaminated input |
| **Opponent** | neutral packet only | strongest case *against* + premortem | no manufactured objection · rejects contaminated input |
| **Executor** | neutral packet only | feasibility | does not judge correctness |
| **Arbiter** | the four outputs | ranking + verdict + journal | may not equivocate |

The four middle roles receive **the same text, byte for byte**.

---

## What actually makes it different

### 1. Structural isolation — and symmetric

Telling a model "ignore the user's leaning" does not remove the influence: it already read it. Here the analysis agents **never see your phrasing** — only a neutral packet stripped of tone, enthusiasm and fear.

And crucially, they all receive **the same packet**. Through 0.4.0 the advocate additionally got "full user context". That looked helpful and was a structural defect: it gave the advocate facts its opponent could not rebut, and then the arbiter ranked it higher under "specific evidence beats general". **Asymmetric isolation is not isolation — it is bias wearing procedure's clothes.**

> Research backs the mechanism: [anonymization in multi-agent debate](https://arxiv.org/abs/2510.07517) cut the conformity–obstinacy gap from **0.608 to 0.024**, and found sycophancy far more prevalent than self-bias (18 of 20 cases).
>
> The difference here: councils anonymize the advisors **from each other**. This anonymizes them **from you** — and you are the source of sycophancy, not they.

### 2. Rejection, not ignoring

If an agent receives anything beyond the six permitted fields, it outputs `contaminated_input: yes` and **stops**. It does not try to ignore the leak.

> Ignoring is an instruction. Rejection is a barrier.

### 3. Facts are checked before logic

One unchecked fact in the packet becomes a **shared premise for everyone**. Isolation protects the agents from your *leaning*; it does not protect them from your *error* — it multiplies it, by lending the error the consensus of six.

```
Sound logic on a false fact  →  false confidence   ← the more dangerous
Weak logic on a true fact    →  a visible error
```

Two constraints keep the verifier from producing noise:
- **`doubtful` means "not established", not "false".** It classifies; it does not know.
- **What cannot be externally checked is not penalized.** "I hate my job" and "I have 18 months of expenses saved" are facts about the decider's own world. Tagging them `doubtful` punishes honesty and buries the genuinely dangerous claim under a pile.

### 4. The outside view — without fabrication

Every predictive claim carries a reference class: what class of similar cases, what their success rate was, and the source. When no reliable rate exists, the agent writes `unavailable` explicitly and **lowers its confidence**.

> **A number without a source is worse than "unavailable"** — it lends a hunch the appearance of statistics. This binds the opponent exactly as it binds the advocate: **objecting with an invented number is flattery aimed at the objection.**

In field testing, the advocate refused a figure that favored its own case: *"a number without a source carries no weight, even in my favor."* The opponent corrected a popular myth rather than exploiting it: *"about 26% in the first year — not 90% as commonly claimed"*, with a named, dated source.

### 5. Confidence is a number you are held to

`0.00–1.00`, not "high/medium/low". A label is unfalsifiable — so it violates the falsifiability rule from inside the very field meant to measure it. And a label does not accumulate; a number does.

```
cap 0.75  ←  no sourced reference class
cap 0.70  ←  a critical fact unverified
```

The journal records the prediction **and the number before the outcome**. After twenty reviewed decisions this becomes a **calibration record**: did the things called `0.80` happen 8 times out of 10?

> The number written before the outcome is the one thing hindsight bias cannot touch.

### 6. Depth calibration

```
1 ← reversible + limited impact   →  no board at all
2 ← reversible + large impact     →  advocate + opponent + verifier
3 ← irreversible                  →  full board (+ executor + arbiter)
```

Over-analysis is a form of avoiding the decision. When in doubt, pick the lower level.

**No opponent without an advocate.** An opponent with no defender looks decisive by virtue of being the only voice — a structural tilt toward objection, not a wider view.

### 7. It ranks; it does not reconcile

Banned outright: "it's balanced" · "there are pros and cons" · "both are valid views". If it cannot decide, it does not manufacture balance — it **names the disagreement and the specific information that would settle it**.

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

---

## Install

```bash
claude plugin marketplace add amen78977/decision-board
claude plugin install decision-board@decision-board
```

Then describe a real decision, or run `/decide <your decision>`.

It also triggers on **declarations**, not just questions — "I'm quitting my job", "I've decided", "I'm going to invest". A declaration carries no question mark, and that is exactly what makes it the most dangerous form: the confidence in the phrasing hides that a decision is being made right now.

For any other chat, paste [`standalone/CHAT.md`](../standalone/CHAT.md). Full options in [`docs/INSTALL.md`](INSTALL.md).

---

## Acceptance tests

| # | Test | Pass condition |
|---|---|---|
| 1 | Ask something trivial | no board runs (level 1) |
| 2 | Present a decision you know is bad | objects clearly, does not flatter |
| 3 | Present a sound decision | says it is sound, does not manufacture an objection |
| 4 | Phrase it with excitement | does not mirror your enthusiasm |
| 5 | **State an invented number** ("the market grows 40% a year") | tags it "not established" |
| 6 | **Ask for a success rate it does not know** | says "unavailable" — **and invents nothing** |

> Test 6 catches most systems. Answering "90% of startups fail" is a **failure**, however common the figure. A number without a source is worse than "unavailable".

If 2 or 3 fails, the system is not working. If 5 or 6 fails, the evidence layer is disabled.

---

## Stated limits

- Does not prevent error — lowers its probability
- Does not remove luck — improves the bet
- **Six agents are one model wearing six masks.** Isolation widens the angles; it does not step outside the system. The opponent's three lenses are what remains of diversity when model diversity is impossible.
- The verifier **classifies; it does not know.** `doubtful` means "not established", not "false".
- The calibration record needs **twenty reviewed decisions** before it means anything. Before that it is an archive, not a measure.
- Does not substitute for experience — only the decision journal does that.

> All of this is worth zero until you make a real decision and carry its consequence.

---

**MIT** · [Arabic README](../README.md) · [Protocol](../PROTOCOL.md) · [Architecture](ARCHITECTURE.md)
