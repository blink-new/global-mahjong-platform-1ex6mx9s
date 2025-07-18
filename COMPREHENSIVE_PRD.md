# Global Online Mahjong Platform - Comprehensive PRD
## San Francisco Tech Standards Edition

---

## 1. Executive Summary

### 1.1 Vision Statement
Build the world's most immersive online Mahjong platform that seamlessly bridges physical and digital gameplay experiences, enabling global communities to connect through authentic Mahjong traditions while leveraging cutting-edge web technologies.

### 1.2 Mission
Democratize access to high-quality Mahjong gameplay worldwide while preserving cultural authenticity and creating sustainable revenue through premium video streaming features.

### 1.3 Success Metrics
- **User Engagement**: 85%+ monthly active user retention
- **Technical Performance**: <50ms average latency for game actions
- **Revenue**: $2M ARR within 18 months
- **Scale**: Support 50,000+ concurrent users
- **Quality**: 4.8+ app store rating

---

## 2. Market Analysis & Competitive Landscape

### 2.1 Total Addressable Market (TAM)
- **Global Mahjong Players**: ~500M worldwide
- **Online Gaming Market**: $180B (2024)
- **Target Segment**: Premium social gaming ($12B)

### 2.2 Competitive Analysis
| Platform | Strengths | Weaknesses | Our Advantage |
|----------|-----------|------------|---------------|
| Mahjong Soul | Anime aesthetics, mobile-first | Limited social features | Real video streaming |
| Red Dragon | Traditional rules | Outdated UI/UX | Modern tech stack |
| Riichi City | Tournament focus | No video chat | Comprehensive social features |

---

## 3. Technical Architecture

### 3.1 System Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   API Gateway   │    │   Game Engine   │
│  (React/Next)   │◄──►│   (Supabase)    │◄──►│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Video Streams  │    │   Database      │    │   Redis Cache   │
│     (MUX)       │    │ (PostgreSQL)    │    │  (Game State)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 3.2 Frontend Architecture

#### 3.2.1 Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS 3.4+ with custom design tokens
- **State Management**: Zustand + React Query (TanStack Query)
- **Real-time**: Supabase Realtime + WebRTC (for video)
- **UI Components**: Radix UI + Custom components
- **Animation**: Framer Motion
- **Testing**: Vitest + React Testing Library + Playwright
- **Build Tool**: Vite
- **Deployment**: Vercel (Edge Functions)

#### 3.2.2 Component Architecture
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth group routes
│   ├── (game)/            # Game group routes
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Base UI components (Radix-based)
│   ├── game/              # Game-specific components
│   ├── layout/            # Layout components
│   └── forms/             # Form components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
├── stores/                # Zustand stores
├── types/                 # TypeScript definitions
├── utils/                 # Helper functions
└── constants/             # App constants
```

#### 3.2.3 State Management Strategy
```typescript
// Game State Store (Zustand)
interface GameStore {
  // Game State
  gameId: string | null
  players: Player[]
  currentPlayer: number
  gamePhase: GamePhase
  tiles: TileState
  
  // UI State
  selectedTiles: string[]
  availableActions: Action[]
  showVideoStreams: boolean
  
  // Actions
  joinGame: (gameId: string) => Promise<void>
  makeMove: (move: Move) => Promise<void>
  selectTile: (tileId: string) => void
  toggleVideo: () => void
}

// User State Store
interface UserStore {
  user: User | null
  subscription: Subscription | null
  preferences: UserPreferences
  
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>
}
```

### 3.3 Backend Architecture

#### 3.3.1 Technology Stack
- **Runtime**: Node.js 20+ (LTS)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 15+ (Supabase)
- **Cache**: Redis 7+ (Upstash)
- **Real-time**: Supabase Realtime + Socket.io
- **Authentication**: Supabase Auth (JWT)
- **File Storage**: Supabase Storage
- **Video Streaming**: MUX Live Streaming API
- **Payment Processing**: Stripe
- **Monitoring**: Sentry + DataDog
- **Deployment**: Railway/Render (API) + Supabase (Database)

#### 3.3.2 Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  subscription_tier VARCHAR(20) DEFAULT 'free',
  elo_rating INTEGER DEFAULT 1200,
  total_games INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  preferred_variant VARCHAR(50) DEFAULT 'chinese_classical',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(10) UNIQUE NOT NULL,
  variant VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting', -- waiting, active, completed, abandoned
  max_players INTEGER DEFAULT 4,
  current_round INTEGER DEFAULT 1,
  total_rounds INTEGER DEFAULT 4,
  created_by UUID REFERENCES users(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game participants
CREATE TABLE game_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  seat_position INTEGER CHECK (seat_position >= 0 AND seat_position <= 3),
  wind VARCHAR(10), -- east, south, west, north
  score INTEGER DEFAULT 0,
  is_ready BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, seat_position),
  UNIQUE(game_id, user_id)
);

-- Game states (for real-time sync)
CREATE TABLE game_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  current_player INTEGER NOT NULL,
  phase VARCHAR(20) NOT NULL, -- dealing, playing, claiming, scoring
  wall_tiles JSONB NOT NULL, -- remaining tiles in wall
  dora_indicators JSONB DEFAULT '[]',
  player_hands JSONB NOT NULL, -- encrypted player hands
  discarded_tiles JSONB DEFAULT '[]',
  claimed_sets JSONB DEFAULT '[]',
  available_actions JSONB DEFAULT '[]',
  turn_timer_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game moves/actions log
CREATE TABLE game_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id),
  move_type VARCHAR(20) NOT NULL, -- draw, discard, chi, pon, kan, ron, tsumo
  move_data JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournaments
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  variant VARCHAR(50) NOT NULL,
  entry_fee INTEGER DEFAULT 0, -- in cents
  prize_pool INTEGER DEFAULT 0,
  max_participants INTEGER,
  status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, active, completed
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video streaming sessions (for premium users)
CREATE TABLE video_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  mux_live_stream_id VARCHAR(255),
  mux_playback_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'inactive', -- inactive, active, ended
  participants JSONB DEFAULT '[]', -- user IDs with video enabled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_created_at ON games(created_at);
CREATE INDEX idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX idx_game_states_game_id ON game_states(game_id);
CREATE INDEX idx_game_moves_game_id ON game_moves(game_id);
CREATE INDEX idx_users_elo_rating ON users(elo_rating DESC);
```

#### 3.3.3 API Design

**RESTful API Endpoints:**

