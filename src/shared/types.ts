export type UserRole = 'keeper' | 'player' | 'guest';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  role: UserRole;
  permissions: Permission[];
}

export type Permission =
  | 'edit_group'
  | 'invite_player'
  | 'manage_permissions'
  | 'edit_character'
  | 'edit_story'
  | 'edit_map'
  | 'roll_dice'
  | 'send_message'
  | 'use_voice'
  | 'send_note'
  | 'view_library';

export interface Attribute {
  name: string;
  value: number;
  max?: number;
}

export interface Skill {
  name: string;
  value: number;
  description?: string;
}

export interface CharacterRelation {
  targetId: string;
  relationType: string;
  description?: string;
}

export interface Character {
  id: string;
  name: string;
  playerId?: string;
  avatar?: string;
  isNPC: boolean;
  race?: string;
  class?: string;
  age?: number;
  gender?: string;
  description?: string;
  background?: string;
  attributes: Attribute[];
  skills: Skill[];
  inventory: InventoryItem[];
  relations: CharacterRelation[];
  createdAt: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  description?: string;
  icon?: string;
}

export interface SessionSchedule {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;
  description?: string;
  signups: string[];
  checkIns: string[];
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  coverImage?: string;
  system: string;
  createdAt: number;
  members: User[];
  schedules: SessionSchedule[];
  inviteCode: string;
}

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export interface DiceRoll {
  id: string;
  dice: DiceType;
  count: number;
  modifier: number;
  results: number[];
  total: number;
  userId: string;
  characterId?: string;
  skillName?: string;
  timestamp: number;
  note?: string;
}

export type MessageType = 'text' | 'image' | 'dice' | 'note' | 'system';

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: number;
  isPrivate?: boolean;
  recipientId?: string;
  diceRoll?: DiceRoll;
}

export interface MapMarker {
  id: string;
  x: number;
  y: number;
  type: 'location' | 'npc' | 'clue' | 'danger' | 'custom';
  label: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface ClueCard {
  id: string;
  title: string;
  content: string;
  image?: string;
  x: number;
  y: number;
  discovered: boolean;
}

export interface StoryLog {
  id: string;
  title: string;
  content: string;
  sessionDate?: number;
  createdAt: number;
  updatedAt: number;
  characterIds: string[];
  tags: string[];
}

export interface NPCArchive {
  id: string;
  characterId: string;
  firstAppearance?: string;
  status: 'active' | 'deceased' | 'missing' | 'archived';
  notes: string;
  importantEvents: string[];
}

export interface LibraryItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface MapState {
  backgroundImage?: string;
  markers: MapMarker[];
  clueCards: ClueCard[];
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface AppState {
  currentGroup: Group | null;
  currentUser: User;
  characters: Character[];
  chatMessages: ChatMessage[];
  diceHistory: DiceRoll[];
  storyLogs: StoryLog[];
  npcArchives: NPCArchive[];
  library: LibraryItem[];
  mapState: MapState;
  activeModule: ModuleType;
  voiceParticipants: string[];
  isMuted: boolean;
  isDeafened: boolean;
}

export type ModuleType =
  | 'home'
  | 'character'
  | 'story'
  | 'map'
  | 'chat'
  | 'dice'
  | 'library';

export interface GroupExport {
  group: Group;
  characters: Character[];
  storyLogs: StoryLog[];
  npcArchives: NPCArchive[];
  library: LibraryItem[];
  diceHistory: DiceRoll[];
  mapState: MapState;
  exportedAt: number;
}
