# Text Adventure: The Writer's Journey

## Map Layout

```
                               +--------------+
                               |              |
                               |  STUDY ROOM  |
                               |              |
                               +------+-------+
                                      |
                                      |
+---------------+            +--------+--------+            +--------------+
|               |            |                 |            |              |
| LOCKED ROOM   +------------+     LIBRARY     |            |  SANCTUARY   |
| (Hemingway's  |            |                 |            |  OF TRUTH    |
|  Study)       |            +---------+-------+            |              |
+---------------+                      |                    +--------------+
                                       |                            ^
                                       |                            |
                                       |                       (password)
                 +-------------------+-+---+------------------+     |
                 |                   |     |                  |     |
                 |                   |     |                  |     |
+----------------+                   |     |                  +-----+------+
|                |     HALLWAY       |     |      SECRET              |
|  START ROOM    +-------------------+     +---------------------+ PASSAGE |
| (Dimly Lit)    |                                               |         |
|                |                                               |         |
+----------------+                                               +---------+


Legend:
+----+ Room boundaries
|    |
+----+

+---+ Connections/Paths
     between rooms
+---+

^    Special connection
|    (requires password/key)
```

## Room Descriptions and Key Elements

### START ROOM
- **Description**: A dimly lit room with wet, mossy stone walls. A single torch provides flickering illumination.
- **Exits**: North to Hallway
- **Items**: Torch, Chest containing rusty key
- **Interactions**: Examine chest, Take torch

### HALLWAY
- **Description**: Features portraits of legendary authors (Hemingway, Fitzgerald, Austen)
- **Exits**: South to Start Room, East to Library, West to Locked Room (requires key), Secret passage (hidden)
- **Items**: None initially
- **Interactions**: Examine portraits (reveals secret lever), Pull lever (reveals secret passage)

### LIBRARY
- **Description**: Vast room with shelves of books and a desk with a glowing book
- **Exits**: West to Hallway, North to Study Room
- **Items**: Ancient tome
- **Interactions**: Read book (reveals password "Iceberg Theory"), Take tome

### STUDY ROOM
- **Description**: Cozy study with fireplace, armchairs, and a self-typing typewriter
- **Exits**: South to Library
- **Items**: Mysterious letter
- **Interactions**: Examine typewriter, Read letter, Take letter

### LOCKED ROOM (Hemingway's Study)
- **Description**: Small study with bookshelves and a writing desk overlooking an endless sea
- **Exits**: East to Hallway
- **Items**: Hemingway's pen
- **Interactions**: Examine desk, Take pen, Read manuscript (reveals clue about sanctuary)

### SECRET PASSAGE
- **Description**: Narrow passage with walls inscribed with literary quotes
- **Exits**: Up to Hallway, Door to Sanctuary (requires password)
- **Items**: None
- **Interactions**: Read quotes, Examine door

### SANCTUARY OF TRUTH
- **Description**: Circular room with domed ceiling painted with constellations, ghostly writers
- **Exits**: Back to Secret Passage
- **Items**: Truth manuscript
- **Interactions**: Examine manuscript, Talk to ghosts, Write truth (requires Hemingway's pen)

## Narrative Flow and Key Items

### Required Items
1. **Rusty Key** - Found in chest in Start Room, used to unlock Hemingway's Study
2. **Hemingway's Pen** - Found in Locked Room, needed for the final writing task
3. **Password: "Iceberg Theory"** - Learned from the book in the Library, opens door to Sanctuary

### Knowledge/Clues
1. **Hemingway Quote** - From typewriter in Study Room
2. **Sanctuary Clue** - From manuscript in Locked Room
3. **Writing Truth** - From quotes in Secret Passage
4. **Final Task** - Learned by talking to ghosts in Sanctuary

## Tips for Narrative Changes

1. **Dialogue Opportunities**: 
   - Ghost writers in the Sanctuary
   - Self-typing typewriter messages
   - Content of the mysterious letter
   - Literary quotes on the walls of the Secret Passage

2. **Theme Enhancement**:
   - Expand on the literary references
   - Add more author-specific details to the portraits
   - Develop the connection between writing and truth-seeking
   - Create more personal challenges related to writing

3. **Gameplay Advancement Ideas**:
   - Additional rooms (perhaps author-specific chambers)
   - More complex puzzles requiring multiple items
   - Branching paths based on literary preferences
   - Character development based on player choices
   - Interactive writing elements where player input shapes the story

4. **Technical Implementation**:
   - All room data is stored in the `GAME_WORLD` object in `TextAdventure.jsx`
   - Each room has properties for description, exits, items, and interactions
   - Special interactions can add items to inventory, reveal exits, or trigger events
   - To modify a room's narrative, update its description and interaction text properties

## Command Reference

Current available commands in the game:
- `look` - Examine the current room
- `go [direction]` - Move in a direction (north, south, east, west)
- `examine [object]` - Look closely at something
- `take [item]` - Pick up an item
- `inventory` or `i` - Check your inventory
- `use [item]` - Use an item
- `help` - Show available commands

Enjoy expanding and enhancing "The Writer's Journey"! 