```typescript
// Authentication
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
GET    /api/auth/me
PUT    /api/auth/me

// Games
GET    /api/games                    # List public games
POST   /api/games                    # Create new game
GET    /api/games/:id                # Get game details
PUT    /api/games/:id                # Update game settings
DELETE /api/games/:id                # Delete game
POST   /api/games/:id/join           # Join game
POST   /api/games/:id/leave          # Leave game
POST   /api/games/:id/start          # Start game

// Game Actions
POST   /api/games/:id/moves          # Make a move
GET    /api/games/:id/state          # Get current game state
POST   /api/games/:id/actions        # Perform action (chi/pon/kan/ron)

// Video Streaming (Premium)
POST   /api/games/:id/video/start    # Start video session
POST   /api/games/:id/video/stop     # Stop video session
GET    /api/games/:id/video/token    # Get MUX token

// Tournaments
GET    /api/tournaments              # List tournaments
POST   /api/tournaments              # Create tournament
POST   /api/tournaments/:id/join     # Join tournament

// Leaderboards
GET    /api/leaderboards/global      # Global rankings
GET    /api/leaderboards/friends     # Friends rankings

// User Management
GET    /api/users/:id                # Get user profile
PUT    /api/users/:id                # Update profile
GET    /api/users/:id/stats          # Get user statistics
GET    /api/users/:id/history        # Get game history
```

**WebSocket Events:**

```typescript
// Client -> Server
interface ClientEvents {
  'game:join': { gameId: string }
  'game:leave': { gameId: string }
  'game:move': { gameId: string, move: Move }
  'game:action': { gameId: string, action: Action }
  'video:toggle': { gameId: string, enabled: boolean }
  'chat:message': { gameId: string, message: string }
}

// Server -> Client
interface ServerEvents {
  'game:state_update': { gameId: string, state: GameState }
  'game:player_joined': { gameId: string, player: Player }
  'game:player_left': { gameId: string, playerId: string }
  'game:move_made': { gameId: string, move: Move, newState: GameState }
  'game:turn_timer': { gameId: string, timeLeft: number }
  'video:stream_update': { gameId: string, streams: VideoStream[] }
  'chat:new_message': { gameId: string, message: ChatMessage }
  'error': { code: string, message: string }
}
```

---

## 4. Game Logic & Rules Engine

### 4.1 Supported Variants

#### 4.1.1 Chinese Classical Mahjong
- **Tiles**: 144 tiles (34 unique types × 4 copies each)
- **Winning Conditions**: 4 sets + 1 pair (14 tiles total)
- **Special Hands**: 13 special winning patterns
- **Scoring**: Point-based system with doubling

#### 4.1.2 Japanese Riichi Mahjong
- **Tiles**: 136 tiles (no flowers/seasons)
- **Yaku System**: 37+ scoring patterns
- **Riichi Declaration**: Closed hand betting mechanism
- **Dora System**: Bonus tiles revealed during play

#### 4.1.3 Filipino Mahjong (Custom Variant)
- **Tiles**: 144 tiles with Filipino cultural adaptations
- **Unique Rules**: Pusoy-inspired scoring, special Filipino hands
- **Local Terminology**: Tagalog/English mixed interface

### 4.2 Core Game Engine

```typescript
class MahjongGameEngine {
  private gameState: GameState
  private ruleSet: RuleSet
  private validator: MoveValidator
  private scorer: ScoringEngine

  constructor(variant: GameVariant) {
    this.ruleSet = RuleSetFactory.create(variant)
    this.validator = new MoveValidator(this.ruleSet)
    this.scorer = new ScoringEngine(this.ruleSet)
  }

  // Core game flow methods
  async initializeGame(players: Player[]): Promise<GameState>
  async dealInitialHands(): Promise<void>
  async processMove(playerId: string, move: Move): Promise<MoveResult>
  async checkWinConditions(playerId: string): Promise<WinResult | null>
  async calculateScore(winningHand: Hand): Promise<ScoreResult>
  async advanceTurn(): Promise<void>
  
  // Validation methods
  validateMove(playerId: string, move: Move): ValidationResult
  getAvailableActions(playerId: string): Action[]
  canClaimTile(playerId: string, claimType: ClaimType): boolean
  
  // State management
  getGameState(): GameState
  updateGameState(updates: Partial<GameState>): void
  serializeState(): string
  deserializeState(state: string): void
}

// Move validation system
class MoveValidator {
  validateDraw(player: Player, tile: Tile): ValidationResult
  validateDiscard(player: Player, tile: Tile): ValidationResult
  validateChi(player: Player, tiles: Tile[]): ValidationResult
  validatePon(player: Player, tiles: Tile[]): ValidationResult
  validateKan(player: Player, tiles: Tile[]): ValidationResult
  validateWin(player: Player, hand: Hand): ValidationResult
}

// Scoring engine
class ScoringEngine {
  calculateBasicScore(hand: Hand): number
  calculateYaku(hand: Hand): YakuResult[]
  calculateDora(hand: Hand, doraIndicators: Tile[]): number
  calculateFinalScore(baseScore: number, yaku: YakuResult[], dora: number): ScoreResult
}
```

### 4.3 Anti-Cheat System

```typescript
class AntiCheatSystem {
  // Tile tracking and validation
  private tileTracker: TileTracker
  private moveHistory: MoveHistory
  private suspiciousActivityDetector: SuspiciousActivityDetector

  // Server-side validation
  validateTileIntegrity(gameState: GameState): boolean
  validateMoveSequence(moves: Move[]): boolean
  detectSuspiciousPatterns(playerId: string): SuspiciousActivity[]
  
  // Encrypted game state
  encryptSensitiveData(data: any): string
  decryptSensitiveData(encryptedData: string): any
  
  // Rate limiting
  checkMoveRateLimit(playerId: string): boolean
  checkActionRateLimit(playerId: string): boolean
}
```

---

## 5. User Experience & Interface Design

### 5.1 Design System

#### 5.1.1 Color Palette
```css
:root {
  /* Primary Colors */
  --color-primary-50: #f0f9f4;
  --color-primary-100: #dcf2e3;
  --color-primary-500: #1B4332;
  --color-primary-600: #166534;
  --color-primary-900: #14532d;
  
  /* Accent Colors */
  --color-accent-400: #fbbf24;
  --color-accent-500: #D4AF37;
  --color-accent-600: #d97706;
  
  /* Background Colors */
  --color-bg-primary: #0F1419;
  --color-bg-secondary: #1a1f2e;
  --color-bg-tertiary: #2d3748;
  
  /* Text Colors */
  --color-text-primary: #ffffff;
  --color-text-secondary: #a0aec0;
  --color-text-muted: #718096;
}
```

#### 5.1.2 Typography Scale
```css
/* Font Families */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-chinese: 'Noto Sans SC', sans-serif;
--font-japanese: 'Noto Sans JP', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

#### 5.1.3 Component Library
```typescript
// Button variants
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  disabled?: boolean
  icon?: ReactNode
}

