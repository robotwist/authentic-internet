# Unified Artifact Model

This document describes the unified artifact model for Authentic Internet, supporting all creative content types (games, stories, art, music, puzzles, etc.).

## Fields

| Field         | Type      | Required | Description |
|---------------|-----------|----------|-------------|
| id            | string    | Yes      | Unique identifier for the artifact |
| name          | string    | Yes      | Name/title of the artifact |
| description   | string    | Yes      | Short description |
| type          | string    | Yes      | Artifact type (e.g., WEAPON, SCROLL, ART, GAME, etc.) |
| content       | string    | Yes      | Main content (text, URL, etc.) |
| media         | string[]  | No       | Array of media URLs (images, audio, video) |
| location      | object    | Yes      | { x, y, mapName? } - position in the world |
| exp           | number    | Yes      | Experience points awarded |
| visible       | boolean   | Yes      | Whether the artifact is visible |
| area          | string    | Yes      | Area or map name |
| interactions  | array     | No       | List of interaction objects (see below) |
| properties    | object    | No       | Custom properties (damage, magic, etc.) |
| userModifiable| object    | No       | Which fields can be edited by users |
| createdBy     | string    | No       | User ID of creator |
| createdAt     | string    | No       | ISO date string |
| updatedAt     | string    | No       | ISO date string |
| tags          | string[]  | No       | List of tags/keywords |
| rating        | number    | No       | Average rating |
| reviews       | array     | No       | List of review objects |
| remixOf       | string    | No       | Parent artifact ID if remixed |

## Interaction Object
- `type`: string (REVEAL, UNLOCK, COLLECT, SOLVE, CUSTOM)
- `condition`: string (optional)
- `revealedContent`: string (optional)
- `action`: string (optional)

## Review Object
- `userId`: string
- `rating`: number
- `comment`: string
- `createdAt`: string (ISO date)

## Example
```json
{
  "id": "artifact-001",
  "name": "Ancient Sword",
  "description": "A legendary blade that once belonged to a great warrior",
  "type": "WEAPON",
  "content": "The sword pulses with ancient power, its edge never dulling.",
  "media": ["/assets/artifacts/ancient_sword.png"],
  "location": { "x": 3, "y": 2, "mapName": "Overworld" },
  "exp": 15,
  "visible": true,
  "area": "Overworld",
  "interactions": [
    { "type": "COMBINE", "targetArtifact": "Crystal Shard", "result": "Crystal Sword", "description": "The sword resonates with the crystal's energy..." }
  ],
  "properties": { "damage": 10, "durability": 100, "element": "physical" },
  "userModifiable": { "description": true, "content": true, "properties": ["damage", "element"] },
  "createdBy": "user-001",
  "createdAt": "2024-06-01T12:00:00Z",
  "updatedAt": "2024-06-01T12:00:00Z",
  "tags": ["legendary", "weapon", "warrior"],
  "rating": 4.7,
  "reviews": [
    { "userId": "user-002", "rating": 5, "comment": "Incredible artifact!", "createdAt": "2024-06-02T10:00:00Z" }
  ],
  "remixOf": null
}
``` 