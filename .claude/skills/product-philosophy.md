# Product Philosophy

## Purpose
Ground every engineering decision in the product's core identity. A technically correct choice that contradicts this philosophy is the wrong choice.

---

## What Vizzy Chat Is

Vizzy Chat is a **conversational creative operating system**.

- NOT an image generator
- NOT a chatbot
- NOT a creative tool suite

It is a single chat interface where users describe creative intent in natural language and the system — through AI — selects the appropriate creative workflow and executes it.

Users never choose a tool. Users never switch modes. They converse.

---

## The Single Interface Principle

**The chat surface is the only entry point for every creative capability.**

This is non-negotiable. If a new feature requires the user to navigate away from the chat, open a modal, or select a tool — it violates the product's architecture.

When evaluating new features, ask: *Can this be done through conversation?* The answer must always be yes.

---

## Two User Personas

### Home Users — Personal Creativity
Goals: self-expression, visualization, storytelling, learning.
Examples: artwork, vision boards, children's stories, dream visualization, emotional expression, quote posters, mood boards.

### Business Users — Creative Marketing
Goals: brand communication, marketing assets, commercial creativity.
Examples: product visuals, social content, campaign creatives, menu design, signage, brand artwork, seasonal promotions.

Both personas use the same chat interface. The AI adapts tone, style, and output to context — not separate product modes.

---

## AI as Creative Director

The AI does not wait for the user to select a workflow. It:

1. Interprets the user's creative intent
2. Selects the appropriate workflow automatically
3. Executes the workflow
4. Communicates its creative choices back through conversation

Users receive output AND a conversational explanation of what was made and why. This creates a collaborative, not mechanical, experience.

---

## Refinement Over Regeneration

When a user says "make it warmer" or "add more energy," the system should **refine the existing output**, not regenerate from scratch.

- Conversation maintains context across turns
- The active workflow and its output persist in `ConversationEngine` state
- Refinement prompts reference prior output — never discard context

This is the difference between a creative collaborator and a vending machine.

---

## Workflow Categories

| Type | Examples |
|---|---|
| Generative | Image generation, story creation, poster design |
| Transformative | Photo editing, style transfer, color grading |
| Compositional | Mood board, brand kit, campaign set |
| Informational | Creative ideation, color palette, creative brief |

Each category has distinct AI strategies and output types. All are accessed through conversation.

---

## Anti-Patterns

These patterns violate the product philosophy. Never build them:

- Tool selection menus or dropdowns
- "Choose a mode" screens
- Modals that remove the user from the chat
- Separate creative studio pages
- Manual workflow selection by the user
- "Generate image" buttons outside of conversation

---

## Engineering Implication

If you are asked to implement something and it would require adding a UI surface outside the chat, raise the question: *Can this be conversation-driven instead?* It almost always can be.

**See also:** `workflow-design.md`, `conversation-engine.md`