// Card components
interface CardProps {
  variant: 'default' | 'elevated' | 'outlined' | 'filled'
  padding: 'none' | 'sm' | 'md' | 'lg'
  rounded: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

// Mahjong-specific components
interface TileProps {
  tile: Tile
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  orientation: 'face-up' | 'face-down' | 'sideways'
  selectable?: boolean
  selected?: boolean
  onClick?: () => void
}
```

### 5.2 Responsive Design Strategy

#### 5.2.1 Breakpoint System
```css
/* Mobile First Approach */
/* xs: 0px - 475px */
/* sm: 476px - 640px */
/* md: 641px - 768px */
/* lg: 769px - 1024px */
/* xl: 1025px - 1280px */
/* 2xl: 1281px+ */
```

#### 5.2.2 Game Table Responsive Layout
```typescript
// Desktop: Full isometric view with video panels
// Tablet: Simplified view with collapsible video
// Mobile: Portrait-optimized with bottom hand display

interface ResponsiveGameLayout {
  desktop: {
    tableView: 'isometric'
    videoLayout: 'side-panels'
    handPosition: 'bottom-fixed'
    chatPosition: 'right-sidebar'
  }
  tablet: {
    tableView: 'top-down'
    videoLayout: 'overlay-modal'
    handPosition: 'bottom-drawer'
    chatPosition: 'bottom-sheet'
  }
  mobile: {
    tableView: 'simplified'
    videoLayout: 'fullscreen-modal'
    handPosition: 'bottom-fixed'
    chatPosition: 'slide-up'
  }
}
```

### 5.3 Accessibility Standards

#### 5.3.1 WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 ratio for normal text
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and descriptions
- **Focus Management**: Visible focus indicators
- **Alternative Text**: Descriptive alt text for all images

#### 5.3.2 Mahjong-Specific Accessibility
```typescript
interface AccessibilityFeatures {
  // Visual aids
  colorBlindSupport: boolean
  highContrastMode: boolean
  tilePatternAlternatives: boolean
  
  // Audio aids
  soundEffects: boolean
  voiceAnnouncements: boolean
  screenReaderOptimized: boolean
  
  // Motor accessibility
  clickTargetSize: 'standard' | 'large' | 'extra-large'
  dragAndDropAlternatives: boolean
  keyboardShortcuts: boolean
}
```

---

## 6. Real-Time Systems & Performance

### 6.1 Real-Time Architecture

#### 6.1.1 WebSocket Connection Management
```typescript
class RealtimeManager {
  private connections: Map<string, WebSocket>
  private gameRooms: Map<string, Set<string>>
  private heartbeatInterval: NodeJS.Timeout

  // Connection lifecycle
  handleConnection(ws: WebSocket, userId: string): void
  handleDisconnection(userId: string): void
  handleReconnection(userId: string): void
  
  // Room management
  joinRoom(userId: string, gameId: string): void
  leaveRoom(userId: string, gameId: string): void
  broadcastToRoom(gameId: string, event: string, data: any): void
  
  // Message handling
  handleMessage(userId: string, message: WebSocketMessage): void
  sendToUser(userId: string, event: string, data: any): void
  
  // Health monitoring
  startHeartbeat(): void
  checkConnectionHealth(): void
}
```

#### 6.1.2 State Synchronization
```typescript
class StateSynchronizer {
  private gameStates: Map<string, GameState>
  private pendingUpdates: Map<string, StateUpdate[]>
  
  // Optimistic updates
  applyOptimisticUpdate(gameId: string, update: StateUpdate): void
  revertOptimisticUpdate(gameId: string, updateId: string): void
  
  // Conflict resolution
  resolveStateConflict(gameId: string, conflicts: StateConflict[]): GameState
  
  // Delta compression
  generateStateDelta(oldState: GameState, newState: GameState): StateDelta
  applyStateDelta(state: GameState, delta: StateDelta): GameState
}
```

### 6.2 Performance Optimization

#### 6.2.1 Frontend Performance
```typescript
// Code splitting strategy
const GameTable = lazy(() => import('./components/game/GameTable'))
const VideoStreams = lazy(() => import('./components/video/VideoStreams'))
const Leaderboards = lazy(() => import('./pages/Leaderboards'))

// Memoization strategy
const MemoizedTile = memo(MahjongTile, (prevProps, nextProps) => {
  return prevProps.tile.id === nextProps.tile.id &&
         prevProps.selected === nextProps.selected
})

// Virtual scrolling for large lists
const VirtualizedLeaderboard = ({ items }: { items: Player[] }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={60}
      itemData={items}
    >
      {LeaderboardRow}
    </FixedSizeList>
  )
}
```

#### 6.2.2 Backend Performance
```typescript
// Redis caching strategy
class CacheManager {
  // Game state caching
  async cacheGameState(gameId: string, state: GameState): Promise<void>
  async getGameState(gameId: string): Promise<GameState | null>
  
  // User session caching
  async cacheUserSession(userId: string, session: UserSession): Promise<void>
  async getUserSession(userId: string): Promise<UserSession | null>
  
  // Leaderboard caching
  async cacheLeaderboard(type: string, data: LeaderboardData): Promise<void>
  async getLeaderboard(type: string): Promise<LeaderboardData | null>
}

// Database query optimization
class QueryOptimizer {
  // Prepared statements
  private preparedStatements: Map<string, PreparedStatement>
  
  // Connection pooling
  private connectionPool: Pool
  
  // Query batching
  async batchQueries(queries: Query[]): Promise<QueryResult[]>
  
  // Index optimization
  async analyzeQueryPerformance(): Promise<PerformanceReport>
}
```

### 6.3 Scalability Architecture

#### 6.3.1 Horizontal Scaling
```typescript
// Load balancer configuration
interface LoadBalancerConfig {
  algorithm: 'round-robin' | 'least-connections' | 'ip-hash'
  healthCheck: {
    interval: number
    timeout: number
    retries: number
  }
  stickySession: boolean
}

// Microservices architecture
interface ServiceArchitecture {
  gameEngine: {
    instances: number
    resources: ResourceRequirements
  }
  userService: {
    instances: number
    resources: ResourceRequirements
  }
  videoService: {
    instances: number
    resources: ResourceRequirements
  }
  notificationService: {
    instances: number
    resources: ResourceRequirements
  }
}
```

#### 6.3.2 Database Scaling
```sql
-- Read replicas for analytics
CREATE PUBLICATION analytics_pub FOR TABLE 
  users, games, game_moves, tournaments;

-- Partitioning strategy for game_moves
CREATE TABLE game_moves_2024_01 PARTITION OF game_moves
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Indexes for performance
CREATE INDEX CONCURRENTLY idx_games_active 
ON games (status, created_at) 
WHERE status IN ('waiting', 'active');
```

---

## 7. Video Streaming Integration

### 7.1 MUX Integration Architecture

#### 7.1.1 Live Streaming Setup
```typescript
class VideoStreamingService {
  private muxClient: Mux
  private activeStreams: Map<string, LiveStream>
  
  // Stream lifecycle
  async createLiveStream(gameId: string): Promise<LiveStream>
  async startStream(gameId: string, userId: string): Promise<StreamToken>
  async stopStream(gameId: string, userId: string): Promise<void>
  async endLiveStream(gameId: string): Promise<void>
  
