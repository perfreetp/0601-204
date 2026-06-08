import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  AppState,
  Group,
  Character,
  ChatMessage,
  DiceRoll,
  StoryLog,
  NPCArchive,
  LibraryItem,
  MapState,
  User,
  ModuleType,
  SessionSchedule,
  Permission,
  DiceType,
  MapMarker,
  ClueCard,
  Attribute,
  Skill,
  UserRole,
} from '@shared/types';

const STORAGE_KEY = 'trpg-studio-data-v1';

const rolePermissions: Record<UserRole, Permission[]> = {
  keeper: [
    'edit_group', 'invite_player', 'manage_permissions',
    'edit_character', 'edit_story', 'edit_map',
    'roll_dice', 'send_message', 'use_voice', 'send_note', 'view_library',
  ],
  player: [
    'edit_character', 'roll_dice', 'send_message',
    'use_voice', 'send_note', 'view_library',
  ],
  guest: ['send_message', 'view_library'],
};

const defaultUser: User = {
  id: 'user-keeper-default',
  name: '主持人',
  role: 'keeper',
  permissions: rolePermissions.keeper,
};

const defaultMapState: MapState = {
  markers: [],
  clueCards: [],
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

interface PersistData {
  currentGroup: Group | null;
  currentUser: User;
  characters: Character[];
  chatMessages: ChatMessage[];
  diceHistory: DiceRoll[];
  storyLogs: StoryLog[];
  npcArchives: NPCArchive[];
  library: LibraryItem[];
  mapState: MapState;
}

function serializeState(s: PersistData): string {
  return JSON.stringify(s);
}

function deserializeState(str: string): PersistData | null {
  try {
    const d = JSON.parse(str);
    return {
      currentGroup: d.currentGroup || null,
      currentUser: d.currentUser || defaultUser,
      characters: d.characters || [],
      chatMessages: d.chatMessages || [],
      diceHistory: d.diceHistory || [],
      storyLogs: d.storyLogs || [],
      npcArchives: d.npcArchives || [],
      library: d.library || [],
      mapState: d.mapState || defaultMapState,
    };
  } catch {
    return null;
  }
}

async function loadPersisted(): Promise<PersistData | null> {
  try {
    if (typeof window !== 'undefined' && window.electronAPI?.loadData) {
      const raw = await window.electronAPI.loadData(STORAGE_KEY);
      if (raw) return deserializeState(raw);
    }
  } catch {}
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return deserializeState(raw);
  }
  return null;
}

let saveTimer: any = null;
function scheduleSave(state: PersistData) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const data = serializeState(state);
    if (typeof window !== 'undefined' && window.electronAPI?.saveData) {
      window.electronAPI.saveData(STORAGE_KEY, data).catch(() => {});
    }
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem(STORAGE_KEY, data); } catch {}
    }
  }, 300);
}

