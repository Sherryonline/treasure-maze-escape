# Treasure Maze Escape

Treasure Maze Escape is a browser-based pirate maze adventure built with Node.js, Express, HTML, CSS, and JavaScript.

Explore a cursed ancient maze, collect map pieces, unlock gates, avoid monsters and traps, solve the treasure code, and escape with the lost treasure.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

Open the game:

```text
http://localhost:3000
```

## Controls

| Action | Key |
| --- | --- |
| Move | Arrow keys or WASD |
| Use compass | C |
| Restart | Restart Adventure button |

## How To Win

1. Collect all 3 map pieces.
2. Remember the symbols revealed by the map pieces.
3. Collect the Silver Key and Golden Key.
4. Activate both ancient switches.
5. Open the Silver Gate and Golden Gate.
6. Reach the treasure chest.
7. Enter the 3-symbol treasure code in the correct order.

## Game Systems

- 24 x 16 tile-based maze.
- Fog of war that hides unexplored areas.
- Safe zones with larger visibility.
- 2 monsters with patrol and simple chase behavior.
- Active and inactive trap cycle.
- Damage cooldown after taking damage.
- Maze shifts every 30 seconds.
- Compass system with limited energy.
- Locked gates that require keys and progress.
- Treasure puzzle based on collected map symbols.
- Win and Game Over overlays.
- Full restart flow.

## Project Structure

```text
treasure-maze-escape/
  public/
    index.html
    style.css
    script.js
  server.js
  package.json
  README.md
```

## Scripts

Start the game server:

```bash
npm start
```

Check JavaScript syntax:

```bash
npm run check
```

## Development Notes

- `server.js` runs the Express static file server.
- `public/index.html` contains the game UI, status panel, puzzle modal, and result overlay.
- `public/style.css` controls the maze layout, tile visuals, fog, overlays, and responsive styling.
- `public/script.js` contains the maze map, player movement, item collection, monster behavior, damage, gate rules, compass logic, puzzle flow, and win/game-over state.

## Repository

GitHub:

```text
https://github.com/Sherryonline/treasure-maze-escape
```
