# Treasure Maze Escape

A Node.js and Express browser game where a pirate explores a cursed ancient maze, collects map pieces and keys, avoids monsters and traps, opens locked gates, and reaches the lost treasure.

## Run Locally

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

## Controls

| Action | Key |
|---|---|
| Move | Arrow keys or WASD |
| Restart | Restart Adventure button |

## Goal

Collect all 3 map pieces, collect the Silver Key and Golden Key, open the Silver Gate and Golden Gate, then reach the treasure chest.

## Features

- Express static server
- 24 x 16 tile maze
- Health, keys, map pieces, message panel, and maze shift countdown
- Walls, floor, safe zones, traps, keys, gates, monsters, map pieces, and treasure
- Player movement with Arrow keys and WASD
- Locked gate rules
- 2 moving monsters with patrol and simple chase behavior
- Damage cooldown
- Safe zones that monsters cannot enter
- Trap damage with one-time trap activation
- Maze shifting every 30 seconds using predefined safe tiles
- Win and Game Over overlays
- Restart flow that resets the full maze state

## Scripts

```bash
npm start
npm run check
```
