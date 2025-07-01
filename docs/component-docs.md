# Component Documentation

## Core Game Components

### GameWorld (`/src/components/GameWorld.jsx`)
The main game container that orchestrates all game functionality.

**Key Features:**
- Character movement and position tracking
- Map navigation with viewport management
- Inventory management
- NPC interaction system
- Artifact collection and placement
- Level progression and completion tracking
- Sound management integration
- Achievement and notification systems

**State Management:**
```javascript
const [currentMapIndex, setCurrentMapIndex] = useState(0);
const [inventory, setInventory] = useState([]);
const [characterPosition, setCharacterPosition] = useState({ x: 64, y: 64 });
const [artifacts, setArtifacts] = useState([]);
const [levelCompletion, setLevelCompletion] = useState({
  level1: false, level2: false, level3: false, level4: false
});
```

**Special Game Modes:**
- Text Adventure (`TextAdventure` component)
- Terminal Interface (`Level3Terminal` component)  
- Shooter Game (`Level4Shooter` component)
- Hemingway Challenge (`HemingwayChallenge` component)

### Map (`/src/components/Map.jsx`)
Renders the game world tiles, NPCs, and artifacts.

**Props:**
- `mapData`: 2D array defining tile types
- `npcs`: Array of NPC objects with positions and sprites
- `artifacts`: Array of artifact objects with locations
- `onTileClick`, `onNPCClick`, `onArtifactClick`: Event handlers
- `zoom`, `offset`: Camera controls
- `mapName`: Current map identifier

**Features:**
- Tile-based rendering system
- NPC sprite rendering with fallback sprites
- Interactive elements (hover, click)
- Zoom and pan functionality
- Special map effects (Yosemite waterfalls, Half Dome)

### Character (`/src/components/Character.jsx`)
Handles player character rendering and movement animations.

**Features:**
- Direction-based sprite animations
- Walking state management
- Character positioning relative to viewport

### NPCs (Non-Player Characters)

#### Available NPC Types:
- **Zeus** (`/src/components/NPCs/Zeus.jsx`): Weather-themed dialogue
- **Jesus** (`/src/components/NPCs/Jesus.jsx`): Philosophical interactions
- **Ada Lovelace**: Programming/computing themes
- **Ernest Hemingway**: Writing and war experiences
- **Alexander Pope**: Classical literature
- **Michelangelo**: Art and creativity

**NPC System Features:**
- Proximity-based interaction detection
- Dialogue trees with multiple responses
- Sprite-based visual representation
- Integration with achievement system

### Artifacts

#### Artifact Types:
- **Container**: Can hold other items
- **Key**: Unlocks doors/areas
- **Scroll**: Contains readable content
- **Relic**: Special items with unique properties

**Artifact Components:**
- `Artifact.jsx`: Individual artifact rendering
- `ArtifactCreation.jsx`: User artifact creation interface
- `ArtifactDiscovery.jsx`: Discovery animations and notifications
- `ArtifactDetails.jsx`: Detailed artifact information display
- `ArtifactList.jsx`: Inventory-style artifact listing

### Level-Specific Components

#### Level3Terminal (`/src/components/Level3Terminal.jsx`)
Terminal-style interface for Level 3.

**Features:**
- Command-line interface simulation
- File system navigation
- Programming challenges
- ASCII art integration

#### Level4Shooter (`/src/components/Level4Shooter.jsx`)
Action-based shooting game for Level 4.

**Features:**
- Real-time enemy spawning
- Projectile physics
- Score tracking
- Boss battle mechanics

#### HemingwayChallenge (`/src/components/HemingwayChallenge.jsx`)
Writing-focused challenge inspired by Ernest Hemingway.

**Features:**
- Interactive writing prompts
- Story completion mechanics
- Character development themes

## UI Components

### Inventory (`/src/components/Inventory.jsx`)
Player inventory management interface.

**Features:**
- Grid-based item display
- Drag-and-drop functionality
- Item information tooltips
- Quick action buttons

### DialogBox (`/src/components/DialogBox.jsx`)
Universal dialogue interface for NPC interactions.

**Features:**
- Typewriter text animation
- Multiple choice responses
- Character portrait integration
- Audio synchronization

### WorldMap (`/src/components/WorldMap.jsx`)
Global map navigation interface.

**Features:**
- Interactive world nodes
- Progress tracking visualization
- Fast travel functionality
- Area preview information

## Utility Components

### SoundManager (`/src/components/utils/SoundManager.js`)
Centralized audio management system.

**Features:**
- Background music management
- Sound effect playback
- Volume controls
- Audio loading optimization

### ErrorBoundary (`/src/components/ErrorBoundary.jsx`)
React error boundary for graceful error handling.

**Features:**
- Component crash protection
- Error logging
- User-friendly error messages
- Recovery mechanisms

### Performance Components (`/src/components/performance/`)
Performance monitoring and optimization tools.

**Features:**
- FPS monitoring
- Memory usage tracking
- API caching system
- Error tracking and reporting

## Notification System

### AchievementNotification (`/src/components/AchievementNotification.jsx`)
Displays achievement unlocks with animations.

### XPNotification (`/src/components/XPNotification.jsx`)
Shows experience point gains and level progression.

## Form Components

### AvatarUpload (`/src/components/AvatarUpload.jsx`)
User avatar management interface.

### FeedbackForm (`/src/components/FeedbackForm.jsx`)
User feedback collection system.

## Context Providers

### AuthContext (`/src/context/AuthContext.jsx`)
User authentication state management.

### GameStateContext (`/src/context/GameStateContext.jsx`)
Global game state persistence.

### AchievementContext (`/src/context/AchievementContext.jsx`)
Achievement tracking and unlock system.

## Component Integration Notes

1. **State Flow**: GameWorld acts as the primary state container, passing props down to child components
2. **Event Handling**: Most user interactions bubble up to GameWorld for centralized handling
3. **Performance**: Large components use React.memo and useCallback for optimization
4. **Error Handling**: Critical components are wrapped in ErrorBoundary
5. **Accessibility**: Components include ARIA labels and keyboard navigation support

## Development Guidelines

1. **Component Naming**: Use PascalCase for component files
2. **Props Validation**: All components should include PropTypes
3. **State Management**: Use local state for component-specific data, context for shared state
4. **Styling**: Each component has a corresponding CSS file
5. **Testing**: Components should have associated test files in `__tests__` directories