export type StoreActions = {
  setActiveModule: (module: ModuleType) => void;
  switchUser: (userId: string) => void;
  createGroup: (name: string, system: string, description?: string) => void;
  invitePlayer: (name: string, role: UserRole, customId?: string) => User;
  removeMember: (userId: string) => void;
  setMemberPermissions: (userId: string, permissions: Permission[]) => void;
  addSchedule: (schedule: Omit<SessionSchedule, 'id' | 'signups' | 'checkIns'>) => void;
  signupSchedule: (scheduleId: string, userId: string) => void;
  checkinSchedule: (scheduleId: string, userId: string) => void;
  deleteSchedule: (scheduleId: string) => void;
  addCharacter: (character: Partial<Character> & { name: string; isNPC: boolean }) => Character;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  addCharacterAttribute: (characterId: string, attr: Attribute) => void;
  updateCharacterAttribute: (characterId: string, attrName: string, value: number) => void;
  removeCharacterAttribute: (characterId: string, attrName: string) => void;
  addCharacterSkill: (characterId: string, skill: Skill) => void;
  updateCharacterSkill: (characterId: string, skillName: string, value: number) => void;
  removeCharacterSkill: (characterId: string, skillName: string) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp' | 'senderName' | 'senderAvatar'>) => ChatMessage;
  rollDice: (dice: DiceType, count: number, modifier: number, note?: string, skillName?: string, characterId?: string) => DiceRoll;
  addStoryLog: (log: Omit<StoryLog, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStoryLog: (id: string, updates: Partial<StoryLog>) => void;
  deleteStoryLog: (id: string) => void;
  addNPCArchive: (archive: Omit<NPCArchive, 'id'>) => NPCArchive;
  updateNPCArchive: (id: string, updates: Partial<NPCArchive>) => void;
  deleteNPCArchive: (id: string) => void;
  addLibraryItem: (item: Omit<LibraryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLibraryItem: (id: string, updates: Partial<LibraryItem>) => void;
  deleteLibraryItem: (id: string) => void;
  addMapMarker: (marker: Omit<MapMarker, 'id'>) => void;
  updateMapMarker: (id: string, updates: Partial<MapMarker>) => void;
  removeMapMarker: (id: string) => void;
  addClueCard: (card: Omit<ClueCard, 'id'>) => void;
  updateClueCard: (id: string, updates: Partial<ClueCard>) => void;
  removeClueCard: (id: string) => void;
  setMapBackground: (image: string | undefined) => void;
  setMapScale: (scale: number) => void;
  setMapOffset: (x: number, y: number) => void;
  setVoiceParticipants: (participants: string[]) => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  exportAllData: () => string;
  importData: (data: string) => void;
  clearAllData: () => void;
  loadPersistedData: () => Promise<void>;
  _persist: () => void;
};

export type FullStore = AppState & StoreActions;

export const useAppStore = create<FullStore>((set, get) => ({
  currentGroup: null,
  currentUser: defaultUser,
  characters: [],
  chatMessages: [],
  diceHistory: [],
  storyLogs: [],
  npcArchives: [],
  library: [],
  mapState: defaultMapState,
  activeModule: 'home',
  voiceParticipants: [],
  isMuted: false,
  isDeafened: false,

  _persist: () => {
    const s = get();
    scheduleSave({
      currentGroup: s.currentGroup,
      currentUser: s.currentUser,
      characters: s.characters,
      chatMessages: s.chatMessages,
      diceHistory: s.diceHistory,
      storyLogs: s.storyLogs,
      npcArchives: s.npcArchives,
      library: s.library,
      mapState: s.mapState,
    });
  },

  loadPersistedData: async () => {
    const data = await loadPersisted();
    if (data) {
      set({
        currentGroup: data.currentGroup,
        currentUser: data.currentUser,
        characters: data.characters,
        chatMessages: data.chatMessages,
        diceHistory: data.diceHistory,
        storyLogs: data.storyLogs,
        npcArchives: data.npcArchives,
        library: data.library,
        mapState: data.mapState,
      });
    }
  },

  setActiveModule: (module) => {
    set({ activeModule: module });
    get()._persist();
  },

  switchUser: (userId) => {
    const state = get();
    const target = state.currentGroup?.members.find((m) => m.id === userId);
    if (target) {
      set({ currentUser: target });
      get()._persist();
    }
  },

  createGroup: (name, system, description) => {
    const group: Group = {
      id: 'group-' + uuidv4(),
      name,
      system,
      description,
      createdAt: Date.now(),
      members: [defaultUser],
      schedules: [],
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    };
    set({ currentGroup: group });
    get()._persist();
  },

  invitePlayer: (name, role, customId) => {
    const state = get();
    if (!state.currentGroup) return defaultUser;
    const newUser: User = {
      id: customId || 'user-' + uuidv4(),
      name,
      role,
      permissions: rolePermissions[role],
    };
    set({
      currentGroup: {
        ...state.currentGroup,
        members: [...state.currentGroup.members, newUser],
      },
    });
    get()._persist();
    return newUser;
  },

  removeMember: (userId) => {
    const state = get();
    if (!state.currentGroup) return;
    set({
      currentGroup: {
        ...state.currentGroup,
        members: state.currentGroup.members.filter((m) => m.id !== userId),
      },
    });
    get()._persist();
  },

  setMemberPermissions: (userId, permissions) => {
    const state = get();
    if (!state.currentGroup) return;
    set({
      currentGroup: {
        ...state.currentGroup,
        members: state.currentGroup.members.map((m) =>
          m.id === userId ? { ...m, permissions } : m
        ),
      },
    });
    get()._persist();
  },

  addSchedule: (schedule) => {
    const state = get();
    if (!state.currentGroup) return;
    const newSchedule: SessionSchedule = {
      ...schedule,
      id: 'schedule-' + uuidv4(),
      signups: [],
      checkIns: [],
    };
    set({
      currentGroup: {
        ...state.currentGroup,
        schedules: [...state.currentGroup.schedules, newSchedule],
      },
    });
    get()._persist();
  },

  signupSchedule: (scheduleId, userId) => {
    const state = get();
    if (!state.currentGroup) return;
    set({
      currentGroup: {
        ...state.currentGroup,
        schedules: state.currentGroup.schedules.map((s) =>
          s.id === scheduleId
            ? { ...s, signups: s.signups.includes(userId) ? s.signups : [...s.signups, userId] }
            : s
        ),
      },
    });
    get()._persist();
  },

  checkinSchedule: (scheduleId, userId) => {
    const state = get();
    if (!state.currentGroup) return;
    set({
      currentGroup: {
        ...state.currentGroup,
        schedules: state.currentGroup.schedules.map((s) =>
          s.id === scheduleId
            ? { ...s, checkIns: s.checkIns.includes(userId) ? s.checkIns : [...s.checkIns, userId] }
            : s
        ),
      },
    });
    get()._persist();
  },

  deleteSchedule: (scheduleId) => {
    const state = get();
    if (!state.currentGroup) return;
    set({
      currentGroup: {
        ...state.currentGroup,
        schedules: state.currentGroup.schedules.filter((s) => s.id !== scheduleId),
      },
    });
    get()._persist();
  },

  addCharacter: (character) => {
    const newChar: Character = {
      id: 'char-' + uuidv4(),
      name: character.name,
      isNPC: character.isNPC,
      playerId: character.playerId,
      avatar: character.avatar,
      race: character.race,
      class: character.class,
      age: character.age,
      gender: character.gender,
      description: character.description,
      background: character.background,
      attributes: character.attributes || [],
      skills: character.skills || [],
      inventory: character.inventory || [],
      relations: character.relations || [],
      createdAt: Date.now(),
    };
    set((state) => ({ characters: [...state.characters, newChar] }));
    get()._persist();
    return newChar;
  },

  updateCharacter: (id, updates) => {
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
    get()._persist();
  },

  deleteCharacter: (id) => {
    set((state) => ({
      characters: state.characters.filter((c) => c.id !== id),
    }));
    get()._persist();
  },

  addCharacterAttribute: (characterId, attr) => {
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === characterId
          ? { ...c, attributes: [...c.attributes, attr] }
          : c
      ),
    }));
    get()._persist();
  },

  updateCharacterAttribute: (characterId, attrName, value) => {
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === characterId
          ? {
              ...c,
              attributes: c.attributes.map((a) =>
                a.name === attrName ? { ...a, value } : a
              ),
            }
          : c
      ),
    }));
    get()._persist();
  },

  removeCharacterAttribute: (characterId, attrName) => {
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === characterId
          ? { ...c, attributes: c.attributes.filter((a) => a.name !== attrName) }
          : c
      ),
    }));
    get()._persist();
  },

  addCharacterSkill: (characterId, skill) => {
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === characterId
          ? { ...c, skills: [...c.skills, skill] }
          : c
      ),
    }));
    get()._persist();
  },

  updateCharacterSkill: (characterId, skillName, value) => {
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === characterId
          ? {
              ...c,
              skills: c.skills.map((s) =>
                s.name === skillName ? { ...s, value } : s
              ),
            }
          : c
      ),
    }));
    get()._persist();
  },

  removeCharacterSkill: (characterId, skillName) => {
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === characterId
          ? { ...c, skills: c.skills.filter((s) => s.name !== skillName) }
          : c
      ),
    }));
    get()._persist();
  },

  addChatMessage: (message) => {
    const state = get();
    const sender = state.currentGroup?.members.find((m) => m.id === message.senderId);
    const newMessage: ChatMessage = {
      ...message,
      id: 'msg-' + uuidv4(),
      timestamp: Date.now(),
      senderName: sender?.name || '未知用户',
      senderAvatar: sender?.avatar,
    };
    set((state) => ({
      chatMessages: [...state.chatMessages, newMessage],
    }));
    get()._persist();
    return newMessage;
  },

  rollDice: (dice, count, modifier, note, skillName, characterId) => {
    const diceSize = parseInt(dice.slice(1));
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      results.push(Math.floor(Math.random() * diceSize) + 1);
    }
    const total = results.reduce((a, b) => a + b, 0) + modifier;
    const state = get();
    const roll: DiceRoll = {
      id: 'roll-' + uuidv4(),
      dice,
      count,
      modifier,
      results,
      total,
      userId: state.currentUser.id,
      characterId,
      skillName,
      timestamp: Date.now(),
      note,
    };
    set((s) => ({ diceHistory: [roll, ...s.diceHistory] }));

    const user = state.currentUser;
    const char = state.characters.find((c) => c.id === characterId);
    let msg = `${user.name} 投掷了 ${count}${dice}`;
    if (modifier !== 0) msg += modifier > 0 ? `+${modifier}` : `${modifier}`;
    if (skillName) msg += `【${skillName}检定】`;
    if (char) msg += ` (${char.name})`;
    msg += `\n结果: [${results.join(', ')}]`;
    if (modifier !== 0) msg += ` ${modifier > 0 ? '+' : ''}${modifier}`;
    msg += ` = ${total}`;
    if (note) msg += `\n备注: ${note}`;

    get().addChatMessage({
      type: 'dice',
      content: msg,
      senderId: user.id,
      diceRoll: roll,
    });

    return roll;
  },

  addStoryLog: (log) => {
    const now = Date.now();
    const newLog: StoryLog = {
      ...log,
      id: 'log-' + uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ storyLogs: [newLog, ...state.storyLogs] }));
    get()._persist();
  },

  updateStoryLog: (id, updates) => {
    set((state) => ({
      storyLogs: state.storyLogs.map((l) =>
        l.id === id ? { ...l, ...updates, updatedAt: Date.now() } : l
      ),
    }));
    get()._persist();
  },

  deleteStoryLog: (id) => {
    set((state) => ({
      storyLogs: state.storyLogs.filter((l) => l.id !== id),
    }));
    get()._persist();
  },

  addNPCArchive: (archive) => {
    const newArchive: NPCArchive = {
      ...archive,
      id: 'npc-' + uuidv4(),
    };
    set((state) => ({ npcArchives: [...state.npcArchives, newArchive] }));
    get()._persist();
    return newArchive;
  },

  updateNPCArchive: (id, updates) => {
    set((state) => ({
      npcArchives: state.npcArchives.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }));
    get()._persist();
  },

  deleteNPCArchive: (id) => {
    set((state) => ({
      npcArchives: state.npcArchives.filter((a) => a.id !== id),
    }));
    get()._persist();
  },

  addLibraryItem: (item) => {
    const now = Date.now();
    const newItem: LibraryItem = {
      ...item,
      id: 'lib-' + uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ library: [newItem, ...state.library] }));
    get()._persist();
  },

  updateLibraryItem: (id, updates) => {
    set((state) => ({
      library: state.library.map((i) =>
        i.id === id ? { ...i, ...updates, updatedAt: Date.now() } : i
      ),
    }));
    get()._persist();
  },

  deleteLibraryItem: (id) => {
    set((state) => ({
      library: state.library.filter((i) => i.id !== id),
    }));
    get()._persist();
  },

  addMapMarker: (marker) => {
    const newMarker: MapMarker = {
      ...marker,
      id: 'marker-' + uuidv4(),
    };
    set((state) => ({
      mapState: {
        ...state.mapState,
        markers: [...state.mapState.markers, newMarker],
      },
    }));
    get()._persist();
  },

  updateMapMarker: (id, updates) => {
    set((state) => ({
      mapState: {
        ...state.mapState,
        markers: state.mapState.markers.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        ),
      },
    }));
    get()._persist();
  },

  removeMapMarker: (id) => {
    set((state) => ({
      mapState: {
        ...state.mapState,
        markers: state.mapState.markers.filter((m) => m.id !== id),
      },
    }));
    get()._persist();
  },

  addClueCard: (card) => {
    const newCard: ClueCard = {
      ...card,
      id: 'clue-' + uuidv4(),
    };
    set((state) => ({
      mapState: {
        ...state.mapState,
        clueCards: [...state.mapState.clueCards, newCard],
      },
    }));
    get()._persist();
  },

  updateClueCard: (id, updates) => {
    set((state) => ({
      mapState: {
        ...state.mapState,
        clueCards: state.mapState.clueCards.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      },
    }));
    get()._persist();
  },

  removeClueCard: (id) => {
    set((state) => ({
      mapState: {
        ...state.mapState,
        clueCards: state.mapState.clueCards.filter((c) => c.id !== id),
      },
    }));
    get()._persist();
  },

  setMapBackground: (image) => {
    set((state) => ({
      mapState: { ...state.mapState, backgroundImage: image },
    }));
    get()._persist();
  },

  setMapScale: (scale) => {
    set((state) => ({
      mapState: { ...state.mapState, scale: Math.max(0.25, Math.min(4, scale)) },
    }));
    get()._persist();
  },

  setMapOffset: (x, y) => {
    set((state) => ({
      mapState: { ...state.mapState, offsetX: x, offsetY: y },
    }));
    get()._persist();
  },

  setVoiceParticipants: (participants) => {
    set({ voiceParticipants: participants });
    get()._persist();
  },

  toggleMute: () => {
    set((state) => ({ isMuted: !state.isMuted }));
    get()._persist();
  },

  toggleDeafen: () => {
    set((state) => ({ isDeafened: !state.isDeafened }));
    get()._persist();
  },

  exportAllData: () => {
    const state = get();
    const exportData = {
      group: state.currentGroup,
      characters: state.characters,
      storyLogs: state.storyLogs,
      npcArchives: state.npcArchives,
      library: state.library,
      diceHistory: state.diceHistory,
      mapState: state.mapState,
      chatMessages: state.chatMessages,
      exportedAt: Date.now(),
    };
    return JSON.stringify(exportData, null, 2);
  },

  importData: (dataStr) => {
    try {
      const data = JSON.parse(dataStr);
      set({
        currentGroup: data.group || null,
        characters: data.characters || [],
        storyLogs: data.storyLogs || [],
        npcArchives: data.npcArchives || [],
        library: data.library || [],
        diceHistory: data.diceHistory || [],
        mapState: data.mapState || defaultMapState,
        chatMessages: data.chatMessages || [],
      });
      get()._persist();
    } catch (e) {
      console.error('Import failed:', e);
    }
  },

  clearAllData: () => {
    set({
      currentGroup: null,
      characters: [],
      chatMessages: [],
      diceHistory: [],
      storyLogs: [],
      npcArchives: [],
      library: [],
      mapState: defaultMapState,
    });
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
}));
