/**
 * src/data/encyclopedia.js
 * Static encyclopedia/codex entries for the Denmark Survival game.
 *
 * Each entry represents a piece of Danish cultural knowledge that players
 * discover through gameplay. Entries are organized into 5 categories:
 * culture, language, places, activities, tips.
 *
 * Entry schema:
 *   id            — Unique identifier (string)
 *   title         — Display title (string)
 *   category      — One of: culture, language, places, activities, tips
 *   body          — 3-6 sentences of engaging content (string)
 *   icon          — Small illustration asset key (string)
 *   triggers      — Array of event objects that unlock this entry
 *   relatedEntries — Array of related entry IDs for cross-linking
 *   sourceText    — "Learned from: [source description]"
 */

/** Valid encyclopedia categories. */
export const CATEGORIES = ['culture', 'language', 'places', 'activities', 'tips'];

/** Category display metadata. */
export const CATEGORY_META = {
  culture:    { label: 'Culture',    icon: '🏛️', color: 0xcc3333 },
  language:   { label: 'Language',   icon: '🗣️', color: 0x3366cc },
  places:     { label: 'Places',     icon: '📍', color: 0x33aa55 },
  activities: { label: 'Activities', icon: '🎯', color: 0xcc7700 },
  tips:       { label: 'Tips',       icon: '💡', color: 0xccaa00 },
};

/** Starter entry IDs — available from Day 1. */
export const STARTER_ENTRY_IDS = ['places_apartment', 'lang_hej'];

/**
 * All encyclopedia entries.
 * @type {Array<{
 *   id: string,
 *   title: string,
 *   category: string,
 *   body: string,
 *   icon: string,
 *   triggers: Array<{ type: string, [key: string]: string|number }>,
 *   relatedEntries: string[],
 *   sourceText: string
 * }>}
 */
