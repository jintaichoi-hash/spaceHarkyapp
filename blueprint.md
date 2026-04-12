# Ice Hockey Game Blueprint

## Overview
A modern, 2D top-down air-hockey style ice hockey game built with HTML5 Canvas, CSS, and Vanilla JavaScript. The game features a player vs. computer mode, a stylized ice rink environment, glowing effects, and smooth collision physics.

## Current Plan (Implementation)
1. **HTML Structure**: Create a central `<canvas>` for the rink and overlay `<div>` elements for the scoreboard and "Goal!" notifications.
2. **CSS Styling**:
    - Dark theme with neon accents (Cyan for player, Magenta for AI, White for puck).
    - Subtle noise texture for the "ice" background.
    - Responsive layout that scales the canvas.
3. **Game Logic (main.js)**:
    - **Initialization**: Set up canvas context and high-DPI scaling.
    - **Entities**: Define `Paddle` (Player & AI) and `Puck` classes.
    - **Physics**:
        - Circle-to-circle collision for paddle vs. puck.
        - Wall bouncing with energy loss.
        - Friction/Deceleration for the puck.
    - **AI**: Simple logic where the AI follows the puck's X-position but stays within its half.
    - **Scoring**: Detect when the puck enters the "goal zones" at the ends of the rink.
    - **Game Loop**: Use `requestAnimationFrame` for smooth 60fps rendering.

## Feature List
- [ ] 2D Physics Engine (Collisions, Friction)
- [ ] AI Opponent
- [ ] Responsive Scoreboard
- [ ] Visual Effects (Glow, Particles on Goal)
- [ ] Sound Effects (Optional/Placeholder)
