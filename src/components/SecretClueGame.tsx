import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { GameUser } from '../lib/auth';
import { GameModal, GameWoodButton } from './GameModal';

export type GameRole = 'guesser' | 'giver';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SecretClueItem {
  id: string;
  word: string;
  category: string;
  clues: [string, string, string, string];
  funFact?: string;
}

interface Props {
  onBack: () => void;
  user?: GameUser | null;
}

// 30 Curated Words with 4 Factual, Indirect, Clever Clues each
const CLUE_DATABASE: SecretClueItem[] = [
  {
    id: 'w-1',
    word: 'MATCH',
    category: 'Connection',
    clues: [
      'A mutual spark ignited between two profiles on a digital dating network.',
      'A slender wooden splint tipped with sulfur struck against red phosphorus.',
      'A competitive athletic fixture contested between two determined rivals.',
      'Two corresponding items sharing identical symmetry, color, or design.',
    ],
    funFact: 'Matches were accidentally invented by John Walker in 1826 while scraping a chemical stick.',
  },
  {
    id: 'w-2',
    word: 'CHEMISTRY',
    category: 'Science & Soul',
    clues: [
      'An unvoiced magnetic electricity felt across a quiet candlelit table.',
      'The empirical physical science studying atoms, molecular bonds, and reactions.',
      'The intricate neurological surge of dopamine, serotonin, and oxytocin.',
      'The seamless subconscious synchrony that unites a championship sports squad.',
    ],
    funFact: 'The chemical phenylethylamine triggers the unmistakable feeling of instant chemistry.',
  },
  {
    id: 'w-3',
    word: 'PASSPORT',
    category: 'Voyage',
    clues: [
      'A gilded booklet essential to cross beyond sovereign national borders.',
      'Fitted with biometric microchips, visa watermark leaves, and consular seals.',
      'Derived from medieval harbor documents granting safe passage through port gates.',
      'Renewed every decade, bearing your unsmiling neutral portrait.',
    ],
    funFact: 'King Henry V of England is credited with inventing the earliest recorded safe-conduct passport.',
  },
  {
    id: 'w-4',
    word: 'AURORA',
    category: 'Cosmos',
    clues: [
      'Fluorescent ribbons of emerald and violet undulating through polar night skies.',
      'Solar wind ions colliding with oxygen and nitrogen in the upper atmosphere.',
      'Named after the ancient Roman goddess who personified the rising dawn.',
      'Witnessed clearest near geomagnetic poles during high solar flare activity.',
    ],
    funFact: 'Oxygen emits the iconic vibrant green glow at altitudes between 60 and 150 miles.',
  },
  {
    id: 'w-5',
    word: 'COFFEE',
    category: 'Culinary',
    clues: [
      'A dark aromatic brew credited with energizing modern thinkers and dawn meetings.',
      'Legend attributes its discovery to an Ethiopian goat herder named Kaldi.',
      'Extracted under nine bars of espresso pressure or slow-dripped through paper filters.',
      'The world second most traded agricultural export alongside crude oil and tea.',
    ],
    funFact: 'Over 2.25 billion cups of coffee are consumed globally every single day.',
  },
  {
    id: 'w-6',
    word: 'COMPASS',
    category: 'Navigation',
    clues: [
      'A magnetized needle balancing delicately upon a central brass pivot.',
      'Guides navigators toward geomagnetic polar pull rather than true geographic north.',
      'First invented during China Han dynasty as an early geomantic divining tool.',
      'Encircled by thirty-two traditional points radiating upon a mariner windrose.',
    ],
    funFact: 'Earth magnetic north shifts approximately 30 miles every year toward Siberia.',
  },
  {
    id: 'w-7',
    word: 'ORCHESTRA',
    category: 'Music',
    clues: [
      'Eighty acoustic instruments breathing as one under a single silent baton.',
      'Partitioned into strings, woodwinds, brass, and thunderous percussion.',
      'Derived from the ancient Athenian circular stage area reserved for choruses.',
      'Tunes harmoniously to the principal oboe pitch at 440 vibrations per second.',
    ],
    funFact: 'The modern symphony orchestra evolved into its standardized four-section form in the 1700s.',
  },
  {
    id: 'w-8',
    word: 'MOONLIGHT',
    category: 'Cosmos',
    clues: [
      'Reflected solar rays mirrored across nearly a quarter-million miles of space.',
      'Bounces softly off cratered basalt maria and powdery lunar regolith.',
      'Guides nocturnal hatchlings toward safety along open oceanic surf.',
      'Controls the cyclic rhythm of ocean tides via gravitational tidal force.',
    ],
    funFact: 'The moon surface reflects only about 12% of the sunlight striking it.',
  },
  {
    id: 'w-9',
    word: 'DIAMOND',
    category: 'Geology',
    clues: [
      'Pure elemental carbon crystalline forged under immense mantle compression.',
      'Occupies the peak rating of ten on Friedrich Mohs mineral hardness scale.',
      'Customarily set into bridal bands since Archduke Maximilian of Austria in 1477.',
      'Cut into fifty-seven precision facets to maximize refractive internal sparkle.',
    ],
    funFact: 'Most natural diamonds were formed between one and three billion years ago.',
  },
  {
    id: 'w-10',
    word: 'WHISPER',
    category: 'Communication',
    clues: [
      'An unvoiced speech acoustic produced without vibration of the vocal folds.',
      'The quiet intimate medium of pillow talk, palace conspiracies, and study halls.',
      'Registers consistently below thirty decibels on sound level meters.',
      'Formed solely by turbulent airflow slipping softly past parted lips and tongue.',
    ],
    funFact: 'Whispering actually expends more vocal effort and air volume than normal speech.',
  },
  {
    id: 'w-11',
    word: 'ARCHIVE',
    category: 'History',
    clues: [
      'A climate-controlled chamber safeguarding centuries of parchment memories.',
      'Derived from ancient Athenian public records kept in the magistrate house.',
      'Protects historical treaties, original patent blue-prints, and film negatives.',
      'Digital vaults preserving deprecated source code and historical git repositories.',
    ],
    funFact: 'The Vatican Secret Archives contain 53 linear miles of historical shelving.',
  },
  {
    id: 'w-12',
    word: 'ANCHOR',
    category: 'Maritime',
    clues: [
      'A forged iron hook gripping the seabed to tether vessels against storm surges.',
      'Emblazoned on naval tattoos as a universal symbol of steadfast hope.',
      'Connected to massive cast-steel stud links rattling through the hawsepipe.',
      'The veteran journalist who grounds and stabilizes a prime-time news broadcast.',
    ],
    funFact: 'An anchor on a ship can weigh upwards of 30 tons on modern aircraft carriers.',
  },
  {
    id: 'w-13',
    word: 'ECLIPSE',
    category: 'Sky',
    clues: [
      'A celestial alignment casting an umbral shadow across the daytime world.',
      'Temporarily unveils the sun ghostly solar corona to terrestrial observers.',
      'Ancient warring armies laid down arms in terror when day turned suddenly to dusk.',
      'Can manifest as total, annular ring of fire, or blood-tinted lunar darkness.',
    ],
    funFact: 'The next total solar eclipse visible from mainland Europe will occur in 2026.',
  },
  {
    id: 'w-14',
    word: 'TREASURE',
    category: 'Adventure',
    clues: [
      'Marked by an enigmatic X upon faded parchment nautical charts.',
      'Concealed within iron-strapped oak chests buried deep beneath coastal dunes.',
      'Salvaged from sunken seventeenth-century Spanish galleons by deep-sea probes.',
      'Metaphorically, anything profoundly cherished, valued, and fiercely safeguarded.',
    ],
    funFact: 'Over three million shipwrecks with lost cargo lie scattered on ocean floors.',
  },
  {
    id: 'w-15',
    word: 'LANTERN',
    category: 'Illumination',
    clues: [
      'A protective enclosure sheltering a living flame or filament from howling wind.',
      'Used by Paul Revere compatriots to signal troop movements from the Old North steeple.',
      'Crafted from pierced tinplate, stained glass panels, or oiled rice paper.',
      'Lifted by the thousands into autumn midnight skies during eastern lantern festivals.',
    ],
    funFact: 'Paper lanterns were initially deployed in the 3rd century BCE as military signals.',
  },
  {
    id: 'w-16',
    word: 'MIRAGE',
    category: 'Atmosphere',
    clues: [
      'An optical illusion of shimmering water glistening over sunbaked pavement.',
      'Caused by thermal atmospheric refraction bending light across heated ground.',
      'Frequently deceived weary desert caravans into chasing non-existent pools.',
      'Can project maritime ghost ships floating upside down above ocean horizons.',
    ],
    funFact: 'The complex superior mirage called Fata Morgana can make coastlines appear as castles.',
  },
  {
    id: 'w-17',
    word: 'SYMPHONY',
    category: 'Sound',
    clues: [
      'An extended four-movement sonata composition for full concert orchestra.',
      'Beethoven penned his immortal choral ninth while entirely devoid of hearing.',
      'Traces its etymology to ancient Greek syn (together) and phone (voice).',
      'Begins with sonata allegro, wanders into adagio, and climaxes in a stirring coda.',
    ],
    funFact: 'Joseph Haydn is known as the Father of the Symphony, having composed 106 of them.',
  },
  {
    id: 'w-18',
    word: 'TELESCOPE',
    category: 'Discovery',
    clues: [
      'Trained toward Jupiter in 1610 to reveal four previously unseen planetary moons.',
      'Utilizes curved objective glass lenses or parabolic mirrors to collect photons.',
      'Equipped aboard James Webb and Hubble to capture primordial cosmic nebulae.',
      'Allows astronomers on Earth to peer billions of light-years into the universe dawn.',
    ],
    funFact: 'The James Webb Space Telescope primary mirror is coated in pure vaporized gold.',
  },
  {
    id: 'w-19',
    word: 'AVALANCHE',
    category: 'Alpine',
    clues: [
      'A torrential sweep of packed snow and ice plunging down mountain couloirs.',
      'Can accelerate past eighty miles per hour, generating an immense blast of wind.',
      'Triggered by temperature shifts, structural snowpack weakness, or stray vibrations.',
      'Figuratively denotes an uncontrollable avalanche of incoming demands.',
    ],
    funFact: 'Over 90% of avalanche victims trigger the slide themselves.',
  },
  {
    id: 'w-20',
    word: 'CANDLE',
    category: 'Warmth',
    clues: [
      'A braided cotton wick embedded within beeswax, paraffin, or scented soy.',
      'Puffed out on celebratory birthday cakes following a secret silent wish.',
      'Hand-dipped for centuries by traditional European monasteries and chandlers.',
      'Pools into soothing liquid wax while illuminating romantic evening tables.',
    ],
    funFact: 'Ancient Romans made early candles by dipping rolled papyrus into melted tallow.',
  },
  {
    id: 'w-21',
    word: 'HORIZON',
    category: 'Vista',
    clues: [
      'The illusory line where the curvature of the earth appears to meet the open sky.',
      'Constantly retreats into the far distance as an observer advances forward.',
      'Roughly three miles away for a person standing upright at sea level.',
      'In gravitational astrophysics, marks the boundary beyond which light cannot return.',
    ],
    funFact: 'At 35,000 feet on an airplane, the visual horizon extends over 220 miles away.',
  },
  {
    id: 'w-22',
    word: 'ORIGAMI',
    category: 'Artistry',
    clues: [
      'The historic Japanese art of transforming flat squares of paper into paper cranes.',
      'Adheres to strict discipline utilizing geometric creases without scissors or glue.',
      'Practiced since the Edo era as ceremonial art and mindful spatial focus.',
      'Inspires mechanical folding of spacecraft solar arrays and medical heart stents.',
    ],
    funFact: 'Senbazuru is the ancient Japanese legend that folding 1,000 cranes grants a wish.',
  },
  {
    id: 'w-23',
    word: 'VOLCANO',
    category: 'Geology',
    clues: [
      'A breach in the lithosphere expelling molten magma, sulfur, and volcanic ash.',
      'Forged the Hawaiian archipelago as the Pacific tectonic plate drifted over a hotspot.',
      'Named for the ancient Roman patron god of blacksmithing and fiery forge.',
      'Capable of lying dormant for thousands of years before sudden cataclysmic fury.',
    ],
    funFact: 'Olympus Mons on Mars is the largest known volcano in the entire solar system.',
  },
  {
    id: 'w-24',
    word: 'BALLOON',
    category: 'Aviation',
    clues: [
      'The Montgolfier brothers took flight across the Parisian sky inside one in 1783.',
      'Relies on lighter-than-air hot gas or buoyant helium to achieve passive lift.',
      'Twisted into miniature colorful animals by buskers at children street fairs.',
      'Ascends into the stratosphere carrying radiosondes for meteorological forecasts.',
    ],
    funFact: 'Rubber toy balloons were invented in 1824 by scientist Michael Faraday.',
  },
  {
    id: 'w-25',
    word: 'MAZE',
    category: 'Mystery',
    clues: [
      'A bewildering labyrinth of intersecting hedges engineered to confound explorers.',
      'Navigated in ancient mythology by Theseus holding Ariadne spool of golden thread.',
      'A cherished garden feature of British royal palaces and Renaissance estates.',
      'Guaranteed to be solved eventually by keeping your right hand against a continuous wall.',
    ],
    funFact: 'The Hampton Court hedge maze in London has puzzled visitors since 1700.',
  },
  {
    id: 'w-26',
    word: 'ISLAND',
    category: 'Geography',
    clues: [
      'A sovereign landmass isolated by ocean waters, smaller than a continental shelf.',
      'Greenland claims the geographic crown as the largest non-continental one on Earth.',
      'Encourages unique evolutionary paths like the giant tortoises of the Galapagos.',
      'Famously reflected upon by poet John Donne: No man is an ... entire of itself.',
    ],
    funFact: 'Sweden has over 267,000 islands, more than any other nation on Earth.',
  },
  {
    id: 'w-27',
    word: 'SHADOW',
    category: 'Optics',
    clues: [
      'A dark silhouette projected when an opaque body obstructs incoming light rays.',
      'Elongates dramatically during sunset golden hour and dwindles to nothing at high noon.',
      'Peter Pan lost his in the nursery until Wendy Darling sewed it back onto his foot.',
      'Ancient gnomons and sundials marked the hour solely by its rotating angle.',
    ],
    funFact: 'Umbra is the darkest core of a shadow, while penumbra is the lighter outer fringe.',
  },
  {
    id: 'w-28',
    word: 'KEY',
    category: 'Security',
    clues: [
      'A notched piece of brass machined to lift lock tumblers into shear alignment.',
      'Presented ceremonially in gilded form to grant honorary freedom of a city.',
      'In cryptography, a cryptographic cipher string unlocking encrypted data.',
      'In music theory, the foundational tonal scale centered on a tonic note.',
    ],
    funFact: 'The earliest known pin-tumbler locks date back 4,000 years to ancient Khorsabad.',
  },
  {
    id: 'w-29',
    word: 'CLOCK',
    category: 'Time',
    clues: [
      'Maintains a constant escapement frequency dividing continuous time into seconds.',
      'Big Ben in Westminster Palace is among the world most iconic mechanical variants.',
      'Modern atomic standards measure time by cesium atom microwave transitions.',
      'Chimes hourly bells from village church steeples across historical towns.',
    ],
    funFact: 'The word clock derives from the medieval Latin clocca, meaning bell.',
  },
  {
    id: 'w-30',
    word: 'MIRROR',
    category: 'Reflection',
    clues: [
      'A sheet of annealed float glass backed with a micro-thin layer of silver or aluminum.',
      'In mythology, Narcissus became hopelessly enchanted by his reflection in a pond.',
      'Reverses optical left and right while faithfully preserving spatial depth.',
      'Central to folklore warning against seven years of misfortune if fractured.',
    ],
    funFact: 'Modern silvered-glass mirrors were invented in 1835 by German chemist Justus von Liebig.',
  },
];