export const ENCYCLOPEDIA_DATA = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 🏛️ CULTURE (24 entries)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'culture_hygge',
    title: 'Hygge: More Than Just Cozy',
    category: 'culture',
    body: 'Hygge is the Danish concept of creating warmth, intimacy, and togetherness. It\'s not just about candles and blankets — it\'s a whole philosophy of enjoying life\'s simple pleasures with the people you care about. Danes practice hygge year-round, from cozy winter evenings to summer picnics in the park. Understanding hygge is key to understanding Danish social life.',
    icon: 'icon_hygge',
    triggers: [
      { type: 'npc_conversation', npcId: 'freja', conversationId: 'hygge_talk' },
      { type: 'encounter', encounterId: 'hygge_evening' },
    ],
    relatedEntries: ['lang_hygge', 'culture_coffee'],
    sourceText: 'Learned from: conversation about Danish lifestyle',
  },
  {
    id: 'culture_janteloven',
    title: 'Janteloven: The Law of Jante',
    category: 'culture',
    body: 'Janteloven is an unwritten social code emphasizing humility and collective well-being over individual achievement. "Don\'t think you\'re better than anyone else" is its core tenet. While some Danes find it restrictive, it deeply influences Danish egalitarianism. Bragging about success or standing out ostentatiously is seen as poor form in most social settings.',
    icon: 'icon_janteloven',
    triggers: [
      { type: 'npc_conversation', npcId: 'lars', conversationId: 'modesty_talk' },
    ],
    relatedEntries: ['culture_directness', 'culture_welfare'],
    sourceText: 'Learned from: interaction about Danish modesty',
  },
  {
    id: 'culture_birthday_flags',
    title: 'Danish Birthday Flags',
    category: 'culture',
    body: 'In Denmark, you\'ll see the Danish flag (Dannebrog) flying from flagpoles and decorating tables on birthdays. It\'s considered good luck and tradition to raise the flag for someone\'s birthday. Office desks get decorated with tiny flags, birthday cakes feature flag toothpicks, and gardens display the real thing. It\'s charming, patriotic, and completely normal here.',
    icon: 'icon_birthday_flags',
    triggers: [
      { type: 'encounter', encounterId: 'birthday_flags' },
    ],
    relatedEntries: ['culture_dannebrog', 'culture_fastelavn'],
    sourceText: 'Learned from: witnessing a Danish birthday celebration',
  },
  {
    id: 'culture_handshake',
    title: 'The Danish Handshake',
    category: 'culture',
    body: 'Danes typically greet with a firm handshake and direct eye contact. Hugs are reserved for close friends and family. In professional settings, the handshake is the go-to greeting — warm but not overly enthusiastic. First names are used almost universally, even with your boss. Formality exists, but Danish greetings are usually quick and sincere.',
    icon: 'icon_handshake',
    triggers: [
      { type: 'npc_conversation', npcId: 'henrik', conversationId: 'first_meeting' },
    ],
    relatedEntries: ['lang_hej', 'culture_directness'],
    sourceText: 'Learned from: first formal meeting in Denmark',
  },
  {
    id: 'culture_quiet_hours',
    title: 'Quiet Hours & Apartment Life',
    category: 'culture',
    body: 'Danish apartment living comes with strict unwritten rules about noise. Quiet hours are typically from 22:00 to 7:00, and many buildings enforce them rigorously. Vacuuming on Sunday mornings, loud music at night, or heavy footsteps late in the evening can spark passive-aggressive notes in the hallway — or worse, a visit from your neighbor.',
    icon: 'icon_quiet_hours',
    triggers: [
      { type: 'mistake', mistakeType: 'quiet_hours_violation' },
      { type: 'npc_conversation', npcId: 'lars', conversationId: 'noise_rules' },
    ],
    relatedEntries: ['tips_apartment_rules', 'culture_directness'],
    sourceText: 'Learned from: apartment living experience',
  },
  {
    id: 'culture_work_life',
    title: 'The Danish Work-Life Balance',
    category: 'culture',
    body: 'Danes take work-life balance seriously. Most people leave the office by 4 PM and spending late nights at work is seen as inefficient rather than dedicated. Flexible working hours, generous parental leave, and a culture that trusts employees to manage their own time contribute to Denmark consistently ranking among the happiest countries in the world.',
    icon: 'icon_work_life',
    triggers: [
      { type: 'activity_complete', activityId: 'first_workday' },
    ],
    relatedEntries: ['culture_welfare', 'activity_job_culture'],
    sourceText: 'Learned from: experiencing Danish work culture',
  },
  {
    id: 'culture_coffee',
    title: 'Coffee Culture (Not Fika, Almost)',
    category: 'culture',
    body: 'Danes drink more coffee per capita than almost any other country. While Swedes have fika, Danes have their own ritual of coffee breaks throughout the day. The workplace coffee machine is a social institution, and inviting someone for a kaffe is a genuine social gesture. Danish coffee is typically strong, black, and plentiful.',
    icon: 'icon_coffee',
    triggers: [
      { type: 'area_visit', areaId: 'cafe' },
    ],
    relatedEntries: ['lang_kaffe', 'culture_hygge'],
    sourceText: 'Learned from: visiting a Danish café',
  },
  {
    id: 'culture_trust',
    title: 'Trust-Based Society',
    category: 'culture',
    body: 'Denmark runs on trust. Babies sleep in prams outside cafés, shops use the honor system for small purchases, and conversations rarely involve verifying someone\'s claims. This social trust extends to institutions — Danes generally trust their government, police, and healthcare system. Living here means joining a society where your word genuinely matters.',
    icon: 'icon_trust',
    triggers: [
      { type: 'encounter', encounterId: 'trust_event' },
    ],
    relatedEntries: ['culture_welfare', 'culture_parenting'],
    sourceText: 'Learned from: experiencing Danish trust culture',
  },
  {
    id: 'culture_friluftsliv',
    title: 'The Concept of "Friluftsliv"',
    category: 'culture',
    body: 'Friluftsliv literally means "free air life" and represents the Nordic philosophy of outdoor living. Danes embrace nature in all seasons — cycling through rain, swimming in frigid harbor baths, and picnicking in city parks. It\'s not about extreme sports; it\'s about integrating the outdoors into everyday life as a source of well-being and connection.',
    icon: 'icon_friluftsliv',
    triggers: [
      { type: 'activity_complete', activityId: 'outdoor_activity' },
    ],
    relatedEntries: ['activity_biking', 'activity_winter_survival'],
    sourceText: 'Learned from: outdoor experiences in Denmark',
  },
  {
    id: 'culture_healthcare',
    title: 'Danish Healthcare: It\'s Free(ish)',
    category: 'culture',
    body: 'Healthcare in Denmark is universal and tax-funded. You register with a GP (praktiserende læge) who acts as your gatekeeper to specialists. Emergency rooms handle urgent cases, but for everything else, you call your doctor first. Dental care for adults isn\'t covered, and over-the-counter medicine is sold only in pharmacies (apotek), not supermarkets.',
    icon: 'icon_healthcare',
    triggers: [
      { type: 'npc_conversation', npcId: 'dr_jensen', conversationId: 'healthcare_intro' },
    ],
    relatedEntries: ['activity_health_system', 'culture_welfare'],
    sourceText: 'Learned from: visiting the doctor',
  },
  {
    id: 'culture_jul',
    title: 'Christmas in Denmark (Jul)',
    category: 'culture',
    body: 'Danish Christmas — Jul — is a month-long affair starting December 1st with advent calendars and Julekalender TV specials. Juleaften (Christmas Eve) is the main event, featuring roast duck, risalamande (a dessert with a hidden almond prize), and dancing around the Christmas tree. Nisser (mischievous elves) hide around homes, and gløgg flows freely.',
    icon: 'icon_jul',
    triggers: [
      { type: 'season_change', season: 'winter' },
      { type: 'encounter', encounterId: 'christmas_event' },
    ],
    relatedEntries: ['culture_sankt_hans', 'culture_fastelavn'],
    sourceText: 'Learned from: experiencing Danish Christmas traditions',
  },
  {
    id: 'culture_sankt_hans',
    title: 'Sankt Hans: Midsummer Night',
    category: 'culture',
    body: 'On June 23rd, Danes gather for Sankt Hans Aften — midsummer night. Bonfires are lit on beaches and in parks, often topped with a witch effigy (symbolizing evil spirits being sent to Bloksbjerg). People sing "Vi elsker vort land" and enjoy the longest day of the year with friends, food, and a deeply atmospheric tradition.',
    icon: 'icon_sankt_hans',
    triggers: [
      { type: 'encounter', encounterId: 'midsummer_event' },
    ],
    relatedEntries: ['culture_jul', 'culture_grundlovsdag'],
    sourceText: 'Learned from: attending a midsummer celebration',
  },
  {
    id: 'culture_humor',
    title: 'Danish Humor: Dry and Dark',
    category: 'culture',
    body: 'Danish humor is famously dry, self-deprecating, and occasionally dark. Sarcasm is a love language, and irony is a daily communication tool. Don\'t be alarmed when a Dane deadpans something absurd — it\'s probably a joke. Understanding Danish humor is a milestone in cultural integration, and being able to joke back earns genuine respect.',
    icon: 'icon_humor',
    triggers: [
      { type: 'npc_conversation', npcId: 'kasper', conversationId: 'danish_joke' },
    ],
    relatedEntries: ['culture_directness', 'lang_slang'],
    sourceText: 'Learned from: a Danish joke (probably)',
  },
  {
    id: 'culture_dannebrog',
    title: 'The Danish Flag (Dannebrog)',
    category: 'culture',
    body: 'The Dannebrog is the world\'s oldest continuously used national flag, dating back to 1219. Danes fly it everywhere — birthdays, holidays, sports events, and even at grocery stores. There are actual rules about when and how to fly it (never after sunset without a light, never in poor condition). It\'s a source of quiet pride, not aggressive nationalism.',
    icon: 'icon_dannebrog',
    triggers: [
      { type: 'encounter', encounterId: 'flag_sighting' },
    ],
    relatedEntries: ['culture_birthday_flags', 'culture_royal_family'],
    sourceText: 'Learned from: seeing flags throughout Copenhagen',
  },
  {
    id: 'culture_design',
    title: 'Scandinavian Design',
    category: 'culture',
    body: 'Danish design is world-famous for its minimalist elegance and functional beauty. From Arne Jacobsen\'s Egg Chair to everyday kitchenware, the philosophy is "less is more." Danes invest in quality furniture and household items that last decades. Your IKEA phase may have been Swedish, but the real love for design runs deep in Danish culture.',
    icon: 'icon_design',
    triggers: [
      { type: 'area_visit', areaId: 'design_store' },
    ],
    relatedEntries: ['culture_hygge', 'places_vesterbro'],
    sourceText: 'Learned from: visiting a Danish design store',
  },
  {
    id: 'culture_may_day',
    title: 'May Day in Denmark',
    category: 'culture',
    body: 'May 1st is a big deal in Denmark. Traditionally a labor movement holiday, it\'s now a day of speeches, gatherings, and celebrations in parks — particularly Fælledparken in Copenhagen. Politicians give speeches, unions organize events, and many Danes simply enjoy a day off with friends. There\'s often beer, music, and a festive atmosphere.',
    icon: 'icon_may_day',
    triggers: [
      { type: 'encounter', encounterId: 'may_day_event' },
    ],
    relatedEntries: ['culture_grundlovsdag', 'culture_welfare'],
    sourceText: 'Learned from: experiencing May Day celebrations',
  },
  {
    id: 'culture_royal_family',
    title: 'The Royal Family',
    category: 'culture',
    body: 'Denmark has one of the oldest monarchies in the world, and the Royal Family remains genuinely popular. They live relatively modestly compared to other royals, and the Queen (or King) is seen as a unifying figure rather than a political one. Royal birthdays and events are celebrated across the country with gentle enthusiasm.',
    icon: 'icon_royal_family',
    triggers: [
      { type: 'area_visit', areaId: 'palace' },
      { type: 'npc_conversation', npcId: 'lars', conversationId: 'monarchy_talk' },
    ],
    relatedEntries: ['culture_dannebrog', 'culture_grundlovsdag'],
    sourceText: 'Learned from: learning about Danish monarchy',
  },
  {
    id: 'culture_smorrebrod',
    title: 'Smørrebrød: Open Sandwich Art',
    category: 'culture',
    body: 'Smørrebrød is the Danish open-faced sandwich, and it\'s an art form. Built on dense rye bread (rugbrød), topped with combinations of herring, liver pâté, roast beef, or egg with shrimp, each piece is a carefully composed creation. There\'s even an etiquette to the eating order. Lunch at a traditional Danish restaurant is a smørrebrød experience.',
    icon: 'icon_smorrebrod',
    triggers: [
      { type: 'encounter', encounterId: 'smorrebrod_meal' },
      { type: 'activity_complete', activityId: 'cook_danish' },
    ],
    relatedEntries: ['lang_smorrebrod', 'activity_cooking'],
    sourceText: 'Learned from: trying Danish smørrebrød',
  },
  {
    id: 'culture_parenting',
    title: 'Danish Parenting: Free-Range Kids',
    category: 'culture',
    body: 'Danish parents often leave babies sleeping in prams outside shops and restaurants — a practice that would horrify many other cultures but is completely normal here. Children are encouraged to be independent from a young age, play outdoors unsupervised, and navigate the city by bike. Trust in community safety makes this possible.',
    icon: 'icon_parenting',
    triggers: [
      { type: 'encounter', encounterId: 'parenting_observation' },
    ],
    relatedEntries: ['culture_trust', 'culture_welfare'],
    sourceText: 'Learned from: observing Danish family life',
  },
  {
    id: 'culture_welfare',
    title: 'The Welfare State',
    category: 'culture',
    body: 'Danes pay some of the highest taxes in the world — and most are fine with it. In return, they get free healthcare, free education (including university), generous parental leave, unemployment insurance, and a strong social safety net. The philosophy is simple: everyone contributes, everyone benefits. It creates a remarkably equal society.',
    icon: 'icon_welfare',
    triggers: [
      { type: 'activity_complete', activityId: 'file_taxes' },
      { type: 'npc_conversation', npcId: 'lars', conversationId: 'tax_discussion' },
    ],
    relatedEntries: ['culture_healthcare', 'activity_taxes'],
    sourceText: 'Learned from: understanding the Danish tax system',
  },
  {
    id: 'culture_fredagsbaren',
    title: 'Fredagsbaren (Friday Bar)',
    category: 'culture',
    body: 'Every Friday afternoon, many Danish workplaces host a fredagsbar — an informal gathering with beer, snacks, and socializing. It\'s a beloved tradition that blurs the line between work and social life. Attendance is technically optional but highly encouraged. It\'s where you bond with colleagues in a relaxed setting and get to know people beyond their job titles.',
    icon: 'icon_fredagsbar',
    triggers: [
      { type: 'encounter', encounterId: 'friday_bar_event' },
    ],
    relatedEntries: ['culture_work_life', 'lang_skaal'],
    sourceText: 'Learned from: attending a workplace Friday bar',
  },
  {
    id: 'culture_fastelavn',
    title: 'Fastelavn: Danish Carnival',
    category: 'culture',
    body: 'Fastelavn is Denmark\'s carnival celebration, happening seven weeks before Easter. Children dress in costumes and go door-to-door (like Halloween), and the main event is "slå katten af tønden" — hitting a barrel with a bat until candy falls out. Originally, a real cat was inside the barrel (thankfully, that\'s long gone). The celebration is quirky and quintessentially Danish.',
    icon: 'icon_fastelavn',
    triggers: [
      { type: 'encounter', encounterId: 'fastelavn_event' },
    ],
    relatedEntries: ['culture_jul', 'culture_birthday_flags'],
    sourceText: 'Learned from: participating in Fastelavn',
  },
  {
    id: 'culture_grundlovsdag',
    title: 'Grundlovsdag: Constitution Day',
    category: 'culture',
    body: 'June 5th is Grundlovsdag, celebrating the Danish constitution signed in 1849. It\'s a half-day holiday — most shops close at noon and politicians give speeches in parks. It\'s low-key compared to other countries\' national holidays but reflects the Danish style: acknowledge the importance of democracy, then go enjoy the afternoon.',
    icon: 'icon_grundlovsdag',
    triggers: [
      { type: 'encounter', encounterId: 'grundlovsdag_event' },
    ],
    relatedEntries: ['culture_royal_family', 'culture_may_day'],
    sourceText: 'Learned from: observing Constitution Day',
  },
  {
    id: 'culture_directness',
    title: 'Danish Directness',
    category: 'culture',
    body: 'Danes are famously direct. They say what they mean without layers of politeness or ambiguity. "Your presentation needs work" means exactly that — no sugar-coating. This isn\'t rudeness; it\'s efficiency and honesty. Once you get used to it, you\'ll appreciate the clarity. But newcomers often mistake directness for hostility.',
    icon: 'icon_directness',
    triggers: [
      { type: 'npc_conversation', npcId: 'henrik', conversationId: 'blunt_feedback' },
    ],
    relatedEntries: ['culture_humor', 'culture_janteloven'],
    sourceText: 'Learned from: experiencing Danish directness firsthand',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🗣️ LANGUAGE (20 entries)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lang_hej',
    title: 'Hej & Hej Hej: Hello & Goodbye',
    category: 'language',
    body: '"Hej" (pronounced like "hi") is the most common Danish greeting. Casual and friendly, it works in almost every situation. "Hej hej" means goodbye — yes, you say it twice. "Godmorgen" (good morning), "goddag" (good day), and "godaften" (good evening) are more formal alternatives. Master "hej" and you\'re already communicating.',
    icon: 'icon_hej',
    triggers: [
      { type: 'encounter', encounterId: 'first_greeting' },
    ],
    relatedEntries: ['culture_handshake', 'lang_tak'],
    sourceText: 'Learned from: your first Danish greeting',
  },
  {
    id: 'lang_tak',
    title: 'Tak: The Most Important Word',
    category: 'language',
    body: '"Tak" means "thank you" and you\'ll use it constantly. "Mange tak" (many thanks) and "tusind tak" (thousand thanks) escalate the gratitude. Danes say "tak" when receiving change, leaving a store, ending a phone call, and basically any other moment. "Selv tak" (you\'re welcome) is the standard response. Learn this word first.',
    icon: 'icon_tak',
    triggers: [
      { type: 'activity_complete', activityId: 'first_purchase' },
    ],
    relatedEntries: ['lang_hej', 'lang_please'],
    sourceText: 'Learned from: a successful transaction',
  },
  {
    id: 'lang_undskyld',
    title: 'Undskyld: Excuse Me / Sorry',
    category: 'language',
    body: '"Undskyld" (oon-skewl) serves double duty as both "excuse me" and "I\'m sorry." Use it to get someone\'s attention, apologize for bumping into someone, or express regret. It\'s one of the hardest words to pronounce for newcomers, but Danes appreciate the effort. Keep practicing — you\'ll need it often.',
    icon: 'icon_undskyld',
    triggers: [
      { type: 'mistake', mistakeType: 'bump_into_npc' },
      { type: 'encounter', encounterId: 'apology_situation' },
    ],
    relatedEntries: ['lang_tak', 'lang_please'],
    sourceText: 'Learned from: an awkward social moment',
  },
  {
    id: 'lang_rodgrod',
    title: 'Rødgrød med Fløde',
    category: 'language',
    body: '"Rødgrød med fløde" (red berry pudding with cream) is the quintessential Danish pronunciation test. The three soft D\'s and the "ø" and "ø" vowels are nearly impossible for non-Danes. It\'s a beloved party trick — Danes love asking foreigners to attempt it. Don\'t feel bad when you fail; it\'s practically designed to be unpronounceable.',
    icon: 'icon_rodgrod',
    triggers: [
      { type: 'npc_conversation', npcId: 'kasper', conversationId: 'pronunciation_challenge' },
    ],
    relatedEntries: ['lang_tongue_twisters', 'culture_humor'],
    sourceText: 'Learned from: attempting Danish pronunciation',
  },
  {
    id: 'lang_numbers',
    title: 'Numbers 1-10 in Danish',
    category: 'language',
    body: 'En (1), to (2), tre (3), fire (4), fem (5), seks (6), syv (7), otte (8), ni (9), ti (10). Danish numbers above 20 get notoriously complicated — halvtreds (50), tres (60), and halvfjerds (70) are based on a vigesimal (base-20) counting system. For now, master 1-10 and you\'ll survive most shopping trips.',
    icon: 'icon_numbers',
    triggers: [
      { type: 'activity_complete', activityId: 'first_shopping' },
    ],
    relatedEntries: ['lang_supermarket', 'activity_shopping'],
    sourceText: 'Learned from: shopping in Denmark',
  },
  {
    id: 'lang_hygge',
    title: 'Hygge (Word Entry)',
    category: 'language',
    body: 'Hygge (hoo-guh) is perhaps the most famous Danish word with no direct English translation. It encompasses coziness, warmth, togetherness, and contentment. "Hyggelig" is the adjective form — a hyggelig evening, a hyggelig café. It\'s become globally trendy, but for Danes it\'s not a trend — it\'s a way of life.',
    icon: 'icon_hygge_word',
    triggers: [
      { type: 'npc_conversation', npcId: 'freja', conversationId: 'hygge_word' },
    ],
    relatedEntries: ['culture_hygge', 'lang_hej'],
    sourceText: 'Learned from: discussing untranslatable words',
  },
  {
    id: 'lang_smorrebrod',
    title: 'Smørrebrød (Word Entry)',
    category: 'language',
    body: 'Smørrebrød (smur-broth) literally means "butter bread" — smør (butter) + brød (bread). Danish is full of these compound words that are charmingly literal. Overskægskat? "Moustache tax." Tordenbyge? "Thunder shower." Learning to recognize compound words makes Danish vocabulary much more manageable.',
    icon: 'icon_smorrebrod_word',
    triggers: [
      { type: 'encounter', encounterId: 'smorrebrod_order' },
    ],
    relatedEntries: ['culture_smorrebrod', 'lang_supermarket'],
    sourceText: 'Learned from: decoding Danish compound words',
  },
  {
    id: 'lang_kaffe',
    title: 'Kaffe: Coffee Culture Words',
    category: 'language',
    body: 'Kaffe (coffee), en kop kaffe (a cup of coffee), sort kaffe (black coffee), kaffe latte. "Skal vi tage en kaffe?" means "Shall we grab a coffee?" and is one of the most useful phrases in Danish socializing. Danish cafés also serve "varm kakao" (hot chocolate) and "te" (tea). Ordering in Danish at your local café earns instant respect.',
    icon: 'icon_kaffe',
    triggers: [
      { type: 'area_visit', areaId: 'cafe' },
    ],
    relatedEntries: ['culture_coffee', 'lang_hej'],
    sourceText: 'Learned from: café visits in Copenhagen',
  },
  {
    id: 'lang_cykel',
    title: 'Cykel Vocabulary',
    category: 'language',
    body: 'Cykel (bicycle), cykelsti (bike path), cykellygte (bike light), dæk (tire), bremse (brake), styr (handlebar), pedal (pedal). Copenhagen\'s cycling culture means you\'ll use these words constantly. "Pas på!" (watch out!) is yelled regularly on bike paths. "Ring med klokken" means "ring the bell" — do it before overtaking.',
    icon: 'icon_cykel',
    triggers: [
      { type: 'activity_complete', activityId: 'first_bike_ride' },
    ],
    relatedEntries: ['activity_biking', 'tips_bike_lights'],
    sourceText: 'Learned from: cycling in Copenhagen',
  },
  {
    id: 'lang_weather',
    title: 'Danish Weather Words',
    category: 'language',
    body: 'Regn (rain), sol (sun), sne (snow), blæst (wind), overskyet (cloudy), tåge (fog). Danish weather is famously unpredictable — "der er ikke dårligt vejr, kun dårlig påklædning" means "there\'s no bad weather, only bad clothing." You\'ll hear weather small talk constantly, making these words essential for daily conversation.',
    icon: 'icon_weather',
    triggers: [
      { type: 'encounter', encounterId: 'weather_conversation' },
    ],
    relatedEntries: ['tips_layers', 'tips_weather_complain'],
    sourceText: 'Learned from: talking about Danish weather',
  },
  {
    id: 'lang_supermarket',
    title: 'Supermarket Danish',
    category: 'language',
    body: 'Mælk (milk), brød (bread), ost (cheese), smør (butter), æg (eggs), frugt (fruit), grøntsager (vegetables), kød (meat). Danish supermarkets have their own vocabulary — "tilbud" means sale/offer, "pose" is a bag (you\'ll pay for it), and "pant" is the deposit on bottles. Learning these words makes grocery shopping much less intimidating.',
    icon: 'icon_supermarket',
    triggers: [
      { type: 'activity_complete', activityId: 'first_shopping' },
    ],
    relatedEntries: ['lang_numbers', 'activity_shopping'],
    sourceText: 'Learned from: navigating a Danish supermarket',
  },
  {
    id: 'lang_please',
    title: "Please Doesn't Exist",
    category: 'language',
    body: 'Danish doesn\'t have a direct equivalent of "please." Instead, politeness is conveyed through tone, "tak" (thanks), and phrasing. "Kan jeg få...?" (Can I get...?) or "Vil du...?" (Would you...?) serve the same function. This absence of "please" doesn\'t mean Danes are rude — they just express courtesy differently than English speakers expect.',
    icon: 'icon_please',
    triggers: [
      { type: 'mistake', mistakeType: 'cultural_faux_pas' },
    ],
    relatedEntries: ['lang_tak', 'lang_undskyld'],
    sourceText: 'Learned from: a cultural communication moment',
  },
  {
    id: 'lang_skaal',
    title: 'Skål: Cheers!',
    category: 'language',
    body: '"Skål!" (skol) is the Danish toast, spoken while making eye contact with everyone at the table. The ritual is important: raise your glass, make eye contact, say "skål," take a drink, then make eye contact again before putting the glass down. Forgetting the eye contact is considered bad luck (and bad manners).',
    icon: 'icon_skaal',
    triggers: [
      { type: 'encounter', encounterId: 'social_drinking_event' },
    ],
    relatedEntries: ['culture_fredagsbaren', 'lang_kaffe'],
    sourceText: 'Learned from: a social gathering',
  },
  {
    id: 'lang_meals',
    title: 'Frokost vs Middag',
    category: 'language',
    body: 'In Danish, "frokost" means lunch (not breakfast), and "middag" means dinner (not midday). "Morgenmad" is breakfast — literally "morning food." This trips up many newcomers who directly translate from other languages. Danes eat frokost around noon (often smørrebrød), and middag typically around 6 PM.',
    icon: 'icon_meals',
    triggers: [
      { type: 'encounter', encounterId: 'meal_confusion' },
    ],
    relatedEntries: ['culture_smorrebrod', 'lang_supermarket'],
    sourceText: 'Learned from: a mealtime misunderstanding',
  },
  {
    id: 'lang_colors',
    title: 'Colors in Danish',
    category: 'language',
    body: 'Rød (red), blå (blue), grøn (green), gul (yellow), sort (black), hvid (white), brun (brown), grå (gray), lyserød (pink — literally "light red"), lilla (purple), orange (orange). Colors in Danish are mostly straightforward, though some change form as adjectives. "Den røde cykel" means "the red bicycle." Useful for shopping and descriptions.',
    icon: 'icon_colors',
    triggers: [
      { type: 'activity_complete', activityId: 'clothes_shopping' },
    ],
    relatedEntries: ['lang_numbers', 'lang_supermarket'],
    sourceText: 'Learned from: shopping for clothes in Denmark',
  },
  {
    id: 'lang_days',
    title: 'Days of the Week',
    category: 'language',
    body: 'Mandag (Monday), tirsdag (Tuesday), onsdag (Wednesday), torsdag (Thursday), fredag (Friday), lørdag (Saturday), søndag (Sunday). Several come from Norse mythology — tirsdag from Tyr, onsdag from Odin, torsdag from Thor, and fredag from Freja. Knowing the days helps with scheduling and understanding shop opening hours.',
    icon: 'icon_days',
    triggers: [
      { type: 'activity_complete', activityId: 'schedule_planning' },
    ],
    relatedEntries: ['lang_numbers', 'culture_fredagsbaren'],
    sourceText: 'Learned from: planning your week in Denmark',
  },
  {
    id: 'lang_emergency',
    title: 'Emergency Phrases',
    category: 'language',
    body: '"Hjælp!" (help!), "Ring 112!" (call 112 — the emergency number), "Jeg har brug for en læge" (I need a doctor), "Skadestuen" (emergency room), "Det gør ondt" (it hurts). In emergencies, most Danes speak excellent English, but knowing these phrases shows preparedness and can save crucial seconds.',
    icon: 'icon_emergency',
    triggers: [
      { type: 'encounter', encounterId: 'health_emergency' },
    ],
    relatedEntries: ['culture_healthcare', 'activity_health_system'],
    sourceText: 'Learned from: a health-related situation',
  },
  {
    id: 'lang_workplace',
    title: 'Workplace Danish',
    category: 'language',
    body: '"Møde" (meeting), "mail" (email — yes, they use the English word), "deadline" (also English), "frokostordning" (lunch arrangement), "kollegaer" (colleagues), "chefen" (the boss). Danish workplaces use a surprising amount of English vocabulary, making the transition easier. "Vi holder møde klokken 10" means "We\'re having a meeting at 10."',
    icon: 'icon_workplace',
    triggers: [
      { type: 'activity_complete', activityId: 'first_workday' },
    ],
    relatedEntries: ['culture_work_life', 'activity_job_culture'],
    sourceText: 'Learned from: office interactions',
  },
  {
    id: 'lang_tongue_twisters',
    title: 'Danish Tongue Twisters',
    category: 'language',
    body: '"Fem flade flødeboller på et fladt flødebollefad" — try saying that five times fast. Danish tongue twisters are practically weapons of mass pronunciation destruction. They\'re also a fun party trick and a sign that a Dane really likes you if they teach you one. Practicing them actually does improve your Danish pronunciation.',
    icon: 'icon_tongue_twisters',
    triggers: [
      { type: 'npc_conversation', npcId: 'kasper', conversationId: 'tongue_twister_lesson' },
    ],
    relatedEntries: ['lang_rodgrod', 'culture_humor'],
    sourceText: 'Learned from: a Danish language lesson',
  },
  {
    id: 'lang_slang',
    title: 'Slang & Informal Danish',
    category: 'language',
    body: '"Fedt!" (cool! — literally "fat"), "Vildt!" (wild! — meaning awesome), "Mega" (used like "very" — "mega fedt!"), "Sgu" (a mild oath, like "damn"), "Pisse" (intensifier — "pisse godt" means "really good"). Danish slang is colorful and constantly evolving. Using casual Danish shows you\'re integrating beyond the textbook level.',
    icon: 'icon_slang',
    triggers: [
      { type: 'npc_conversation', npcId: 'freja', conversationId: 'casual_speech' },
      { type: 'skill_milestone', skill: 'language', level: 5 },
    ],
    relatedEntries: ['culture_humor', 'lang_hej'],
    sourceText: 'Learned from: close friendships with Danes',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 📍 PLACES (14 entries)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'places_apartment',
    title: 'Your Apartment: Home Base',
    category: 'places',
    body: 'Your apartment is your sanctuary in Copenhagen. It\'s small by some standards but perfectly Danish — functional, minimal, and yours. This is where you\'ll cook your first meal, practice Danish vocabulary, and collapse after long days navigating a new culture. Make it feel like home, because it is.',
    icon: 'icon_apartment',
    triggers: [
      { type: 'area_visit', areaId: 'apartment' },
    ],
    relatedEntries: ['culture_quiet_hours', 'tips_apartment_rules'],
    sourceText: 'Learned from: arriving at your new home',
  },
  {
    id: 'places_metro',
    title: 'The Metro System',
    category: 'places',
    body: 'Copenhagen\'s metro is driverless, runs 24/7 on weekends, and is remarkably clean. The M1, M2, M3 (Cityringen), and M4 lines connect the city efficiently. You need a rejsekort (travel card) or ticket — controllers do check, and fines are steep (750 DKK). The stations are architectural showcases, especially the underground ones.',
    icon: 'icon_metro',
    triggers: [
      { type: 'activity_complete', activityId: 'first_metro_ride' },
    ],
    relatedEntries: ['activity_metro', 'places_city_center'],
    sourceText: 'Learned from: your first metro ride',
  },
  {
    id: 'places_norrebro',
    title: 'Nørrebro: The Diverse Heart',
    category: 'places',
    body: 'Nørrebro is Copenhagen\'s most diverse and vibrant neighborhood. Street art, international food markets, independent shops, and a pulsing nightlife define the area. Assistens Cemetery (where Hans Christian Andersen is buried) doubles as a park where locals sunbathe. It\'s multicultural, energetic, and never boring.',
    icon: 'icon_norrebro',
    triggers: [
      { type: 'area_visit', areaId: 'norrebro' },
    ],
    relatedEntries: ['places_vesterbro', 'places_city_center'],
    sourceText: 'Learned from: exploring Nørrebro',
  },
  {
    id: 'places_vesterbro',
    title: 'Vesterbro: Hip & Happening',
    category: 'places',
    body: 'Once Copenhagen\'s red-light district, Vesterbro has transformed into the city\'s trendiest neighborhood. Specialty coffee shops, vintage boutiques, and craft breweries line the streets around Istedgade and Kødbyen (the Meatpacking District turned nightlife hub). It\'s where old Copenhagen meets new, with a creative energy that\'s impossible to miss.',
    icon: 'icon_vesterbro',
    triggers: [
      { type: 'area_visit', areaId: 'vesterbro' },
    ],
    relatedEntries: ['places_norrebro', 'culture_design'],
    sourceText: 'Learned from: exploring Vesterbro',
  },
  {
    id: 'places_christianshavn',
    title: 'Christianshavn: Canals & Community',
    category: 'places',
    body: 'Christianshavn is defined by its canals, houseboats, and the famous Christiania — a self-governing community established in 1971. The area has a relaxed, almost village-like atmosphere within the city. Church of Our Saviour offers stunning views from its spiral tower, and the canal-side restaurants serve some of the best seafood in town.',
    icon: 'icon_christianshavn',
    triggers: [
      { type: 'area_visit', areaId: 'christianshavn' },
    ],
    relatedEntries: ['places_harbor', 'places_city_center'],
    sourceText: 'Learned from: exploring Christianshavn',
  },
  {
    id: 'places_frederiksberg',
    title: 'Frederiksberg: Green & Elegant',
    category: 'places',
    body: 'Technically its own municipality within Copenhagen, Frederiksberg is known for its expansive parks, the zoo, and elegant residential streets. Frederiksberg Have (Gardens) is a beloved green space with lakes, a palace, and plenty of room for hyggelig picnics. The area feels more refined and residential than the inner city.',
    icon: 'icon_frederiksberg',
    triggers: [
      { type: 'area_visit', areaId: 'frederiksberg' },
    ],
    relatedEntries: ['places_park', 'culture_friluftsliv'],
    sourceText: 'Learned from: visiting Frederiksberg',
  },
  {
    id: 'places_city_center',
    title: 'City Center (Indre By)',
    category: 'places',
    body: 'Indre By is Copenhagen\'s historic heart — home to Strøget (one of Europe\'s longest pedestrian streets), Tivoli Gardens, the Round Tower, and Nyhavn\'s colorful harbor houses. It\'s touristy but essential. The blend of medieval streets and modern shopping creates a uniquely Danish urban experience.',
    icon: 'icon_city_center',
    triggers: [
      { type: 'area_visit', areaId: 'city_center' },
    ],
    relatedEntries: ['places_norrebro', 'places_harbor'],
    sourceText: 'Learned from: exploring the city center',
  },
  {
    id: 'places_harbor',
    title: 'The Harbor (Havnen)',
    category: 'places',
    body: 'Copenhagen\'s harbor has been transformed from industrial docks into a vibrant waterfront. Harbor baths offer free swimming (yes, the water is clean enough), kayaking is popular, and waterfront cafés line the quays. In summer, the harbor becomes Copenhagen\'s living room — swimming, sunbathing, and socializing by the water.',
    icon: 'icon_harbor',
    triggers: [
      { type: 'area_visit', areaId: 'harbor' },
    ],
    relatedEntries: ['places_christianshavn', 'culture_friluftsliv'],
    sourceText: 'Learned from: visiting the Copenhagen harbor',
  },
  {
    id: 'places_park',
    title: 'The Local Park',
    category: 'places',
    body: 'Danish parks are communal living rooms. In summer, they fill with barbecues, frisbee games, sunbathers, and groups sharing wine and snacks. In winter, hardy joggers and dog walkers still keep them alive. Parks are where Danes practice friluftsliv, celebrate holidays, and simply enjoy being outdoors. Finding "your" park is a rite of passage.',
    icon: 'icon_park',
    triggers: [
      { type: 'area_visit', areaId: 'park' },
    ],
    relatedEntries: ['culture_friluftsliv', 'places_frederiksberg'],
    sourceText: 'Learned from: spending time in a Danish park',
  },
  {
    id: 'places_workplace',
    title: 'Your Workplace',
    category: 'places',
    body: 'Danish workplaces are characterized by flat hierarchies, open-plan offices, and a culture of trust. Your boss goes by their first name, meetings start on time and end on time, and the communal kitchen is a social hub. The fredagsbar (Friday bar) is a weekly institution. Work-life balance isn\'t just policy — it\'s practice.',
    icon: 'icon_workplace',
    triggers: [
      { type: 'activity_complete', activityId: 'first_workday' },
    ],
    relatedEntries: ['culture_work_life', 'culture_fredagsbaren'],
    sourceText: 'Learned from: your first day at work',
  },
  {
    id: 'places_borgerservice',
    title: 'Municipal Building (Borgerservice)',
    category: 'places',
    body: 'Borgerservice is where bureaucracy happens — CPR registration, address changes, passport renewals, and more. The experience is surprisingly efficient (by government standards), with ticket numbers and digital screens. Bring your documentation, arrive early, and be patient. A successful trip to borgerservice is a genuine achievement.',
    icon: 'icon_borgerservice',
    triggers: [
      { type: 'activity_complete', activityId: 'cpr_registration' },
    ],
    relatedEntries: ['activity_cpr', 'activity_nemid'],
    sourceText: 'Learned from: navigating Danish bureaucracy',
  },
  {
    id: 'places_library',
    title: 'The Library',
    category: 'places',
    body: 'Danish libraries are community treasures — free internet, language classes, cultural events, and a warm place to spend a rainy afternoon. Copenhagen\'s libraries often host "language cafés" where newcomers can practice Danish with locals. They\'re also excellent resources for understanding Danish culture through books, films, and music.',
    icon: 'icon_library',
    triggers: [
      { type: 'area_visit', areaId: 'library' },
    ],
    relatedEntries: ['activity_language_exchange', 'culture_welfare'],
    sourceText: 'Learned from: discovering your local library',
  },
  {
    id: 'places_grocery_store',
    title: 'The Grocery Store',
    category: 'places',
    body: 'Danish supermarkets (Netto, Føtex, Irma, Bilka) are well-organized and offer a huge selection of products. Bags cost extra (bring your own), the pant system handles bottle recycling, and organic (økologisk) products are everywhere. Pro tip: the bakery section has excellent bread, and the rye bread (rugbrød) shelf is essential Danish territory.',
    icon: 'icon_grocery',
    triggers: [
      { type: 'activity_complete', activityId: 'first_shopping' },
    ],
    relatedEntries: ['lang_supermarket', 'activity_shopping'],
    sourceText: 'Learned from: your first grocery run',
  },
  {
    id: 'places_bike_shop',
    title: 'The Bicycle Shop',
    category: 'places',
    body: 'A good bicycle shop is essential in Copenhagen. They sell new and used bikes, perform repairs, and offer advice on navigating the city\'s extensive cycling infrastructure. Copenhagen has more bikes than people, and the cycling culture runs deep. Your relationship with your local bike shop will be one of the most practical in your new life.',
    icon: 'icon_bike_shop',
    triggers: [
      { type: 'area_visit', areaId: 'bike_shop' },
    ],
    relatedEntries: ['lang_cykel', 'activity_biking'],
    sourceText: 'Learned from: visiting the bicycle shop',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎯 ACTIVITIES (16 entries)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'activity_biking',
    title: 'How to Bike in Copenhagen',
    category: 'activities',
    body: 'Copenhagen has over 390 km of bike lanes. Always signal before turning (left arm out for left, right arm out for right, arm raised to stop). Stay in the bike lane, not the sidewalk. Lights are mandatory after dark — police will fine you. Use hand signals, respect other cyclists, and never stop suddenly in the bike lane.',
    icon: 'icon_biking',
    triggers: [
      { type: 'activity_complete', activityId: 'first_bike_ride' },
    ],
    relatedEntries: ['lang_cykel', 'tips_bike_lights'],
    sourceText: 'Learned from: your first bike ride in Copenhagen',
  },
  {
    id: 'activity_shopping',
    title: 'Grocery Shopping 101',
    category: 'activities',
    body: 'Bring your own bags (pæse cost 3-5 DKK each). Weigh your own produce and stick the label on. Return bottles and cans at the "pant" machine for credit. Organic items are marked "Ø" or "økologisk." Popular chains include Netto (budget), Føtex (mid-range), and Irma (premium). Shopping after 5 PM avoids the after-work rush.',
    icon: 'icon_shopping',
    triggers: [
      { type: 'activity_complete', activityId: 'first_shopping' },
    ],
    relatedEntries: ['lang_supermarket', 'places_grocery_store'],
    sourceText: 'Learned from: navigating a Danish supermarket',
  },
  {
    id: 'activity_metro',
    title: 'Using the Metro',
    category: 'activities',
    body: 'Get a rejsekort (travel card) — single tickets are expensive. Check in when you board and check out when you exit (forgetting either gets you fined). The metro runs on zones — calculate your trip beforehand. Weekend service is 24/7, weekdays until about 1 AM. The Cityringen (M3) loop is the most useful for central Copenhagen.',
    icon: 'icon_metro_guide',
    triggers: [
      { type: 'activity_complete', activityId: 'first_metro_ride' },
    ],
    relatedEntries: ['places_metro', 'tips_save_receipts'],
    sourceText: 'Learned from: riding the Copenhagen metro',
  },
  {
    id: 'activity_bills',
    title: 'Paying Bills in Denmark',
    category: 'activities',
    body: 'Most bills in Denmark can be paid through MobilePay, netbank (online banking), or automatic betalingsservice (direct debit). Payment deadlines are strict — late fees apply quickly. Set up betalingsservice for recurring bills like rent and utilities. Keep your NemKonto (official payout account) registered for any government payouts.',
    icon: 'icon_bills',
    triggers: [
      { type: 'activity_complete', activityId: 'first_bill_payment' },
    ],
    relatedEntries: ['tips_mobilepay', 'activity_bank'],
    sourceText: 'Learned from: paying your first Danish bill',
  },
  {
    id: 'activity_taxes',
    title: 'Filing Danish Taxes',
    category: 'activities',
    body: 'SKAT (now Skattestyrelsen) handles Danish taxes. The system is surprisingly automated — most information is pre-filled in your årsopgørelse (annual tax statement). You just review and approve it. Tax rates are high (around 37-52%), but they fund extensive public services. Key tip: check your "fradrag" (deductions) — commuting and union fees are deductible.',
    icon: 'icon_taxes',
    triggers: [
      { type: 'activity_complete', activityId: 'file_taxes' },
    ],
    relatedEntries: ['culture_welfare', 'activity_cpr'],
    sourceText: 'Learned from: filing your Danish taxes',
  },
  {
    id: 'activity_cpr',
    title: 'Getting Your CPR Number',
    category: 'activities',
    body: 'Your CPR (Central Person Register) number is your key to Danish life. It\'s needed for healthcare, banking, work, and almost everything official. Apply at your local borgerservice with your passport, housing contract, and visa. Processing takes 1-2 weeks. Without a CPR number, you\'re administratively invisible in Denmark.',
    icon: 'icon_cpr',
    triggers: [
      { type: 'activity_complete', activityId: 'cpr_registration' },
    ],
    relatedEntries: ['places_borgerservice', 'activity_nemid'],
    sourceText: 'Learned from: registering for your CPR number',
  },
  {
    id: 'activity_nemid',
    title: 'Setting Up NemID/MitID',
    category: 'activities',
    body: 'MitID (formerly NemID) is your digital identity for everything — banking, taxes, healthcare portals, government services. You\'ll need your CPR number and a visit to borgerservice. Download the MitID app and keep your activation code safe. Without MitID, you can\'t do anything official online — make this a top priority.',
    icon: 'icon_nemid',
    triggers: [
      { type: 'activity_complete', activityId: 'setup_nemid' },
    ],
    relatedEntries: ['activity_cpr', 'activity_bank'],
    sourceText: 'Learned from: setting up your digital identity',
  },
  {
    id: 'activity_friends',
    title: 'Making Danish Friends',
    category: 'activities',
    body: 'Making Danish friends takes patience. Danes are warm but reserved — they already have established social circles from childhood. Join clubs (foreninger), attend language exchanges, or use apps like "Meet Danes." Shared activities work better than just chatting. Once you do break through, Danish friendships are deep and lasting.',
    icon: 'icon_friends',
    triggers: [
      { type: 'skill_milestone', skill: 'cultural', level: 3 },
    ],
    relatedEntries: ['tips_social_invitations', 'tips_join_club'],
    sourceText: 'Learned from: building friendships in Denmark',
  },
  {
    id: 'activity_winter_survival',
    title: 'Surviving Danish Winter',
    category: 'activities',
    body: 'Danish winters are dark, cold, and long — sunrise at 8:30 AM, sunset by 3:30 PM. Take Vitamin D supplements (seriously), invest in a quality rain jacket and thermal layers, and embrace hygge. Light candles, cook warm meals, and maintain social connections. Seasonal affective disorder (vinterdepression) is real — stay active and get outside when the sun appears.',
    icon: 'icon_winter',
    triggers: [
      { type: 'season_change', season: 'winter' },
    ],
    relatedEntries: ['tips_vitamin_d', 'tips_embrace_darkness'],
    sourceText: 'Learned from: your first Danish winter',
  },
  {
    id: 'activity_pant',
    title: 'The Pant System',
    category: 'activities',
    body: 'Pant is Denmark\'s bottle and can deposit system. You pay a small deposit (1-3 DKK) when you buy a drink, and get it back when you return the container to a pant machine at the supermarket. Labels show "Pant A" (1 DKK), "Pant B" (1.50 DKK), or "Pant C" (3 DKK). It\'s an efficient recycling system that\'s become second nature to residents.',
    icon: 'icon_pant',
    triggers: [
      { type: 'item_use', itemId: 'pant_machine' },
    ],
    relatedEntries: ['places_grocery_store', 'tips_grocery_rule'],
    sourceText: 'Learned from: returning bottles at the pant machine',
  },
  {
    id: 'activity_health_system',
    title: 'Navigating the Health System',
    category: 'activities',
    body: 'Register with a GP (praktiserende læge) through sundhed.dk. Your GP is the gateway to all non-emergency care — you can\'t see a specialist without a referral. Call 1813 for urgent but non-emergency issues. For real emergencies, dial 112. Prescriptions are filled at pharmacies (apotek) — bring your sundhedskort (health card).',
    icon: 'icon_health_system',
    triggers: [
      { type: 'activity_complete', activityId: 'first_doctor_visit' },
    ],
    relatedEntries: ['culture_healthcare', 'lang_emergency'],
    sourceText: 'Learned from: your first doctor visit',
  },
  {
    id: 'activity_bank',
    title: 'Finding a Danish Bank',
    category: 'activities',
    body: 'Danish banks (Danske Bank, Nordea, Jyske Bank) require a CPR number and proof of address to open an account. Your main account becomes your NemKonto — where salary, tax refunds, and government payments arrive. Get a Dankort (debit card) for everyday purchases. Most Danes rarely carry cash; MobilePay and Dankort handle everything.',
    icon: 'icon_bank',
    triggers: [
      { type: 'activity_complete', activityId: 'open_bank_account' },
    ],
    relatedEntries: ['activity_cpr', 'tips_mobilepay'],
    sourceText: 'Learned from: setting up your Danish bank account',
  },
  {
    id: 'activity_cooking',
    title: 'Danish Cooking Basics',
    category: 'activities',
    body: 'Start with the essentials: rugbrød (rye bread) with toppings, kartofler (potatoes — a Danish staple), frikadeller (meatballs), and simple soups. Danish supermarkets have excellent pre-made sections too. Cooking at home saves money and lets you experiment with local ingredients. The Danish approach to food is simple, hearty, and focused on quality over complexity.',
    icon: 'icon_cooking',
    triggers: [
      { type: 'activity_complete', activityId: 'cook_danish' },
    ],
    relatedEntries: ['culture_smorrebrod', 'lang_supermarket'],
    sourceText: 'Learned from: cooking your first Danish meal',
  },
  {
    id: 'activity_language_exchange',
    title: 'Language Exchange Tips',
    category: 'activities',
    body: 'Language exchanges are one of the best ways to learn Danish and make friends simultaneously. Libraries host free "sprogcafé" (language café) events. Apps like Tandem match you with Danish speakers learning your language. The key: be consistent, prepare topics in advance, and don\'t be embarrassed about mistakes — Danes respect the effort.',
    icon: 'icon_language_exchange',
    triggers: [
      { type: 'activity_complete', activityId: 'language_class' },
    ],
    relatedEntries: ['tips_learn_words', 'places_library'],
    sourceText: 'Learned from: attending a language exchange',
  },
  {
    id: 'tips_apartment_rules',
    title: 'Apartment Rules & Etiquette',
    category: 'activities',
    body: 'Danish apartment living has unspoken rules: quiet hours (22:00-7:00), shared laundry room schedules, stairway cleaning rotation (trappevask), and recycling sorting. Most buildings have a bestyrelse (board) that enforces rules. Keep common areas tidy, greet your neighbors, and learn the rules early — your reputation in the building matters.',
    icon: 'icon_apartment_rules',
    triggers: [
      { type: 'mistake', mistakeType: 'apartment_rule_violation' },
      { type: 'npc_conversation', npcId: 'lars', conversationId: 'building_rules' },
    ],
    relatedEntries: ['culture_quiet_hours', 'places_apartment'],
    sourceText: 'Learned from: learning about apartment etiquette',
  },
  {
    id: 'activity_job_culture',
    title: 'Job Culture in Denmark',
    category: 'activities',
    body: 'Danish workplaces have flat hierarchies — everyone calls each other by first name, including the CEO. Trust is given, not earned. Meetings are structured and efficient. Overtime is rare and sometimes frowned upon. The key to success: deliver results, be collaborative, and contribute to the team culture. Lunch together is expected, not optional.',
    icon: 'icon_job_culture',
    triggers: [
      { type: 'activity_complete', activityId: 'first_workday' },
    ],
    relatedEntries: ['culture_work_life', 'culture_fredagsbaren'],
    sourceText: 'Learned from: experiencing Danish workplace culture',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 💡 TIPS (12 entries)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tips_bike_lights',
    title: 'Always Check Your Bike Lights',
    category: 'tips',
    body: 'Riding without lights after dark will get you a 700 DKK fine. Front white light, rear red light — no exceptions. Police conduct random checks, especially in autumn and winter when it gets dark by 4 PM. Check your lights before every ride, carry spare batteries, and consider rechargeable USB lights. It\'s not just a rule; it\'s survival.',
    icon: 'icon_bike_lights',
    triggers: [
      { type: 'mistake', mistakeType: 'bike_light_violation' },
    ],
    relatedEntries: ['activity_biking', 'lang_cykel'],
    sourceText: 'Learned from: a lesson about bike safety',
  },
  {
    id: 'tips_layers',
    title: 'Dress in Layers',
    category: 'tips',
    body: 'Danish weather can change dramatically within hours. The solution: layers. A base layer for warmth, a mid-layer for insulation, and a waterproof outer layer for rain and wind. Invest in a quality rain jacket (Danes love Rains brand) and waterproof shoes. "There\'s no bad weather, only bad clothing" is a mantra here — live by it.',
    icon: 'icon_layers',
    triggers: [
      { type: 'encounter', encounterId: 'weather_mistake' },
    ],
    relatedEntries: ['lang_weather', 'activity_winter_survival'],
    sourceText: 'Learned from: an unexpected weather change',
  },
  {
    id: 'tips_vitamin_d',
    title: 'Vitamin D is Not Optional',
    category: 'tips',
    body: 'From October to April, Denmark doesn\'t get enough sunlight for your body to produce adequate Vitamin D. Most Danes take supplements — it\'s not a health fad, it\'s a necessity. D-vitamin drops or tablets are cheap and available at any pharmacy or supermarket. Your mood, energy, and immune system will thank you.',
    icon: 'icon_vitamin_d',
    triggers: [
      { type: 'encounter', encounterId: 'health_warning' },
    ],
    relatedEntries: ['activity_winter_survival', 'tips_embrace_darkness'],
    sourceText: 'Learned from: health advice about Danish winters',
  },
  {
    id: 'tips_save_receipts',
    title: 'Save Your Receipts',
    category: 'tips',
    body: 'Danish stores have clear return policies, but you need receipts. Most returns are accepted within 14-30 days. For tax purposes, keep receipts for work-related expenses, commuting costs, and union dues — these can be claimed as fradrag (deductions). MobilePay transactions have built-in receipts. Create a simple system from day one.',
    icon: 'icon_receipts',
    triggers: [
      { type: 'activity_complete', activityId: 'first_purchase' },
    ],
    relatedEntries: ['activity_taxes', 'tips_mobilepay'],
    sourceText: 'Learned from: shopping experience in Denmark',
  },
  {
    id: 'tips_learn_words',
    title: 'Learn 5 Danish Words a Day',
    category: 'tips',
    body: 'Consistency beats intensity. Learning just 5 words a day gives you 150 words a month and over 1,800 in a year — more than enough for basic conversation. Use flashcards, language apps, or sticky notes around your apartment. Focus on words you actually encounter: signs, menus, work emails. Real-world context makes vocabulary stick.',
    icon: 'icon_learn_words',
    triggers: [
      { type: 'skill_milestone', skill: 'language', level: 2 },
    ],
    relatedEntries: ['activity_language_exchange', 'lang_hej'],
    sourceText: 'Learned from: language learning progress',
  },
  {
    id: 'tips_punctuality',
    title: "Don't Be Late",
    category: 'tips',
    body: 'Danes are punctual. If a meeting is at 10:00, you should be there at 9:55. Social events have slightly more flexibility, but showing up more than 10-15 minutes late without texting is considered rude. Train schedules, doctor appointments, and work meetings all run on time. Danish punctuality isn\'t strict — it\'s respectful.',
    icon: 'icon_punctuality',
    triggers: [
      { type: 'mistake', mistakeType: 'late_arrival' },
    ],
    relatedEntries: ['culture_directness', 'activity_job_culture'],
    sourceText: 'Learned from: the consequences of being late',
  },
  {
    id: 'tips_embrace_darkness',
    title: 'Embrace the Darkness',
    category: 'tips',
    body: 'November through February brings very short days — sometimes only 7 hours of daylight. Fighting it is futile; embracing it is Danish. Light candles (Danes burn the most candles per capita in the world), make your home hyggelig, and find beauty in the moody Nordic atmosphere. The Danish approach: if you can\'t beat darkness, make it cozy.',
    icon: 'icon_darkness',
    triggers: [
      { type: 'season_change', season: 'winter' },
    ],
    relatedEntries: ['tips_vitamin_d', 'culture_hygge'],
    sourceText: 'Learned from: experiencing Danish winter darkness',
  },
  {
    id: 'tips_mobilepay',
    title: 'MobilePay is King',
    category: 'tips',
    body: 'MobilePay is Denmark\'s universal mobile payment app. Use it to pay friends, split bills, pay at shops, donate to charities, and even buy from market stalls. Denmark is one of the world\'s most cashless societies — many places don\'t even accept cash anymore. Get MobilePay set up immediately; it\'s as essential as your CPR number.',
    icon: 'icon_mobilepay',
    triggers: [
      { type: 'activity_complete', activityId: 'first_payment' },
    ],
    relatedEntries: ['activity_bank', 'activity_bills'],
    sourceText: 'Learned from: discovering cashless Denmark',
  },
  {
    id: 'tips_grocery_rule',
    title: 'The 80/20 Grocery Rule',
    category: 'tips',
    body: 'Budget-savvy Danes follow the 80/20 rule: spend 80% of your grocery budget on staples (bread, milk, vegetables, rice, pasta) and 20% on treats and fresh items. Shopping at Netto or Rema 1000 saves significantly compared to Irma or Føtex. Check weekly tilbudsaviser (offer flyers) for deals, and buy seasonal produce for the best value.',
    icon: 'icon_grocery_rule',
    triggers: [
      { type: 'skill_milestone', skill: 'bureaucracy', level: 2 },
    ],
    relatedEntries: ['activity_shopping', 'places_grocery_store'],
    sourceText: 'Learned from: mastering budget shopping',
  },
  {
    id: 'tips_social_invitations',
    title: 'Say Yes to Social Invitations',
    category: 'tips',
    body: 'When a Dane invites you somewhere, go. Social invitations are precious and not given lightly. Danish social life revolves around planned activities — spontaneous hanging out is less common. Saying no repeatedly means invitations will dry up. Even if you\'re tired, even if it\'s raining — show up. It\'s how you build your social circle.',
    icon: 'icon_social',
    triggers: [
      { type: 'npc_conversation', npcId: 'freja', conversationId: 'social_advice' },
    ],
    relatedEntries: ['activity_friends', 'tips_join_club'],
    sourceText: 'Learned from: social advice from a Danish friend',
  },
  {
    id: 'tips_join_club',
    title: 'Join a Club or Forening',
    category: 'tips',
    body: 'Denmark runs on foreninger (clubs/associations). There are clubs for everything: sports, board games, cooking, hiking, singing, knitting, debate, even beer tasting. Joining one is the single best way to meet Danes outside of work. Dues are usually modest (200-500 DKK/season), and the social return on investment is enormous.',
    icon: 'icon_club',
    triggers: [
      { type: 'npc_conversation', npcId: 'lars', conversationId: 'club_suggestion' },
    ],
    relatedEntries: ['activity_friends', 'tips_social_invitations'],
    sourceText: 'Learned from: a suggestion to join Danish clubs',
  },
  {
    id: 'tips_weather_complain',
    title: 'Complain About the Weather',
    category: 'tips',
    body: 'The universal Danish conversation starter? Complaining about the weather. "Sikke et vejr!" (What weather!) works in any season. It\'s not negativity — it\'s social bonding. Weather complaints are the Danish equivalent of small talk, and mastering the art of a good weather grumble puts you squarely in the cultural mainstream. Embrace the drizzle chatter.',
    icon: 'icon_weather_complain',
    triggers: [
      { type: 'skill_milestone', skill: 'cultural', level: 4 },
    ],
    relatedEntries: ['lang_weather', 'tips_layers'],
    sourceText: 'Learned from: reaching a relationship milestone',
  },
];

/**
 * Get all entries for a specific category.
 * @param {string} category - Category name.
 * @returns {Array} Entries in that category.
 */
export function getEntriesByCategory(category) {
  return ENCYCLOPEDIA_DATA.filter(e => e.category === category);
}

/**
 * Get an entry by its ID.
 * @param {string} id - Entry ID.
 * @returns {object|undefined} The entry, or undefined if not found.
 */
export function getEntryById(id) {
  return ENCYCLOPEDIA_DATA.find(e => e.id === id);
}

/**
 * Get all entry IDs.
 * @returns {string[]} Array of all entry IDs.
 */
export function getAllEntryIds() {
  return ENCYCLOPEDIA_DATA.map(e => e.id);
}

/**
 * Get the total count of entries per category.
 * @returns {Object<string, number>} Map of category → entry count.
 */
export function getCategoryCounts() {
  const counts = {};
  for (const cat of CATEGORIES) {
    counts[cat] = 0;
  }
  for (const entry of ENCYCLOPEDIA_DATA) {
    counts[entry.category]++;
  }
  return counts;
}
