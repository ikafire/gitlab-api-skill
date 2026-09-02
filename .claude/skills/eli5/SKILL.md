---
name: eli5
description: Explain something in plain language, from the ground up, with no jargon and no assumed background. Use when the user asks to "explain like I'm 5", says ELI5, asks for a simple/beginner/plain-English explanation, says they don't understand a concept, or asks "what even is X". Also use when the user invokes /eli5 by name.
---

# ELI5 — explain it plainly

Rebuild the idea from parts the reader already has. "Like I'm 5" means *no assumed background*, not baby talk. The reader is smart; they just have not met this topic before.

## Before you write

1. **Pin down what is actually being asked.** "Explain Kubernetes" from someone debugging a CrashLoopBackOff needs a different explanation than from someone choosing a hosting platform. If the request came with context, use it. If the topic is genuinely ambiguous (`explain drivers`), ask one short question instead of guessing.
2. **Find the one thing that unlocks the rest.** Almost every concept has a single central idea that makes everything else follow. Lead with it. If you cannot name it in one sentence, you do not understand it well enough to explain it yet.
3. **Check your own footing.** If you are unsure of a fact, look it up or say you are unsure. A confident simple explanation that is wrong is worse than no explanation — the reader has no way to catch it.

## Shape of a good explanation

- **One-sentence answer first.** No throat-clearing, no "great question", no roadmap of what you are about to say. Lead with the thing itself.
- **Then the why.** What problem does this exist to solve? What went wrong without it? Concepts stick when they are the answer to a question the reader can feel.
- **Then the how, in order.** Build up in small steps, each using only what you already established.
- **Then the catch.** Where the simple picture stops being true, and what the reader would trip over next. End here rather than on a summary of what you just said.

Keep it short. Two or three tight paragraphs beat a page. Length is not thoroughness.

## Language rules

- **Ban unexplained jargon.** Every term of art gets defined in the sentence where it first appears, or gets replaced with a plain word. Do not define a term with three more terms.
- **Short, concrete sentences.** Prefer "the server keeps a copy" over "state is persisted server-side".
- **Real numbers and real examples** over abstractions. "About the time it takes to blink" beats "low latency".
- **Second person.** "You send a request, it sends one back" reads far easier than the passive voice.

## Analogies

An analogy is a loan, not a gift — you have to pay it back.

- Use **one** analogy, drawn from something ordinary (mail, kitchens, queues at a counter, locks and keys).
- Say explicitly where it breaks: "unlike a real key, copying this one is free — that is the whole problem with it."
- Never stack analogies. A second one does not reinforce the first, it replaces it, and the reader now holds neither.
- If the analogy needs more explaining than the concept did, drop it and explain the concept directly.

## Guardrails

- **Simplify, do not falsify.** Leaving out detail is fine. Saying something untrue that the reader will have to unlearn is not. When you round off, flag it: "roughly speaking", "there is more to it, but this is the shape."
- **Never condescend.** No "don't worry about the details", no "it's basically magic", no cutesy voice, no emoji unless the user's own tone invites it.
- **Match the medium.** Code questions get a tiny runnable example. Systems questions get a plain-text flow (`you -> load balancer -> one of N servers`). Do not draw a diagram where a sentence works.
- **Follow their lead on depth.** If they push back or ask "but why", go one level deeper on that specific point rather than re-explaining the whole thing from the top.