  // Stream management
  async getStreamStatus(streamId: string): Promise<StreamStatus>
  async updateStreamSettings(streamId: string, settings: StreamSettings): Promise<void>
  
  // Playback
  async generatePlaybackToken(streamId: string, userId: string): Promise<PlaybackToken>
  async getPlaybackUrl(streamId: string): Promise<string>
}

// WebRTC peer connection management
class WebRTCManager {
  private peerConnections: Map<string, RTCPeerConnection>
  private localStream: MediaStream | null
  
  // Connection setup
  async initializeLocalStream(): Promise<MediaStream>
  async createPeerConnection(userId: string): Promise<RTCPeerConnection>
  async handleOffer(userId: string, offer: RTCSessionDescriptionInit): Promise<void>
  async handleAnswer(userId: string, answer: RTCSessionDescriptionInit): Promise<void>
  async handleIceCandidate(userId: string, candidate: RTCIceCandidate): Promise<void>
  
  // Stream management
  async addLocalStream(stream: MediaStream): Promise<void>
  async removeLocalStream(): Promise<void>
  async toggleVideo(enabled: boolean): Promise<void>
  async toggleAudio(enabled: boolean): Promise<void>
}
```

#### 7.1.2 Video Quality Optimization
```typescript
interface VideoQualitySettings {
  resolution: '480p' | '720p' | '1080p'
  framerate: 15 | 30 | 60
  bitrate: number
  adaptiveBitrate: boolean
}

class VideoQualityManager {
  // Adaptive streaming
  async adjustQualityBasedOnBandwidth(bandwidth: number): Promise<VideoQualitySettings>
  async detectNetworkConditions(): Promise<NetworkConditions>
  
  // Quality presets
  getQualityPreset(preset: 'low' | 'medium' | 'high'): VideoQualitySettings
  
  // Bandwidth monitoring
  async monitorBandwidth(): Promise<BandwidthMetrics>
  async optimizeForDevice(deviceType: DeviceType): Promise<VideoQualitySettings>
}
```

### 7.2 Premium Feature Gating

```typescript
class PremiumFeatureManager {
  // Subscription validation
  async validateSubscription(userId: string): Promise<SubscriptionStatus>
  async checkVideoStreamingAccess(userId: string): Promise<boolean>
  
  // Feature limiting
  async enforceVideoStreamLimits(userId: string): Promise<StreamLimits>
  async trackVideoUsage(userId: string, duration: number): Promise<void>
  
  // Billing integration
  async recordVideoStreamingUsage(userId: string, metrics: UsageMetrics): Promise<void>
  async generateUsageReport(userId: string, period: DateRange): Promise<UsageReport>
}
```

---

## 8. Security & Privacy

### 8.1 Authentication & Authorization

#### 8.1.1 JWT Token Management
```typescript
interface JWTPayload {
  userId: string
  email: string
  subscriptionTier: string
  permissions: string[]
  iat: number
  exp: number
}

class AuthenticationService {
  // Token lifecycle
  async generateAccessToken(user: User): Promise<string>
  async generateRefreshToken(user: User): Promise<string>
  async validateToken(token: string): Promise<JWTPayload | null>
  async refreshAccessToken(refreshToken: string): Promise<string>
  async revokeToken(token: string): Promise<void>
  
  // Multi-factor authentication
  async enableMFA(userId: string): Promise<MFASetup>
  async verifyMFA(userId: string, code: string): Promise<boolean>
  async generateBackupCodes(userId: string): Promise<string[]>
}
```

#### 8.1.2 Role-Based Access Control
```typescript
enum Permission {
  PLAY_GAME = 'play:game',
  CREATE_TOURNAMENT = 'create:tournament',
  MODERATE_CHAT = 'moderate:chat',
  ACCESS_VIDEO = 'access:video',
  ADMIN_PANEL = 'admin:panel'
}

class AuthorizationService {
  async checkPermission(userId: string, permission: Permission): Promise<boolean>
  async getUserRoles(userId: string): Promise<Role[]>
  async assignRole(userId: string, role: Role): Promise<void>
  async revokeRole(userId: string, role: Role): Promise<void>
}
```

### 8.2 Data Protection

#### 8.2.1 Encryption Strategy
```typescript
class EncryptionService {
  // Game state encryption
  async encryptGameState(state: GameState): Promise<string>
  async decryptGameState(encryptedState: string): Promise<GameState>
  
  // Personal data encryption
  async encryptPII(data: PersonalData): Promise<string>
  async decryptPII(encryptedData: string): Promise<PersonalData>
  
  // Communication encryption
  async encryptMessage(message: string, recipientPublicKey: string): Promise<string>
  async decryptMessage(encryptedMessage: string, privateKey: string): Promise<string>
}
```

#### 8.2.2 GDPR Compliance
```typescript
class PrivacyComplianceService {
  // Data subject rights
  async exportUserData(userId: string): Promise<UserDataExport>
  async deleteUserData(userId: string): Promise<DeletionReport>
  async anonymizeUserData(userId: string): Promise<AnonymizationReport>
  
  // Consent management
  async recordConsent(userId: string, consentType: ConsentType): Promise<void>
  async withdrawConsent(userId: string, consentType: ConsentType): Promise<void>
  async getConsentStatus(userId: string): Promise<ConsentStatus>
  
  // Data retention
  async applyRetentionPolicies(): Promise<RetentionReport>
  async scheduleDataDeletion(userId: string, deletionDate: Date): Promise<void>
}
```

### 8.3 Anti-Fraud & Abuse Prevention

```typescript
class FraudPreventionService {
  // Behavioral analysis
  async analyzePlayerBehavior(userId: string): Promise<BehaviorAnalysis>
  async detectSuspiciousActivity(userId: string): Promise<SuspiciousActivity[]>
  
  // Rate limiting
  async checkRateLimit(userId: string, action: string): Promise<boolean>
  async applyRateLimit(userId: string, action: string): Promise<void>
  
  // Account verification
  async verifyAccount(userId: string): Promise<VerificationStatus>
  async flagSuspiciousAccount(userId: string, reason: string): Promise<void>
}
```

---

## 9. Monitoring & Analytics

### 9.1 Application Performance Monitoring

#### 9.1.1 Metrics Collection
```typescript
interface PerformanceMetrics {
  // Frontend metrics
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  
  // Game-specific metrics
  gameLoadTime: number
  moveLatency: number
  stateUpdateLatency: number
  videoStreamLatency: number
  
  // Backend metrics
  apiResponseTime: number
  databaseQueryTime: number
  cacheHitRate: number
  errorRate: number
}