// Audio FX synthesizer for tactile, non-blocking feedback
class ClueSoundFx {
  private ctx: AudioContext | null = null;
  public enabled = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ally_clue_sound');
      if (saved !== null) this.enabled = saved === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playKey() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(560 + Math.random() * 40, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch { }
  }

  playClueReveal() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [659.25, 880, 1174.66]; // E5, A5, D6
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = this.ctx!.currentTime + i * 0.05;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch { }
  }

  playCorrect() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = this.ctx!.currentTime + i * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.38);
      });
    } catch { }
  }

  playWrong() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [220, 196]; // A3, G3
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = this.ctx!.currentTime + i * 0.1;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.06, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.22);
      });
    } catch { }
  }

  playTimeout() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [440, 392, 349.23, 293.66]; // A4, G4, F4, D4
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = this.ctx!.currentTime + i * 0.12;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.07, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.26);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.28);
      });
    } catch { }
  }

  playTick() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch { }
  }
}

const sfx = new ClueSoundFx();

export function SecretClueGame({ onBack }: Props) {
  // Current Role: Guesser (user guesses, CPU gives clue) vs Giver (user gives clue, CPU guesses)
  const [role, setRole] = useState<GameRole>('guesser');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [soundOn, setSoundOn] = useState(() => sfx.enabled);
  const [showSettings, setShowSettings] = useState(false);

  // Stats
  const [score, setScore] = useState(() => {
    return parseInt(localStorage.getItem('ally_clue_v2_score') || '0', 10);
  });
  const [streak, setStreak] = useState(0);

  // Deck of words & index
  const [deck, setDeck] = useState<SecretClueItem[]>(() => {
    return [...CLUE_DATABASE].sort(() => Math.random() - 0.5);
  });
  const [currentIdx, setCurrentIdx] = useState(0);

  const currentItem = useMemo(() => {
    return deck[currentIdx % deck.length] || CLUE_DATABASE[0];
  }, [deck, currentIdx]);

  const targetWord = useMemo(() => {
    return currentItem.word.toUpperCase().replace(/[^A-Z]/g, '');
  }, [currentItem]);

  // Which of the 4 clues are currently revealed (array of indices 0..3)
  const [revealedClueIndices, setRevealedClueIndices] = useState<number[]>([0]);

  // 60-second Turn Timer
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Guesser Input State
  const [guessInput, setGuessInput] = useState('');
  const [isInputShaking, setIsInputShaking] = useState(false);
  const [inputFeedback, setInputFeedback] = useState<string | null>(null);

  // Round Resolution
  const [roundStatus, setRoundStatus] = useState<'playing' | 'solved' | 'timeout'>('playing');
  const [pointsAwarded, setPointsAwarded] = useState<number>(0);
  const [pointsBreakdown, setPointsBreakdown] = useState<{ base: number; time: number; clueBonus: number } | null>(null);

  // Clue Picker Modal (Active when Clue Giver needs to select from remaining clues)
  const [showCluePicker, setShowCluePicker] = useState(false);
  const [cpuStatusMsg, setCpuStatusMsg] = useState<string>('');

  // Guesser waiting state when a clue is requested
  const [isWaitingForClue, setIsWaitingForClue] = useState(false);
  const clueRequestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Round Intro Popup: Shows SECRET WORD dialog for 2s before proceeding to gameplay
  const [showRoundIntro, setShowRoundIntro] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  // Handler to proceed from Secret Word dialog to gameplay
  const handleProceedToGameplay = useCallback(() => {
    setShowRoundIntro(false);
    sfx.playKey();
    if (role === 'guesser') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [role]);

  // System-defined 2-second timeout on the secret word dialog before proceeding to gameplay
  useEffect(() => {
    if (!showRoundIntro) return;

    const timer = setTimeout(() => {
      handleProceedToGameplay();
    }, 2000);

    return () => clearTimeout(timer);
  }, [showRoundIntro, handleProceedToGameplay]);

  // Optional: Enter or Space to skip early if player is ready immediately
  useEffect(() => {
    if (!showRoundIntro) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleProceedToGameplay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showRoundIntro, handleProceedToGameplay]);

  // Remaining available clues for Clue Giver (already-given clues are completely filtered out)
  const availableClueOptions = useMemo(() => {
    return currentItem.clues
      .map((clueText, idx) => ({ clueText, idx }))
      .filter(({ idx }) => !revealedClueIndices.includes(idx));
  }, [currentItem, revealedClueIndices]);

  // Clean up any pending clue request timeouts on unmount
  useEffect(() => {
    return () => {
      if (clueRequestTimeoutRef.current) clearTimeout(clueRequestTimeoutRef.current);
    };
  }, []);

  // Sound toggle
  const toggleSound = () => {
    const next = !soundOn;
    sfx.enabled = next;
    setSoundOn(next);
    localStorage.setItem('ally_clue_sound', String(next));
  };

  // Switch Turn handler
  const switchTurn = useCallback((newRole?: GameRole) => {
    if (clueRequestTimeoutRef.current) clearTimeout(clueRequestTimeoutRef.current);
    setIsWaitingForClue(false);
    const nextRole = newRole ?? (role === 'guesser' ? 'giver' : 'guesser');
    setRole(nextRole);
    setCurrentIdx((prev) => prev + 1);
    setRevealedClueIndices([0]);
    setGuessInput('');
    setInputFeedback(null);
    setRoundStatus('playing');
    setPointsAwarded(0);
    setPointsBreakdown(null);
    setTimeLeft(60);
    setIsTimerRunning(true);
    setShowCluePicker(false);
    setShowRoundIntro(true);

    if (nextRole === 'giver') {
      setCpuStatusMsg('CPU Detective is reviewing Clue #1 and formulating deductions...');
    } else {
      setCpuStatusMsg('');
    }
  }, [role]);

  // Restart whole game
  const handleRestartGame = () => {
    if (clueRequestTimeoutRef.current) clearTimeout(clueRequestTimeoutRef.current);
    setIsWaitingForClue(false);
    setDeck([...CLUE_DATABASE].sort(() => Math.random() - 0.5));
    setCurrentIdx(0);
    setRole('guesser');
    setRevealedClueIndices([0]);
    setGuessInput('');
    setInputFeedback(null);
    setRoundStatus('playing');
    setPointsAwarded(0);
    setPointsBreakdown(null);
    setTimeLeft(60);
    setIsTimerRunning(true);
    setShowCluePicker(false);
    setShowRoundIntro(true);
  };

  // Turn Timeout handler (1 minute passed without guess)
  const handleTimeExpired = useCallback(() => {
    setIsTimerRunning(false);
    setRoundStatus('timeout');
    sfx.playTimeout();
    setStreak(0);

    // If User was Giver and CPU timed out, User gets a stump bonus!
    if (role === 'giver') {
      const stumpBonus = 50;
      setPointsAwarded(stumpBonus);
      setPointsBreakdown({ base: 0, time: 0, clueBonus: stumpBonus });
      setScore((s) => {
        const next = s + stumpBonus;
        localStorage.setItem('ally_clue_v2_score', String(next));
        return next;
      });
    }

    // Automatically transition to next turn -> popups the secret word dialog!
    const switchTimer = setTimeout(() => {
      switchTurn();
    }, 1600);

    return () => clearTimeout(switchTimer);
  }, [role, switchTurn]);

  // 1-minute countdown timer logic (pauses while showRoundIntro is open)
  useEffect(() => {
    if (!isTimerRunning || roundStatus !== 'playing' || showRoundIntro) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeExpired();
          return 0;
        }
        if (prev <= 6) {
          sfx.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, roundStatus, showRoundIntro, handleTimeExpired]);

  // Handle User Guess (when user is Guesser)
  const handleUserGuessSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (roundStatus !== 'playing' || !guessInput.trim()) return;

    sfx.playKey();
    const cleanGuess = guessInput.trim().toUpperCase().replace(/[^A-Z]/g, '');

    if (cleanGuess === targetWord) {
      // WORD GUESSED! Calculate revised winning points!
      setIsTimerRunning(false);
      setRoundStatus('solved');
      sfx.playCorrect();

      // Points formula: Base 100 + 1 pt per second remaining + Clue efficiency bonus
      const base = 100;
      const timeBonus = Math.max(0, timeLeft);
      const cluesCount = revealedClueIndices.length;
      const clueBonus = cluesCount === 1 ? 60 : cluesCount === 2 ? 40 : cluesCount === 3 ? 20 : 10;
      const totalTurnPoints = base + timeBonus + clueBonus;

      setPointsAwarded(totalTurnPoints);
      setPointsBreakdown({ base, time: timeBonus, clueBonus });

      setScore((s) => {
        const next = s + totalTurnPoints;
        localStorage.setItem('ally_clue_v2_score', String(next));
        return next;
      });
      setStreak((st) => st + 1);

      // Auto transition to next turn -> popups the secret word dialog!
      setTimeout(() => {
        switchTurn('giver');
      }, 1600);
    } else {
      // Wrong guess
      sfx.playWrong();
      setIsInputShaking(true);
      setInputFeedback(`"${cleanGuess}" is incorrect!`);
      setTimeout(() => {
        setIsInputShaking(false);
        setInputFeedback(null);
      }, 1000);
      setGuessInput('');
    }
  };

  // "Request Clue" clicked
  // - Guesser does NOT pick the clue; the Clue Giver picks it.
  // - Clue does NOT reveal immediately on guesser side; guesser must wait for clue giver.
  const handleRequestClue = () => {
    if (revealedClueIndices.length >= 4 || roundStatus !== 'playing' || isWaitingForClue) return;

    setIsWaitingForClue(true);
    setInputFeedback(null);
    sfx.playKey();

    const unrevealed = [0, 1, 2, 3].filter((idx) => !revealedClueIndices.includes(idx));
    if (unrevealed.length === 0) {
      setIsWaitingForClue(false);
      return;
    }

    // Simulate Clue Giver reviewing options and selecting a clue to send (1.6s - 2.2s delay)
    const delay = 1600 + Math.random() * 600;
    if (clueRequestTimeoutRef.current) clearTimeout(clueRequestTimeoutRef.current);

    clueRequestTimeoutRef.current = setTimeout(() => {
      const chosenIdx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      setRevealedClueIndices((prev) => [...prev, chosenIdx]);
      setIsWaitingForClue(false);
      sfx.playClueReveal();
    }, delay);
  };

  // Clue Giver selects a clue from the remaining options
  const handleSelectClueToSend = (clueIdx: number) => {
    if (revealedClueIndices.includes(clueIdx)) return;

    sfx.playClueReveal();
    setRevealedClueIndices((prev) => [...prev, clueIdx]);
    setShowCluePicker(false);
    if (role === 'giver') {
      setCpuStatusMsg('New clue sent! CPU Detective is reviewing the clue...');
    }
  };

  // CPU Detective Simulation (when User is Clue Giver)
  useEffect(() => {
    if (role !== 'giver' || roundStatus !== 'playing' || revealedClueIndices.length === 0 || showRoundIntro) return;

    // CPU behavior timer based on difficulty
    const thinkDelay = difficulty === 'hard' ? 9000 : difficulty === 'medium' ? 14000 : 20000;

    const cpuTimer = setTimeout(() => {
      // If fewer than 3 clues are revealed, CPU frequently requests another clue!
      if (revealedClueIndices.length < 3 && Math.random() < 0.7) {
        setCpuStatusMsg('CPU Detective requested an additional clue!');
        setShowCluePicker(true);
        sfx.playClueReveal();
        return;
      }

      // Chance to solve based on clues revealed & difficulty
      const solveChance =
        revealedClueIndices.length * (difficulty === 'hard' ? 0.35 : difficulty === 'medium' ? 0.25 : 0.15);

      if (Math.random() < solveChance) {
        // CPU Solved it!
        setIsTimerRunning(false);
        setRoundStatus('solved');
        sfx.playCorrect();
        setCpuStatusMsg(`CPU Detective cracked the secret word "${targetWord}"!`);

        setTimeout(() => {
          switchTurn('guesser');
        }, 3200);
      } else {
        // CPU made an incorrect guess
        const wrongGuesses = ['COMPASS', 'SHADOW', 'ORCHESTRA', 'DIAMOND', 'PASSPORT', 'LANTERN'].filter(
          (w) => w !== targetWord
        );
        const randomWrong = wrongGuesses[Math.floor(Math.random() * wrongGuesses.length)];
        setCpuStatusMsg(`CPU Detective guessed "${randomWrong}" - Not correct! Still investigating...`);
        sfx.playWrong();
      }
    }, thinkDelay);

    return () => clearTimeout(cpuTimer);
  }, [role, roundStatus, revealedClueIndices, difficulty, targetWord, switchTurn, showRoundIntro]);

  return (
    <>
      {/* ═══ Immersive Background Layer (Fixed full bleed) ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070d14]" aria-hidden="true">
        <img
          src="/roadmap-bg-landscape.png"
          alt=""
          className="w-full h-full object-cover object-top filter brightness-[0.8] contrast-[1.12] saturate-[1.12]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060c14]/60 via-[#070d16]/75 to-[#04070c]/90" />
      </div>

      {/* ═══ Fixed 100dvh Floating Game Scene (Zero Scroll, Touch-Locked) ═══ */}
      <div className="relative z-10 w-full max-w-[480px] h-[100dvh] max-h-[100dvh] mx-auto py-2 sm:py-3 px-3.5 flex flex-col items-center justify-between overflow-hidden select-none touch-none overscroll-none">

        {/* TOP ROW: Back button on left, Restart & Settings on right */}
        <div className="w-full flex items-center justify-between mb-1 px-1 flex-shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/95 hover:text-white font-bold text-sm transition-all duration-150 active:scale-95 group drop-shadow-[0_2px_5px_rgba(0,0,0,0.65)] cursor-pointer"
            aria-label="Back to Games"
          >
            <svg
              className="w-5 h-5 text-white transition-transform group-hover:-translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="tracking-wide">Back to Games</span>
          </button>

          {/* Action Buttons: Stone Restart & Settings Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestartGame}
              className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-100 cursor-pointer"
              title="Restart game"
              aria-label="Restart game"
            >
              <img
                src="/ui-button.png"
                alt=""
                className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                draggable={false}
              />
              <svg
                className="relative z-10 w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#4a3219] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.8}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-100 cursor-pointer"
              title="Settings"
              aria-label="Settings"
            >
              <img
                src="/ui-button.png"
                alt=""
                className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                draggable={false}
              />
              <svg
                className="relative z-10 w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#4a3219] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.4}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* STATS PODS: SCORE / TIMER / ROLE (Reusing /ui-pod.png) */}
        <div className="w-full max-w-[430px] grid grid-cols-3 gap-2 px-1 mb-1.5 flex-shrink-0 select-none">
          {/* Left: SCORE Pod */}
          <div className="relative aspect-[1.56/1] flex flex-col items-center justify-center p-1.5">
            <img
              src="/ui-pod.png"
              alt=""
              className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
              draggable={false}
            />
            <span className="relative z-10 text-[9px] font-black uppercase tracking-wider text-[#6a4c28] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              {streak > 0 ? `SCORE 🔥${streak}` : 'SCORE'}
            </span>
            <span className="relative z-10 text-base sm:text-lg font-black font-display text-[#382613] leading-none mt-0.5 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              {score}
            </span>
          </div>

          {/* Center: 60s TIMER Pod */}
          <div className="relative aspect-[1.56/1] flex flex-col items-center justify-center p-1.5">
            <img
              src="/ui-pod.png"
              alt=""
              className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
              draggable={false}
            />
            <span className="relative z-10 text-[9px] font-black uppercase tracking-wider text-[#6a4c28] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              TIMER
            </span>
            <span
              className={`relative z-10 text-base sm:text-lg font-black font-mono leading-none mt-0.5 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] ${timeLeft <= 15 ? 'text-[#DC2626] animate-pulse' : 'text-[#382613]'
                }`}
            >
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>

          {/* Right: ROLE Pod (Clickable to switch role for testing) */}
          <button
            type="button"
            onClick={() => switchTurn()}
            className="relative aspect-[1.56/1] flex flex-col items-center justify-center p-1.5 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title="Tap to switch roles (Guesser / Clue Giver)"
          >
            <img
              src="/ui-pod.png"
              alt=""
              className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
              draggable={false}
            />
            <span className="relative z-10 text-[9px] font-black uppercase tracking-wider text-[#6a4c28] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              ROLE ⇄
            </span>
            <span className="relative z-10 text-xs sm:text-sm font-black font-display text-[#382613] leading-none mt-0.5 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              {role === 'guesser' ? 'YOU GUESS' : 'YOU CLUE'}
            </span>
          </button>
        </div>

        {/* ═══ SECRET WORD TABLET (Custom-Fitted Wood Pod with Leaves, Direct Input for Guesser) ═══ */}
        <div
          onClick={() => {
            if (role === 'guesser' && roundStatus === 'playing') {
              inputRef.current?.focus();
            }
          }}
          className={`relative w-full max-w-[440px] aspect-[880/280] flex flex-col items-center justify-center p-3 sm:p-4 my-0.5 sm:my-1 flex-shrink-0 select-none cursor-pointer ${
            isInputShaking ? 'animate-clue-shake' : ''
          }`}
        >
          {/* Custom Fitted Wood Pod Texture */}
          <img
            src="/secret-word-wood.png"
            alt=""
            className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
            draggable={false}
          />

          {/* Guesser Direct Input Layer (Invisible overlay covering the tablet) */}
          {role === 'guesser' && roundStatus === 'playing' && (
            <input
              ref={inputRef}
              type="text"
              value={guessInput}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, targetWord.length);
                setGuessInput(val);
                setInputFeedback(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUserGuessSubmit();
                }
              }}
              maxLength={targetWord.length}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              className="absolute inset-0 w-full h-full opacity-0 cursor-text z-20"
              aria-label="Direct secret word input"
            />
          )}

          {/* Content Layer Inside Tablet */}
          <div className="relative z-10 w-[84%] flex flex-col items-center justify-center text-center pointer-events-none">
            {/* Label on Top: SECRET WORD */}
            <span className="font-display font-black text-[10px] sm:text-xs uppercase tracking-widest text-[#5a3e20] drop-shadow-[0_1px_0_rgba(255,255,255,0.7)] mb-1">
              SECRET WORD
            </span>

            {/* The Word or Letter Slots */}
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap">
              {targetWord.split('').map((char, idx) => {
                const isSolvedOrTimeout = roundStatus === 'solved' || roundStatus === 'timeout';
                const isGiver = role === 'giver';
                const isGuesser = role === 'guesser';

                let displayChar = '_';
                let slotStyle = 'bg-[#5c4024]/30 text-transparent border-b-2 border-[#382613]';

                if (isSolvedOrTimeout) {
                  displayChar = char;
                  slotStyle =
                    roundStatus === 'solved'
                      ? 'bg-[#183a2c] text-[#38C185] shadow-[0_1px_0_#1f6e4a]'
                      : 'bg-[#4a1c1c] text-[#f87171]';
                } else if (isGiver) {
                  displayChar = char;
                  slotStyle = 'bg-[#382613] text-white shadow-sm';
                } else if (isGuesser) {
                  const typed = guessInput[idx];
                  const isCursor = idx === guessInput.length;
                  if (typed) {
                    displayChar = typed;
                    slotStyle = 'bg-[#382613] text-[#F0B247] border-b-2 border-[#F0B247] shadow-sm animate-pop';
                  } else if (isCursor) {
                    displayChar = '';
                    slotStyle = 'bg-[#5c4024]/40 text-transparent border-2 border-[#38C185] animate-pulse';
                  }
                }

                return (
                  <div
                    key={idx}
                    className={`w-6 h-7 sm:w-7 sm:h-8 rounded-md flex items-center justify-center font-display font-black text-xs sm:text-sm select-none transition-all ${slotStyle}`}
                  >
                    {displayChar}
                  </div>
                );
              })}
            </div>

            {/* Sub-label: Category & Letter Count or Feedback / Solved celebration */}
            <div className="flex flex-col items-center mt-1">
              {roundStatus === 'solved' && pointsAwarded > 0 ? (
                <span
                  className="text-[10px] font-black text-[#38C185] drop-shadow-[0_1px_0_rgba(0,0,0,0.6)] animate-bounce"
                  title={
                    pointsBreakdown
                      ? `Base: +${pointsBreakdown.base} • Time: +${pointsBreakdown.time} • Clue: +${pointsBreakdown.clueBonus}`
                      : undefined
                  }
                >
                  +{pointsAwarded} PTS EARNED!
                </span>
              ) : roundStatus === 'timeout' ? (
                <span className="text-[10px] font-bold text-[#F87171] drop-shadow-[0_1px_0_rgba(0,0,0,0.6)]">
                  TIME EXPIRED! {role === 'giver' && pointsAwarded > 0 ? `(+${pointsAwarded} STUMP BONUS)` : ''}
                </span>
              ) : inputFeedback ? (
                <span className="text-[10px] font-bold text-[#F87171] drop-shadow-[0_1px_0_rgba(0,0,0,0.6)] animate-bounce">
                  {inputFeedback}
                </span>
              ) : (
                <span className="text-[9px] font-bold text-[#7a5732] drop-shadow-[0_1px_0_rgba(255,255,255,0.5)] uppercase tracking-wider">
                  {currentItem.category} • {targetWord.length} LETTERS{' '}
                  {role === 'guesser' && roundStatus === 'playing' ? '• TAP TO TYPE' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ═══ CLUES CONTAINER (Custom-Fitted Wood Pod with Leaves Matching Top Tablet) ═══ */}
        <div className="relative w-full max-w-[440px] flex-1 min-h-0 flex flex-col justify-between my-0.5 select-none overflow-hidden px-[8%] sm:px-[9%] pt-[11%] sm:pt-[12%] pb-[11%] sm:pb-[12%]">
          {/* Custom Fitted Wood Clue Container Texture */}
          <img
            src="/clue-container-wood.png"
            alt=""
            className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
            draggable={false}
          />

          {/* Content Layer Inside Clues Container */}
          <div className="relative z-10 w-full h-full flex flex-col justify-between overflow-hidden px-1">
            {/* Clue Cards Area: Fits up to 4 Clue Cards without stretching, starting comfortably lower */}
            <div className="w-full flex-1 min-h-0 flex flex-col justify-start gap-2 sm:gap-2.5 overflow-y-auto no-scrollbar pt-1 sm:pt-2 pb-1">
              {revealedClueIndices.map((clueIdx, order) => (
                <div
                  key={clueIdx}
                  className="relative w-full min-h-[50px] sm:min-h-[56px] px-3.5 py-1.5 flex items-center justify-center animate-pop select-none flex-shrink-0"
                >
                  {/* Fitted Wood Clue Card Texture */}
                  <img
                    src="/clue-card-wood.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
                    draggable={false}
                  />
                  <div className="relative z-10 w-full flex items-center gap-2.5 px-3">
                    <span className="w-5 h-5 rounded-full bg-[#382613] text-[#38C185] text-[10px] font-black flex items-center justify-center flex-shrink-0">
                      {order + 1}
                    </span>
                    <p className="flex-1 text-xs sm:text-[12.5px] text-[#382613] font-bold leading-snug text-center drop-shadow-[0_1px_0_rgba(255,255,255,0.7)] line-clamp-2">
                      &ldquo;{currentItem.clues[clueIdx]}&rdquo;
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Status Message (e.g. CPU state) */}
            {role === 'giver' && (
              <div className="w-full p-1.5 rounded-xl bg-black/60 border border-white/10 text-center my-1.5 flex-shrink-0">
                <p className="text-[10px] sm:text-[11px] text-[#38C185] font-semibold animate-pulse">
                  {cpuStatusMsg || 'CPU Detective is deducing the secret word...'}
                </p>
              </div>
            )}

            {/* Bottom Controls: Guesser (Wood Buttons adjusted upwards) */}
            {role === 'guesser' && roundStatus === 'playing' && (
              <div className="w-full grid grid-cols-2 gap-2 mt-1 mb-2 sm:mb-2.5 flex-shrink-0">
                {/* Request Clue button (Textured, no icon) */}
                <button
                  type="button"
                  onClick={handleRequestClue}
                  disabled={revealedClueIndices.length >= 4 || isWaitingForClue}
                  className="relative h-9 sm:h-10 flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-all select-none cursor-pointer disabled:opacity-50"
                >
                  <img
                    src="/ui-wood-btn.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
                    draggable={false}
                  />
                  <span className="relative z-10 pt-0.5 font-display font-black text-[10px] sm:text-[11px] text-white tracking-wide">
                    {isWaitingForClue ? 'WAITING...' : `REQUEST CLUE (${4 - revealedClueIndices.length})`}
                  </span>
                </button>

                {/* Guess button (Textured) */}
                <button
                  type="button"
                  onClick={() => handleUserGuessSubmit()}
                  disabled={!guessInput.trim()}
                  className="relative h-9 sm:h-10 flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-all select-none cursor-pointer disabled:opacity-50"
                >
                  <img
                    src="/ui-wood-btn.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
                    draggable={false}
                  />
                  <span className="relative z-10 pt-0.5 font-display font-black text-[10px] sm:text-[11px] text-[#4ade80] tracking-wide">
                    GUESS WORD
                  </span>
                </button>
              </div>
            )}

            {/* Bottom Controls: Clue Giver (Textured, adjusted upwards) */}
            {role === 'giver' && roundStatus === 'playing' && (
              <div className="w-full mt-1 mb-2 sm:mb-2.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCluePicker(true)}
                  disabled={revealedClueIndices.length >= 4}
                  className="relative w-full h-9 sm:h-10 flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-all select-none cursor-pointer disabled:opacity-50"
                >
                  <img
                    src="/choose-clue-wood.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
                    draggable={false}
                  />
                  <span className="relative z-10 pt-0.5 font-display font-black text-[11px] sm:text-xs text-[#382613] tracking-wide drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
                    CHOOSE CLUE TO SEND ({4 - revealedClueIndices.length} LEFT)
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ CLUE OPTIONS POPUP (MOCK UI CARDS FOR DEMONSTRATION) ═══ */}
      {showCluePicker && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setShowCluePicker(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-dissolve select-none overflow-hidden touch-none overscroll-none"
        >
          {/* No outer wrapper container! Only the remaining individual cards */}
          <div className="w-full max-w-[420px] flex flex-col gap-2.5 sm:gap-3 animate-modal-from-top">
            {availableClueOptions.map(({ clueText, idx }) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectClueToSend(idx)}
                className="relative w-full min-h-[54px] sm:min-h-[60px] px-4 py-2 flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer select-none group"
              >
                {/* Custom-fitted wood card with leaf corners */}
                <img
                  src="/clue-option-wood.png"
                  alt=""
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
                  draggable={false}
                />

                {/* ONLY the option clue text - no other label or information */}
                <span className="relative z-10 px-4 font-display font-bold text-xs sm:text-[13px] text-[#382613] text-center leading-relaxed drop-shadow-[0_1px_0_rgba(255,255,255,0.7)] group-hover:text-[#1a1208]">
                  &ldquo;{clueText}&rdquo;
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ ROUND INTRO POPUP (SECRET WORD REVEAL FOR THIS ROUND - 2S AUTO TIMEOUT) ═══ */}
      {showRoundIntro && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={handleProceedToGameplay}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-dissolve select-none overflow-hidden touch-none overscroll-none cursor-pointer"
        >
          {/* General Dialog Texture Container */}
          <div className="relative w-full max-w-[390px] aspect-[994/520] sm:aspect-[994/480] flex flex-col items-center justify-center p-4 sm:p-5 filter drop-shadow-[0_14px_35px_rgba(0,0,0,0.75)] animate-modal-from-top">
            <img
              src="/modal-container.png"
              alt=""
              className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none rounded-2xl"
              draggable={false}
            />

            {/* Content inside dialog texture */}
            <div className="relative z-10 w-[84%] flex flex-col items-center justify-center text-center">
              {/* Label on top: SECRET WORD */}
              <span className="font-display font-black text-xs sm:text-sm uppercase tracking-widest text-[#5a3e20] drop-shadow-[0_1px_0_rgba(255,255,255,0.7)] mb-1 sm:mb-2">
                SECRET WORD
              </span>

              {/* The Word for that round */}
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap my-1 sm:my-2">
                {targetWord.split('').map((char, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-7 sm:w-7 sm:h-8 rounded-md bg-[#382613] text-[#38C185] flex items-center justify-center font-display font-black text-xs sm:text-sm shadow-md select-none border-t border-white/20"
                  >
                    {char}
                  </div>
                ))}
              </div>

              {/* Category & Length */}
              <span className="text-[10px] sm:text-xs font-bold text-[#7a5732] drop-shadow-[0_1px_0_rgba(255,255,255,0.5)] uppercase tracking-wider">
                {currentItem.category} • {targetWord.length} LETTERS
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SETTINGS MODAL (Fantasy Stone/Wood Dialog) ═══ */}
      <GameModal open={showSettings} onClose={() => setShowSettings(false)}>
        <div className="w-full flex flex-col items-center gap-3">
          <h3 className="font-display font-black text-base sm:text-lg text-[#4a3219] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
            SETTINGS
          </h3>

          <div className="w-full grid grid-cols-2 gap-2">
            {/* Sound Toggle */}
            <GameWoodButton
              colSpan={1}
              onClick={toggleSound}
              title="Toggle Sound"
            >
              SOUND: {soundOn ? 'ON' : 'OFF'}
            </GameWoodButton>

            {/* Difficulty Toggle */}
            <GameWoodButton
              colSpan={1}
              onClick={() => {
                setDifficulty((cur) => (cur === 'easy' ? 'medium' : cur === 'medium' ? 'hard' : 'easy'));
              }}
              title="CPU Difficulty"
            >
              CPU: {difficulty.toUpperCase()}
            </GameWoodButton>

            {/* Restart Round */}
            <GameWoodButton
              colSpan={2}
              onClick={() => {
                setShowSettings(false);
                handleRestartGame();
              }}
            >
              NEW GAME
            </GameWoodButton>

            {/* Close Settings */}
            <GameWoodButton
              colSpan={2}
              onClick={() => setShowSettings(false)}
            >
              RESUME PLAY
            </GameWoodButton>
          </div>
        </div>
      </GameModal>
    </>
  );
}
