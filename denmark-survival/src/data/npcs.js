/**
 * src/data/npcs.js
 * Static data for the 10 main NPCs in Denmark Survival.
 *
 * Each NPC has a complete profile including personality, location, daily
 * schedule (time-of-day → location), starting relationship value, and
 * narrative arc identifier.
 *
 * Schedule time slots: 'morning' | 'afternoon' | 'evening' | 'night'
 * A null value means the NPC is unavailable at that time.
 *
 * @type {Array<{
 *   id: string,
 *   name: string,
 *   role: string,
 *   personality: string,
 *   location: string,
 *   schedule: { morning: string|null, afternoon: string|null, evening: string|null, night: string|null },
 *   startingRelationship: number,
 *   portraitKey: string,
 *   spriteKey: string,
 *   arc: string
 * }>}
 */
export const NPCS = [
  {
    id: 'lars',
    name: 'Lars',
    role: 'Helpful Neighbor',
    personality: 'warm, patient, practical',
    location: 'apartment_area',
    schedule: {
      morning: null,
      afternoon: 'apartment_area',
      evening: 'apartment_area',
      night: null,
    },
    startingRelationship: 40,
    portraitKey: 'portrait_lars',
    spriteKey: 'npc_lars',
    arc: 'tutorial_guide',
  },
  {
    id: 'sofie',
    name: 'Sofie',
    role: 'Fellow Expat',
    personality: 'empathetic, humorous, resourceful',
    location: 'various',
    schedule: {
      morning: 'cafe',
      afternoon: 'language_school',
      evening: 'cafe',
      night: null,
    },
    startingRelationship: 35,
    portraitKey: 'portrait_sofie',
    spriteKey: 'npc_sofie',
    arc: 'support_buddy',
  },
  {
    id: 'henrik',
    name: 'Henrik',
    role: 'Co-Worker',
    personality: 'professional, reserved, helpful once trusted',
    location: 'workplace',
    schedule: {
      morning: 'workplace',
      afternoon: 'workplace',
      evening: null,
      night: null,
    },
    startingRelationship: 25,
    portraitKey: 'portrait_henrik',
    spriteKey: 'npc_henrik',
    arc: 'work_mentor',
  },
  {
    id: 'mette',
    name: 'Mette',
    role: 'Grocery Clerk',
    personality: 'cheerful, efficient, no-nonsense',
    location: 'grocery_store',
    schedule: {
      morning: 'grocery_store',
      afternoon: 'grocery_store',
      evening: null,
      night: null,
    },
    startingRelationship: 30,
    portraitKey: 'portrait_mette',
    spriteKey: 'npc_mette',
    arc: 'regular_interaction',
  },
  {
    id: 'kasper',
    name: 'Kasper',
    role: 'Cyclist',
    personality: 'energetic, competitive, outdoorsy',
    location: 'bike_lane',
    schedule: {
      morning: null,
      afternoon: 'bike_lane',
      evening: 'bike_lane',
      night: null,
    },
    startingRelationship: 15,
    portraitKey: 'portrait_kasper',
    spriteKey: 'npc_kasper',
    arc: 'cycling_mentor',
  },
  {
    id: 'dr_jensen',
    name: 'Dr. Jensen',
    role: 'General Practitioner',
    personality: 'calm, methodical, empathetic',
    location: 'medical_center',
    schedule: {
      morning: 'medical_center',
      afternoon: 'medical_center',
      evening: null,
      night: null,
    },
    startingRelationship: 20,
    portraitKey: 'portrait_dr_jensen',
    spriteKey: 'npc_dr_jensen',
    arc: 'health_advisor',
  },
  {
    id: 'bjorn',
    name: 'Bjørn',
    role: 'Municipal Worker',
    personality: 'bureaucratic, meticulous, dry humor',
    location: 'municipal_building',
    schedule: {
      morning: 'municipal_building',
      afternoon: 'municipal_building',
      evening: null,
      night: null,
    },
    startingRelationship: 10,
    portraitKey: 'portrait_bjorn',
    spriteKey: 'npc_bjorn',
    arc: 'bureaucracy_guide',
  },
  {
    id: 'freja',
    name: 'Freja',
    role: 'Social Butterfly',
    personality: 'outgoing, spontaneous, well-connected',
    location: 'social_venue',
    schedule: {
      morning: null,
      afternoon: 'social_venue',
      evening: 'cafe',
      night: null,
    },
    startingRelationship: 30,
    portraitKey: 'portrait_freja',
    spriteKey: 'npc_freja',
    arc: 'social_connector',
  },
  {
    id: 'thomas',
    name: 'Thomas',
    role: 'The Skeptic',
    personality: 'critical, direct, secretly fair-minded',
    location: 'various',
    schedule: {
      morning: 'workplace',
      afternoon: 'various',
      evening: null,
      night: null,
    },
    startingRelationship: 10,
    portraitKey: 'portrait_thomas',
    spriteKey: 'npc_thomas',
    arc: 'challenge_npc',
  },
  {
    id: 'emma',
    name: 'Emma',
    role: 'Student',
    personality: 'curious, studious, encouraging',
    location: 'language_school',
    schedule: {
      morning: 'language_school',
      afternoon: 'cafe',
      evening: null,
      night: null,
    },
    startingRelationship: 25,
    portraitKey: 'portrait_emma',
    spriteKey: 'npc_emma',
    arc: 'language_partner',
  },
];

/** Lookup an NPC by id. Returns undefined if not found. */
export function getNPCById(id) {
  return NPCS.find(npc => npc.id === id);
}