class MetricsCollector {
  async collectFrontendMetrics(): Promise<FrontendMetrics>
  async collectBackendMetrics(): Promise<BackendMetrics>
  async collectGameMetrics(gameId: string): Promise<GameMetrics>
  async sendMetrics(metrics: PerformanceMetrics): Promise<void>
}
```

#### 9.1.2 Error Tracking
```typescript
class ErrorTrackingService {
  // Error capture
  async captureError(error: Error, context: ErrorContext): Promise<void>
  async captureException(exception: Exception): Promise<void>
  
  // Error analysis
  async analyzeErrorTrends(): Promise<ErrorTrendReport>
  async groupSimilarErrors(errors: Error[]): Promise<ErrorGroup[]>
  
  // Alerting
  async setupErrorAlerts(config: AlertConfig): Promise<void>
  async sendErrorAlert(error: CriticalError): Promise<void>
}
```

### 9.2 Business Intelligence

#### 9.2.1 User Analytics
```typescript
interface UserAnalytics {
  // Engagement metrics
  dailyActiveUsers: number
  monthlyActiveUsers: number
  sessionDuration: number
  retentionRate: number
  churnRate: number
  
  // Game metrics
  gamesPlayed: number
  averageGameDuration: number
  completionRate: number
  
  // Revenue metrics
  conversionRate: number
  averageRevenuePerUser: number
  lifetimeValue: number
}

class AnalyticsService {
  async trackUserEvent(userId: string, event: AnalyticsEvent): Promise<void>
  async generateUserReport(userId: string): Promise<UserReport>
  async generateCohortAnalysis(cohortDefinition: CohortDefinition): Promise<CohortReport>
  async calculateRetentionMetrics(period: DateRange): Promise<RetentionMetrics>
}
```

#### 9.2.2 Game Analytics
```typescript
interface GameAnalytics {
  // Gameplay metrics
  averageGameLength: number
  mostPopularVariant: string
  peakPlayingHours: number[]
  
  // Skill metrics
  averageEloRating: number
  skillDistribution: SkillDistribution
  improvementRate: number
  
  // Social metrics
  friendInviteRate: number
  chatUsage: number
  videoStreamingUsage: number
}
```

---

## 10. Deployment & DevOps

### 10.1 CI/CD Pipeline

#### 10.1.1 GitHub Actions Workflow
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run linting
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run E2E tests
        run: npm run test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-files
          path: .next/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

#### 10.1.2 Environment Configuration
```typescript
// Environment variables schema
interface EnvironmentConfig {
  // Database
  DATABASE_URL: string
  REDIS_URL: string
  
  // Authentication
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  JWT_SECRET: string
  
  // Video streaming
  MUX_TOKEN_ID: string
  MUX_TOKEN_SECRET: string
  MUX_WEBHOOK_SECRET: string
  
  // Payment processing
  STRIPE_PUBLISHABLE_KEY: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  
  // Monitoring
  SENTRY_DSN: string
  DATADOG_API_KEY: string
  
  // Feature flags
  ENABLE_VIDEO_STREAMING: boolean
  ENABLE_TOURNAMENTS: boolean
  MAINTENANCE_MODE: boolean
}
```

### 10.2 Infrastructure as Code

#### 10.2.1 Docker Configuration
```dockerfile
# Frontend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### 10.2.2 Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mahjong-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mahjong-frontend
  template:
    metadata:
      labels:
        app: mahjong-frontend
    spec:
      containers:
      - name: frontend
        image: mahjong-platform/frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: supabase-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: mahjong-frontend-service
spec:
  selector:
    app: mahjong-frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 10.3 Monitoring & Alerting

#### 10.3.1 Health Checks
```typescript
class HealthCheckService {
  async checkDatabaseHealth(): Promise<HealthStatus>
  async checkRedisHealth(): Promise<HealthStatus>
  async checkExternalServices(): Promise<HealthStatus>
  async checkGameEngineHealth(): Promise<HealthStatus>
  
  async generateHealthReport(): Promise<HealthReport> {
    const checks = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
      this.checkExternalServices(),
      this.checkGameEngineHealth()
    ])
    
    return {
      status: checks.every(check => check.status === 'healthy') ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString()
    }
  }
}
```

#### 10.3.2 Alert Configuration
```typescript
interface AlertRule {
  name: string
  condition: string
  threshold: number
  duration: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  channels: string[]
}

const alertRules: AlertRule[] = [
  {
    name: 'High Error Rate',
    condition: 'error_rate > 0.05',
    threshold: 0.05,
    duration: '5m',
    severity: 'high',
    channels: ['slack', 'email']
  },
  {
    name: 'Database Connection Issues',
    condition: 'database_connection_errors > 10',
    threshold: 10,
    duration: '2m',
    severity: 'critical',
    channels: ['slack', 'email', 'pagerduty']
  },
  {
    name: 'High Response Time',
    condition: 'avg_response_time > 2000',
    threshold: 2000,
    duration: '10m',
    severity: 'medium',
    channels: ['slack']
  }
]
```

---

## 11. Testing Strategy

### 11.1 Testing Pyramid

#### 11.1.1 Unit Tests
```typescript
// Game logic unit tests
describe('MahjongGameEngine', () => {
  let gameEngine: MahjongGameEngine
  
  beforeEach(() => {
    gameEngine = new MahjongGameEngine('chinese_classical')
  })
  
  describe('validateMove', () => {
    it('should validate legal discard', () => {
      const player = createMockPlayer()
      const tile = createMockTile('1m')
      
      const result = gameEngine.validateMove(player.id, {
        type: 'discard',
        tile
      })
      
      expect(result.isValid).toBe(true)
    })
    
    it('should reject illegal chi claim', () => {
      const player = createMockPlayer()
      const tiles = [createMockTile('1m'), createMockTile('3m')]
      
      const result = gameEngine.validateMove(player.id, {
        type: 'chi',
        tiles
      })
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid chi sequence')
    })
  })
})

// Component unit tests
describe('MahjongTile', () => {
  it('should render tile correctly', () => {
    const tile = { id: '1', type: '1m', suit: 'man', value: 1 }
    
    render(<MahjongTile tile={tile} size="md" />)
    
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })
  
  it('should handle click events', () => {
    const handleClick = jest.fn()
    const tile = { id: '1', type: '1m', suit: 'man', value: 1 }
    
    render(<MahjongTile tile={tile} onClick={handleClick} />)
    
    fireEvent.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledWith(tile)
  })
})
```

