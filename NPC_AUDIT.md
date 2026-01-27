# NPC Audit (Vision Item 4)

**Date:** January 2026  
**Goal:** Ensure every NPC has a sprite and dialogue; replace placeholders.

## Summary

- **Source of truth:** `client/src/components/GameData.js` → `MAPS[].npcs`
- **Rendering:** `Map.jsx` uses `npc.sprite || getNPCImage(npc.type) || DEFAULT_NPC_SPRITE` (`/assets/npcs/guide.png`).
- **Dialogue:** `NPCInteraction` uses `npc.dialogue[]`; all audited NPCs already had at least one line.

## Changes Made

| Map | NPC | Fix |
|-----|-----|-----|
| Overworld 2 | Zeus the Weatherman | Added `sprite: "/assets/npcs/zeus.svg"` and `_id`. |
| Overworld 3 | William Shakespeare | Added `sprite: "/assets/npcs/shakespeare.webp"` and `_id`. |
| Hemingway's Battleground | Ernest Hemingway | Set `sprite: "/assets/hemingway.png"` (file lives in `assets/` root), added `_id`. |

## NPC Checklist (GameData.js)

| Map | NPC | Sprite | Dialogue |
|-----|-----|--------|----------|
| Overworld | William Shakespeare | ✅ shakespeare.webp | ✅ |
| Overworld | John Muir | ✅ john_muir.webp | ✅ |
| Overworld 2 | Zeus the Weatherman | ✅ zeus.svg | ✅ |
| Overworld 3 | William Shakespeare | ✅ shakespeare.webp | ✅ |
| Desert 1 | Alexander Pope | ✅ alexander_pope.svg | ✅ |
| Desert 2 | Oscar Wilde | ✅ oscar_wilde.svg | ✅ |
| Desert 3 | Ada Lovelace | ✅ ada_lovelace.webp | ✅ |
| Yosemite | John Muir | ✅ john_muir.png | ✅ |
| Hemingway's Battleground | Ernest Hemingway | ✅ hemingway.png | ✅ |

## Asset Paths

- Sprites in `client/public/assets/npcs/`: `ada_lovelace`, `alexander_pope`, `artist`, `guide`, `jesus`, `john_muir`, `lord_byron`, `michelangelo`, `oscar_wilde`, `shakespeare`, `zeus`, etc.
- `hemingway.png` is at `client/public/assets/hemingway.png` (root).

## Optional Follow‑ups

- Add unique sprites for any future NPCs instead of reusing `guide.png`.
- Consider character-specific dialogue for duplicate NPCs (e.g. Shakespeare on Overworld vs Overworld 3) if needed.