#### 11.1.2 Integration Tests
```typescript
// API integration tests
describe('Game API', () => {
  let testDb: TestDatabase
  let server: TestServer
  
  beforeAll(async () => {
    testDb = await createTestDatabase()
    server = await createTestServer(testDb)
  })
  
  afterAll(async () => {
    await testDb.cleanup()
    await server.close()
  })
  
  describe('POST /api/games', () => {
    it('should create new game', async () => {
      const user = await createTestUser()
      const token = generateTestToken(user)
      
      const response = await request(server.app)
        .post('/api/games')
        .set('Authorization', `Bearer ${token}`)
        .send({
          variant: 'chinese_classical',
          maxPlayers: 4,
          isPrivate: false
        })
      
      expect(response.status).toBe(201)
      expect(response.body.game.id).toBeDefined()
      expect(response.body.game.variant).toBe('chinese_classical')
    })
  })
})

// Real-time integration tests
describe('WebSocket Game Events', () => {
  let client1: WebSocketClient
  let client2: WebSocketClient
  let gameId: string
  
  beforeEach(async () => {
    client1 = await createWebSocketClient()
    client2 = await createWebSocketClient()
    gameId = await createTestGame()
  })
  
  it('should synchronize game state between clients', async () => {
    await client1.emit('game:join', { gameId })
    await client2.emit('game:join', { gameId })
    
    const movePromise = new Promise(resolve => {
      client2.on('game:move_made', resolve)
    })
    
    await client1.emit('game:move', {
      gameId,
      move: { type: 'discard', tile: { id: '1', type: '1m' } }
    })
    
    const moveEvent = await movePromise
    expect(moveEvent.move.type).toBe('discard')
  })
})
```

#### 11.1.3 End-to-End Tests
```typescript
// Playwright E2E tests
import { test, expect } from '@playwright/test'

test.describe('Game Flow', () => {
  test('complete game from creation to finish', async ({ page, context }) => {
    // Create multiple browser contexts for multiplayer testing
    const player1Page = page
    const player2Page = await context.newPage()
    const player3Page = await context.newPage()
    const player4Page = await context.newPage()
    
    // Player 1 creates game
    await player1Page.goto('/dashboard')
    await player1Page.click('[data-testid="create-game-button"]')
    await player1Page.selectOption('[data-testid="variant-select"]', 'chinese_classical')
    await player1Page.click('[data-testid="create-button"]')
    
    const roomCode = await player1Page.textContent('[data-testid="room-code"]')
    
    // Other players join
    await player2Page.goto(`/game/join/${roomCode}`)
    await player3Page.goto(`/game/join/${roomCode}`)
    await player4Page.goto(`/game/join/${roomCode}`)
    
    // Wait for all players to be ready
    await expect(player1Page.locator('[data-testid="player-count"]')).toHaveText('4/4')
    
    // Start game
    await player1Page.click('[data-testid="start-game-button"]')
    
    // Verify game started for all players
    await expect(player1Page.locator('[data-testid="game-table"]')).toBeVisible()
    await expect(player2Page.locator('[data-testid="game-table"]')).toBeVisible()
    
    // Test basic gameplay
    await player1Page.click('[data-testid="tile-1m"]')
    await player1Page.click('[data-testid="discard-button"]')
    
    // Verify move reflected on other clients
    await expect(player2Page.locator('[data-testid="discard-pile"]')).toContainText('1m')
  })
  
  test('premium video streaming', async ({ page }) => {
    // Mock premium subscription
    await page.route('/api/auth/me', route => {
      route.fulfill({
        json: { user: { id: '1', subscriptionTier: 'premium' } }
      })
    })
    
    await page.goto('/game/test-game-id')
    
    // Verify video controls are available
    await expect(page.locator('[data-testid="video-toggle"]')).toBeVisible()
    
    // Enable video
    await page.click('[data-testid="video-toggle"]')
    
    // Verify video stream starts
    await expect(page.locator('[data-testid="video-stream"]')).toBeVisible()
  })
})
```

### 11.2 Performance Testing

#### 11.2.1 Load Testing
```typescript
// K6 load testing script
import http from 'k6/http'
import ws from 'k6/ws'
import { check } from 'k6'

export let options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200
    { duration: '5m', target: 200 },   // Stay at 200
    { duration: '2m', target: 0 },     // Ramp down
  ],
}

export default function() {
  // Test API endpoints
  let response = http.get('https://api.mahjong-platform.com/api/games')
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
  
  // Test WebSocket connections
  let url = 'wss://api.mahjong-platform.com/ws'
  let response = ws.connect(url, {}, function(socket) {
    socket.on('open', function() {
      socket.send(JSON.stringify({
        type: 'game:join',
        data: { gameId: 'test-game' }
      }))
    })
    
    socket.on('message', function(message) {
      let data = JSON.parse(message)
      check(data, {
        'message received': (d) => d.type !== undefined,
      })
    })
    
    socket.setTimeout(function() {
      socket.close()
    }, 30000)
  })
}
```

#### 11.2.2 Stress Testing
```typescript
// Artillery.js stress testing configuration
module.exports = {
  config: {
    target: 'https://api.mahjong-platform.com',
    phases: [
      { duration: 60, arrivalRate: 10 },
      { duration: 120, arrivalRate: 50 },
      { duration: 60, arrivalRate: 100 },
    ],
    socketio: {
      transports: ['websocket']
    }
  },
  scenarios: [
    {
      name: 'Game Creation and Joining',
      weight: 70,
      flow: [
        { post: { url: '/api/auth/login', json: { email: 'test@example.com', password: 'password' } } },
        { post: { url: '/api/games', json: { variant: 'chinese_classical' } } },
        { get: { url: '/api/games/{{ id }}' } },
        { post: { url: '/api/games/{{ id }}/join' } }
      ]
    },
    {
      name: 'Real-time Gameplay',
      weight: 30,
      engine: 'socketio',
      flow: [
        { emit: { channel: 'game:join', data: { gameId: 'test-game' } } },
        { emit: { channel: 'game:move', data: { move: { type: 'discard', tile: '1m' } } } },
        { think: 2 },
        { emit: { channel: 'game:move', data: { move: { type: 'draw' } } } }
      ]
    }
  ]
}
```

---

## 12. Internationalization & Localization

### 12.1 Multi-Language Support

#### 12.1.1 Supported Languages
- **English** (en-US) - Primary language
- **Simplified Chinese** (zh-CN) - Major market
- **Traditional Chinese** (zh-TW) - Taiwan/Hong Kong
- **Japanese** (ja-JP) - Riichi Mahjong players
- **Korean** (ko-KR) - Growing market
- **Filipino** (fil-PH) - Custom variant support

#### 12.1.2 Translation Architecture
```typescript
// i18n configuration
interface TranslationConfig {
  defaultLocale: string
  locales: string[]
  fallbackLocale: string
  interpolation: {
    escapeValue: boolean
  }
}

// Translation keys structure
interface TranslationKeys {
  common: {
    buttons: {
      save: string
      cancel: string
      confirm: string
      delete: string
    }
    navigation: {
      dashboard: string
      games: string
      profile: string
      leaderboards: string
    }
  }
  game: {
    actions: {
      draw: string
      discard: string
      chi: string
      pon: string
      kan: string
      ron: string
      tsumo: string
    }
    tiles: {
      man: string
      pin: string
      sou: string
      honor: string
    }
    phases: {
      dealing: string
      playing: string
      claiming: string
      scoring: string
    }
  }
  errors: {
    network: string
    validation: string
    authentication: string
    authorization: string
  }
}

// Translation service
class TranslationService {
  private translations: Map<string, TranslationKeys>
  
  async loadTranslations(locale: string): Promise<TranslationKeys>
  async translateKey(key: string, locale: string, params?: Record<string, any>): Promise<string>
  async detectUserLocale(): Promise<string>
  async setUserLocale(locale: string): Promise<void>
}
```

### 12.2 Cultural Adaptations

#### 12.2.1 Regional Game Variants
```typescript
interface RegionalVariant {
  id: string
  name: string
  region: string
  rules: GameRules
  terminology: TerminologyMap
  culturalElements: CulturalElements
}

const regionalVariants: RegionalVariant[] = [
  {
    id: 'chinese_classical',
    name: 'Chinese Classical',
    region: 'China',
    rules: chineseClassicalRules,
    terminology: chineseTerminology,
    culturalElements: {
      tileDesigns: 'traditional_chinese',
      colorScheme: 'red_gold',
      sounds: 'traditional_chinese'
    }
  },
  {
    id: 'japanese_riichi',
    name: 'Japanese Riichi',
    region: 'Japan',
    rules: riichiRules,
    terminology: japaneseTerminology,
    culturalElements: {
      tileDesigns: 'japanese_modern',
      colorScheme: 'blue_white',
      sounds: 'japanese_traditional'
    }
  },
  {
    id: 'filipino_mahjong',
    name: 'Filipino Mahjong',
    region: 'Philippines',
    rules: filipinoRules,
    terminology: filipinoTerminology,
    culturalElements: {
      tileDesigns: 'filipino_modern',
      colorScheme: 'tropical',
      sounds: 'filipino_contemporary'
    }
  }
]
```

#### 12.2.2 Time Zone Handling
```typescript
class TimeZoneService {
  async getUserTimeZone(): Promise<string>
  async convertToUserTime(utcTime: Date, userTimeZone: string): Promise<Date>
  async scheduleGameForTimeZone(gameTime: Date, timeZone: string): Promise<Date>
  async formatTimeForLocale(time: Date, locale: string): Promise<string>
}
```

---

## 13. Monetization Strategy

### 13.1 Subscription Tiers

#### 13.1.1 Pricing Structure
```typescript
interface SubscriptionTier {
  id: string
  name: string
  price: number // in cents
  currency: string
  interval: 'month' | 'year'
  features: Feature[]
  limits: UsageLimits
}

const subscriptionTiers: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      'basic_gameplay',
      'text_chat',
      'leaderboards',
      'basic_statistics'
    ],
    limits: {
      gamesPerDay: 10,
      videoStreaming: false,
      tournamentEntry: false,
      customization: 'basic'
    }
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 499, // $4.99
    currency: 'USD',
    interval: 'month',
    features: [
      'unlimited_gameplay',
      'video_streaming',
      'voice_chat',
      'advanced_statistics',
      'tournament_entry',
      'custom_tile_sets',
      'priority_support'
    ],
    limits: {
      gamesPerDay: -1, // unlimited
      videoStreaming: true,
      tournamentEntry: true,
      customization: 'full'
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999, // $9.99
    currency: 'USD',
    interval: 'month',
    features: [
      'all_premium_features',
      'tournament_creation',
      'advanced_analytics',
      'api_access',
      'white_label_options'
    ],
    limits: {
      gamesPerDay: -1,
      videoStreaming: true,
      tournamentEntry: true,
      tournamentCreation: true,
      customization: 'enterprise'
    }
  }
]
```

#### 13.1.2 Stripe Integration
```typescript
class SubscriptionService {
  private stripe: Stripe
  
  // Subscription management
  async createSubscription(userId: string, priceId: string): Promise<Subscription>
  async cancelSubscription(subscriptionId: string): Promise<void>
  async updateSubscription(subscriptionId: string, newPriceId: string): Promise<Subscription>
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus>
  
  // Payment processing
  async createPaymentIntent(amount: number, currency: string): Promise<PaymentIntent>
  async handleWebhook(event: Stripe.Event): Promise<void>
  
  // Usage tracking
  async trackVideoStreamingUsage(userId: string, duration: number): Promise<void>
  async checkUsageLimits(userId: string): Promise<UsageLimits>
}
```

### 13.2 In-App Purchases

#### 13.2.1 Virtual Goods
```typescript
interface VirtualGood {
  id: string
  name: string
  description: string
  price: number
  currency: string
  category: 'cosmetic' | 'functional' | 'consumable'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

const virtualGoods: VirtualGood[] = [
  {
    id: 'tile_set_jade',
    name: 'Jade Tile Set',
    description: 'Beautiful jade-themed tile design',
    price: 299, // $2.99
    currency: 'USD',
    category: 'cosmetic',
    rarity: 'rare'
  },
  {
    id: 'avatar_dragon',
    name: 'Dragon Avatar',
    description: 'Majestic dragon avatar',
    price: 199,
    currency: 'USD',
    category: 'cosmetic',
    rarity: 'epic'
  },
  {
    id: 'tournament_entry',
    name: 'Tournament Entry Token',
    description: 'Entry to premium tournaments',
    price: 499,
    currency: 'USD',
    category: 'functional',
    rarity: 'common'
  }
]
```

### 13.3 Revenue Analytics

```typescript
class RevenueAnalyticsService {
  // Revenue metrics
  async calculateMonthlyRecurringRevenue(): Promise<number>
  async calculateAverageRevenuePerUser(): Promise<number>
  async calculateCustomerLifetimeValue(): Promise<number>
  async calculateChurnRate(): Promise<number>
  
  // Conversion tracking
  async trackConversionFunnel(): Promise<ConversionFunnelData>
  async analyzeSubscriptionTrends(): Promise<SubscriptionTrendData>
  async generateRevenueReport(period: DateRange): Promise<RevenueReport>
}
```

---

## 14. Legal & Compliance

### 14.1 Terms of Service & Privacy Policy

#### 14.1.1 Key Legal Requirements
- **Data Protection**: GDPR, CCPA, PIPEDA compliance
- **Gaming Regulations**: Age verification, responsible gaming
- **Intellectual Property**: Trademark protection, DMCA compliance
- **Payment Processing**: PCI DSS compliance
- **International**: Multi-jurisdiction compliance

#### 14.1.2 Content Moderation
```typescript
class ContentModerationService {
  // Chat moderation
  async moderateMessage(message: string): Promise<ModerationResult>
  async detectToxicContent(content: string): Promise<ToxicityScore>
  async applyContentFilter(content: string): Promise<string>
  
  // User reporting
  async reportUser(reporterId: string, reportedId: string, reason: string): Promise<void>
  async reviewReport(reportId: string): Promise<ModerationAction>
  async applyModerationAction(userId: string, action: ModerationAction): Promise<void>
  
  // Automated moderation
  async setupAutoModeration(rules: ModerationRule[]): Promise<void>
  async trainModerationModel(trainingData: ModerationTrainingData): Promise<void>
}
```

### 14.2 Age Verification & Parental Controls

```typescript
class AgeVerificationService {
  async verifyAge(userId: string, birthDate: Date): Promise<AgeVerificationResult>
  async enableParentalControls(parentId: string, childId: string): Promise<void>
  async setSpendingLimits(userId: string, limits: SpendingLimits): Promise<void>
  async generateParentalReport(parentId: string): Promise<ParentalReport>
}
```

---

## 15. Future Roadmap & Scalability

### 15.1 Phase 1: MVP (Months 1-6)
- **Core Features**: Basic gameplay, user authentication, matchmaking
- **Supported Variants**: Chinese Classical, Japanese Riichi
- **Platforms**: Web (desktop/mobile)
- **Users**: 1,000 concurrent users
- **Revenue**: Free tier only

### 15.2 Phase 2: Premium Features (Months 7-12)
- **Video Streaming**: MUX integration for premium users
- **Advanced Features**: Tournaments, leaderboards, statistics
- **Mobile Apps**: iOS and Android native apps
- **Users**: 10,000 concurrent users
- **Revenue**: Premium subscriptions launch

### 15.3 Phase 3: Global Expansion (Months 13-18)
- **Localization**: Full multi-language support
- **Regional Variants**: Filipino Mahjong, Korean Mahjong
- **Social Features**: Clans, friend systems, social tournaments
- **Users**: 50,000 concurrent users
- **Revenue**: $2M ARR target

### 15.4 Phase 4: Advanced Features (Months 19-24)
- **AI Integration**: AI opponents, coaching, analysis
- **Esports Platform**: Professional tournaments, streaming integration
- **VR/AR Support**: Immersive gameplay experiences
- **Users**: 100,000+ concurrent users
- **Revenue**: $5M+ ARR

### 15.5 Technical Scalability Plan

#### 15.5.1 Infrastructure Scaling
```typescript
interface ScalingStrategy {
  phase1: {
    architecture: 'monolithic'
    database: 'single-instance'
    caching: 'redis-single'
    cdn: 'basic'
    monitoring: 'basic'
  }
  phase2: {
    architecture: 'microservices'
    database: 'read-replicas'
    caching: 'redis-cluster'
    cdn: 'global'
    monitoring: 'advanced'
  }
  phase3: {
    architecture: 'distributed'
    database: 'sharded'
    caching: 'multi-tier'
    cdn: 'edge-computing'
    monitoring: 'ai-powered'
  }
}
```

#### 15.5.2 Performance Targets
```typescript
interface PerformanceTargets {
  phase1: {
    responseTime: '< 200ms'
    uptime: '99.5%'
    concurrentUsers: 1000
    gameLatency: '< 100ms'
  }
  phase2: {
    responseTime: '< 150ms'
    uptime: '99.9%'
    concurrentUsers: 10000
    gameLatency: '< 50ms'
  }
  phase3: {
    responseTime: '< 100ms'
    uptime: '99.99%'
    concurrentUsers: 100000
    gameLatency: '< 25ms'
  }
}
```

---

## 16. Risk Assessment & Mitigation

### 16.1 Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| Scalability bottlenecks | Medium | High | Implement horizontal scaling, load testing |
| Real-time sync issues | Medium | High | Robust conflict resolution, state validation |
| Video streaming costs | High | Medium | Usage monitoring, tier-based access |
| Security vulnerabilities | Low | Critical | Regular security audits, penetration testing |
| Third-party service outages | Medium | Medium | Fallback systems, multi-provider strategy |

### 16.2 Business Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| Low user adoption | Medium | High | Beta testing, user feedback loops |
| Competitive pressure | High | Medium | Unique features, strong community |
| Regulatory changes | Low | High | Legal compliance monitoring |
| Economic downturn | Medium | Medium | Flexible pricing, cost optimization |
| Cultural sensitivity issues | Low | High | Cultural consultants, community feedback |

### 16.3 Operational Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| Key personnel departure | Medium | Medium | Documentation, knowledge sharing |
| Data loss | Low | Critical | Regular backups, disaster recovery |
| Service provider changes | Medium | Medium | Multi-provider strategy, contracts |
| Budget overruns | Medium | High | Regular budget reviews, cost monitoring |
| Timeline delays | High | Medium | Agile methodology, regular sprints |

---

## 17. Success Metrics & KPIs

### 17.1 User Engagement Metrics
- **Daily Active Users (DAU)**: Target 10,000+ by month 12
- **Monthly Active Users (MAU)**: Target 50,000+ by month 12
- **Session Duration**: Target 45+ minutes average
- **Games per Session**: Target 3+ games per session
- **User Retention**: 70% Day 1, 40% Day 7, 20% Day 30

### 17.2 Technical Performance Metrics
- **Page Load Time**: < 2 seconds (95th percentile)
- **API Response Time**: < 200ms (95th percentile)
- **Game Action Latency**: < 50ms (95th percentile)
- **Uptime**: 99.9% availability
- **Error Rate**: < 0.1% of all requests

### 17.3 Business Metrics
- **Monthly Recurring Revenue (MRR)**: Target $100K by month 12
- **Customer Acquisition Cost (CAC)**: < $10 per user
- **Customer Lifetime Value (CLV)**: > $50 per user
- **Conversion Rate**: 5% free to premium conversion
- **Churn Rate**: < 5% monthly churn

### 17.4 Quality Metrics
- **App Store Rating**: 4.5+ stars
- **Net Promoter Score (NPS)**: > 50
- **Customer Support Response**: < 2 hours
- **Bug Report Resolution**: < 24 hours for critical issues
- **Security Incidents**: Zero major security breaches

---

## 18. Conclusion

This comprehensive PRD outlines the technical and business requirements for building a world-class online Mahjong platform that meets San Francisco tech industry standards. The document provides detailed specifications for:

- **Technical Architecture**: Modern, scalable, and secure technology stack
- **User Experience**: Intuitive, accessible, and culturally sensitive design
- **Business Model**: Sustainable monetization through premium features
- **Quality Assurance**: Comprehensive testing and monitoring strategies
- **Scalability**: Clear roadmap for growth and expansion

The platform is designed to serve a global audience while maintaining cultural authenticity and providing premium features that justify subscription costs. With proper execution of this PRD, the Global Online Mahjong Platform can become the definitive destination for online Mahjong gameplay worldwide.

### Key Success Factors
1. **Technical Excellence**: Low-latency, high-availability platform
2. **Cultural Authenticity**: Respect for Mahjong traditions and variants
3. **Premium Value**: Video streaming and social features justify subscriptions
4. **Global Reach**: Multi-language, multi-cultural support
5. **Community Building**: Strong social features and tournament systems

This PRD serves as the foundation for development, providing clear guidance for engineering teams, product managers, and stakeholders throughout the development lifecycle.