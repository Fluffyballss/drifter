/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Lock, 
  Plus, 
  Trash2, 
  Play, 
  ChevronRight, 
  Activity, 
  Shield, 
  Cpu, 
  AlertTriangle,
  LogOut,
  Camera,
  Info,
  Dna,
  Wrench,
  Zap,
  Crosshair,
  Smile,
  Globe
} from 'lucide-react';
import { Character, DayLog, Ending, Resources, generateDailySimulation, generateEnding } from './services/simulationService';

// --- Utilities ---

const playSound = (freq: number, type: OscillatorType = 'sine', duration: number = 0.1) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio not supported', e);
  }
};

const playWarningSound = () => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const playPulse = (time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, time);
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.5);
  };
  playPulse(ctx.currentTime);
  playPulse(ctx.currentTime + 0.6);
};

// --- Components ---

const DangerAlert = ({ type, onClose }: { type: string, onClose: () => void }) => (
  <motion.div
    initial={{ x: '100%' }}
    animate={{ x: 0 }}
    exit={{ x: '-100%' }}
    className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
  >
    <div className="bg-sci-red/90 text-white p-8 sci-border border-4 border-white shadow-[0_0_50px_rgba(255,0,0,0.5)] pointer-events-auto max-w-2xl w-full mx-4">
      <div className="flex items-center justify-between mb-6 border-b-2 border-white/50 pb-4">
        <div className="flex items-center gap-4">
          <AlertTriangle className="w-12 h-12 animate-bounce" />
          <div>
            <h2 className="text-4xl font-display font-black tracking-tighter uppercase italic">Warning: Critical Threat</h2>
            <p className="text-sm font-mono opacity-80">CODE RED // SECTOR THREAT DETECTED</p>
          </div>
        </div>
        <button onClick={onClose} className="hover:scale-110 transition-transform">
          <LogOut className="w-8 h-8 rotate-45" />
        </button>
      </div>
      
      <div className="flex gap-6 items-center">
        <div className="flex-1 space-y-4">
          <div className="bg-white text-sci-red p-4 font-display text-2xl font-black uppercase text-center skew-x-[-10deg]">
            {type}
          </div>
          <p className="font-mono text-sm leading-relaxed">
            [SYSTEM] Unauthorized entity detected in sector 4-B. Life support integrity compromised. 
            All crew members report to battle stations immediately. 
            Automated defense systems offline. Manual intervention required.
          </p>
        </div>
        
        <div className="w-32 h-32 border-4 border-white/30 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)]" />
          <Zap className="w-16 h-16 animate-pulse" />
        </div>
      </div>
      
      <div className="mt-8 flex justify-between items-end">
        <div className="text-[10px] font-mono opacity-50">
          ID: ERR_THREAT_DETECTED_0x88<br />
          TIMESTAMP: {new Date().toISOString()}
        </div>
        <button 
          onClick={onClose}
          className="bg-white text-sci-red px-8 py-2 font-display font-black uppercase hover:bg-sci-paper transition-colors"
        >
          Acknowledge
        </button>
      </div>
    </div>
  </motion.div>
);

const TypewriterLog = ({ text, onComplete, speed = 10 }: { text: string, onComplete?: () => void, speed?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.substring(0, index + 1));
        setIndex(index + 1);
        if (index % 3 === 0) playSound(440, 'sine', 0.001);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, speed, onComplete]);

  return <span>{displayedText}</span>;
};

const SequentialLogEntry = ({ entry, onComplete }: { entry: any, onComplete: () => void }) => {
  return (
    <div className="flex gap-3 text-[17px] leading-relaxed">
      <span className="text-sci-cyan/60 font-mono font-bold">[{entry.time}]</span>
      <p className="text-sci-ink/90 font-medium">
        <TypewriterLog text={entry.text} onComplete={onComplete} />
      </p>
    </div>
  );
};

const SequentialDialogueEntry = ({ dialogue, characters, onComplete }: { dialogue: any, characters: any[], onComplete: () => void }) => {
  const char = characters.find(c => c.id === dialogue.characterId);
  return (
    <div className="relative group">
      {/* Device Frame */}
      <div className="absolute -inset-1 bg-gradient-to-r from-sci-cyan/20 to-transparent rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
      
      <div className="relative flex flex-col gap-2 bg-sci-bg/80 backdrop-blur-sm p-4 sci-border border-sci-cyan/30 rounded-lg overflow-hidden">
        {/* Signal Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#00ffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="flex justify-between items-center border-b border-sci-cyan/10 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-sci-cyan animate-pulse shadow-[0_0_8px_rgba(0,255,255,0.8)]"></div>
            <span className="uppercase font-mono text-[11px] font-black text-sci-cyan tracking-[0.2em]">
              {char?.name || 'Unknown'} // COMMS_LINK_0{Math.floor(Math.random() * 9) + 1}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-sci-cyan/40">
            <Activity className="w-3 h-3 opacity-50" />
            <span>[{dialogue.time}]</span>
          </div>
        </div>

        <div className="relative py-2">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-sci-cyan/20 rounded-full"></div>
          <p className="pl-4 text-sci-cyan text-[16px] font-medium leading-relaxed tracking-wide">
            <span className="text-sci-cyan/40 mr-2">"</span>
            <TypewriterLog text={dialogue.text} onComplete={onComplete} speed={20} />
            <span className="text-sci-cyan/40 ml-1">"</span>
          </p>
        </div>

        <div className="flex justify-end gap-1 mt-1 opacity-20">
          <div className="w-4 h-1 bg-sci-cyan"></div>
          <div className="w-2 h-1 bg-sci-cyan"></div>
          <div className="w-1 h-1 bg-sci-cyan"></div>
        </div>
      </div>
    </div>
  );
};

const SequentialChoiceEntry = ({ choice, onComplete }: { choice: any, onComplete: () => void }) => {
  const selected = choice.options[choice.selectedOptionIndex];
  return (
    <div className="flex flex-col gap-4 bg-sci-orange/5 p-4 sci-border border-sci-orange/20">
      <div className="flex items-center gap-2 text-sci-orange text-[13px] font-mono opacity-60 uppercase font-bold">
        <AlertTriangle className="w-4 h-4" /> Critical Decision Point
      </div>
      <div className="text-sci-ink font-medium text-[17px]">
        <TypewriterLog text={choice.scenario} onComplete={onComplete} />
      </div>
      <div className="grid grid-cols-1 gap-2 mt-2">
        {choice.options.map((opt: any, idx: number) => (
          <div 
            key={idx} 
            className={`p-3 text-[15px] sci-border transition-all ${idx === choice.selectedOptionIndex ? 'bg-sci-orange text-white border-sci-orange' : 'bg-white/40 text-sci-ink/40 border-sci-border/20'}`}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold">{idx === choice.selectedOptionIndex ? '✓ ' : ''}{opt.text}</span>
              {idx === choice.selectedOptionIndex && <span className="text-[10px] uppercase font-mono">Selected by Crew</span>}
            </div>
            {idx === choice.selectedOptionIndex && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 text-white/80 italic text-sm border-t border-white/20 pt-2"
              >
                {opt.result}
              </motion.p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface DayLogDisplayProps {
  log: DayLog;
  characters: Character[];
  isLatest: boolean;
  key?: React.Key;
}

const DayLogDisplay = ({ log, characters, isLatest }: DayLogDisplayProps) => {
  // Combine and sort entries by time
  const entries = [
    ...log.events.map(e => ({ ...e, type: 'event' })),
    ...(log.dialogues || []).map(d => ({ ...d, type: 'dialogue' })),
    ...(log.choice ? [{ ...log.choice, type: 'choice', time: '23:59' }] : [])
  ].sort((a, b) => a.time.localeCompare(b.time));

  const [visibleCount, setVisibleCount] = useState(isLatest ? 0 : entries.length - 1);

  useEffect(() => {
    if (!isLatest) {
      setVisibleCount(entries.length - 1);
    }
  }, [isLatest, entries.length]);

  if (entries.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="text-sci-cyan font-display text-sm font-bold">DAY {log.day}</div>
          {log.isDanger && (
            <div className="bg-sci-red text-white text-[10px] px-2 py-0.5 font-display font-black uppercase animate-pulse flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Crisis: {log.dangerType}
            </div>
          )}
          <div className="flex-1 h-px bg-sci-cyan/20" />
        </div>
        {isLatest && visibleCount < entries.length - 1 && (
          <button 
            onClick={() => setVisibleCount(entries.length - 1)}
            className="text-[10px] text-sci-cyan/40 hover:text-sci-cyan font-mono uppercase tracking-widest transition-colors"
          >
            [ SKIP TYPEWRITER ]
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {entries.map((entry, idx) => (
          <div key={idx} className={idx <= visibleCount ? 'block' : 'hidden'}>
            {entry.type === 'event' ? (
              <SequentialLogEntry 
                entry={entry} 
                onComplete={() => {
                  if (idx === visibleCount && visibleCount < entries.length - 1) {
                    setVisibleCount(prev => prev + 1);
                  }
                }} 
              />
            ) : entry.type === 'dialogue' ? (
              <SequentialDialogueEntry 
                dialogue={entry} 
                characters={characters}
                onComplete={() => {
                  if (idx === visibleCount && visibleCount < entries.length - 1) {
                    setVisibleCount(prev => prev + 1);
                  }
                }}
              />
            ) : (
              <SequentialChoiceEntry 
                choice={entry}
                onComplete={() => {
                  if (idx === visibleCount && visibleCount < entries.length - 1) {
                    setVisibleCount(prev => prev + 1);
                  }
                }}
              />
            )}
          </div>
        ))}
      </div>

      {log.statusUpdates.length > 0 && visibleCount === entries.length - 1 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4"
        >
          {log.statusUpdates.map((update, j) => {
            const char = characters.find(c => c.id === update.characterId);
            return (
              <div key={j} className={`text-[13px] p-2 border-2 ${update.isDead ? 'border-sci-red bg-sci-red/10 text-sci-red' : 'border-sci-cyan/20 bg-white/40 text-sci-cyan/80'} font-display font-bold flex items-center gap-2`}>
                <Info className="w-3 h-3" />
                {char?.name}: {update.status}
              </div>
            );
          })}
        </motion.div>
      )}

      {log.skillUnlocks && log.skillUnlocks.length > 0 && visibleCount === entries.length - 1 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-1 mt-2"
        >
          {log.skillUnlocks.map((unlock, idx) => {
            const char = characters.find(c => c.id === unlock.characterId);
            return (
              <div key={idx} className="text-[13px] text-sci-green font-bold flex items-center gap-2">
                <Zap className="w-3 h-3" />
                {char?.name} 습득: {unlock.skillName} - {unlock.description}
              </div>
            );
          })}
        </motion.div>
      )}

      {log.resourceChanges && Object.keys(log.resourceChanges).length > 0 && visibleCount === entries.length - 1 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-4 mt-2 border-t border-sci-border/10 pt-2"
        >
          {Object.entries(log.resourceChanges).map(([key, val]) => (
            <div key={key} className="text-[8px] font-mono text-sci-ink/40 uppercase">
              {key}: {val > 0 ? '+' : ''}{val}%
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

const SciFiButton = ({ children, onClick, variant = 'cyan', className = '', disabled = false }: any) => {
  const colors: any = {
    cyan: 'border-sci-cyan text-sci-cyan hover:bg-sci-cyan/10',
    orange: 'border-sci-orange text-sci-orange hover:bg-sci-orange/10',
    red: 'border-sci-red text-sci-red hover:bg-sci-red/10',
    green: 'border-sci-green text-sci-green hover:bg-sci-green/10',
    ink: 'border-sci-ink text-sci-ink hover:bg-sci-ink/10',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`sci-border px-6 py-2 font-display uppercase tracking-widest text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${colors[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const SciFiInput = ({ label, value, onChange, type = 'text', placeholder = '', icon: Icon }: any) => (
  <div className="space-y-1">
    {label && <label className="text-[13px] uppercase text-sci-ink/60 tracking-tighter font-display">{label}</label>}
    <div className="relative group">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sci-ink/40 group-focus-within:text-sci-ink transition-colors" />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-white/40 border-2 border-sci-border p-2 ${Icon ? 'pl-10' : 'px-4'} text-sci-ink text-[19px] focus:outline-none focus:bg-white/60 transition-all font-mono placeholder:text-sci-ink/20`}
      />
    </div>
  </div>
);

const CharacterCard = (props: any) => {
  const { character, isInteracting = false } = props;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: isInteracting ? 1.02 : 1,
      }}
      className={`relative w-full min-h-[260px] bg-sci-bg border border-sci-border overflow-hidden group transition-all duration-300 ${character.isDead ? 'grayscale' : ''} ${isInteracting ? 'ring-2 ring-sci-cyan ring-offset-2 ring-offset-sci-bg shadow-[0_0_30px_rgba(0,255,255,0.2)]' : ''}`}
    >
      {/* Card Header Background */}
      <div className="absolute top-0 left-0 w-full h-10 bg-sci-border/10 border-b border-sci-border/30" />
      
      <div className="relative z-10 flex flex-col sm:flex-row h-full p-3 gap-3">
        {/* Photo Section */}
        <div className="flex flex-row sm:flex-col gap-3 items-center sm:items-start">
          <div className="w-20 h-24 sm:w-24 sm:h-28 sci-border bg-black/40 flex items-center justify-center overflow-hidden relative shrink-0">
            {character.image ? (
              <img src={character.image} alt={character.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-10 h-10 text-sci-cyan/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sci-cyan/5 to-transparent h-1/2 w-full animate-scanline pointer-events-none" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[7px] text-sci-cyan/60 uppercase font-bold tracking-tighter">Status</div>
            <div className={`text-[9px] font-bold uppercase ${character.isDead ? 'text-sci-red' : 'text-sci-green'}`}>
              {character.isDead ? 'Terminated' : 'Active'}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div className="space-y-1.5">
            <div className="flex justify-between items-start">
              <div className="text-[8px] text-sci-cyan font-mono font-bold">#{character.uid}</div>
              <div className="text-[8px] text-sci-orange font-mono font-bold">AGE: {character.age}</div>
            </div>
            
            <div className="space-y-0">
              <h3 className="text-xl font-display font-black text-white tracking-tighter uppercase leading-tight truncate">
                {character.name}
              </h3>
              <div className="text-[9px] uppercase font-bold text-sci-cyan/80 tracking-widest flex items-center gap-1.5">
                <span>{character.gender}</span>
                <span className="w-0.5 h-0.5 bg-sci-border rounded-full" />
                <span>{character.mbti}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mt-1">
              {character.keywords.map((k: string, i: number) => (
                <span key={i} className="text-[8px] px-1.5 py-0.5 bg-sci-cyan/5 border border-sci-cyan/20 text-sci-cyan/80 font-bold uppercase tracking-tighter">
                  {k}
                </span>
              ))}
            </div>
          </div>

          {/* Specialization */}
          <div className="space-y-1.5 mt-2">
            <div className="text-[7px] uppercase font-black text-sci-ink/40 tracking-[0.2em]">Specialization</div>
            <div className="grid grid-cols-1 gap-1">
              {character.skills && character.skills.length > 0 ? (
                character.skills.slice(0, 2).map((s: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 px-2 py-0.5 border border-white/10">
                    <span className="text-[8px] font-bold text-white/70 truncate">{s.name}</span>
                    <span className="text-[8px] font-mono text-sci-orange font-bold">LV.{s.level}</span>
                  </div>
                ))
              ) : (
                <div className="text-[8px] text-white/20 italic">No data</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 right-0 w-12 h-12 opacity-5 pointer-events-none">
        <div className="absolute bottom-1 right-1 w-8 h-8 border-r border-b border-sci-cyan" />
      </div>

      {character.isDead && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-20">
          <div className="border border-sci-red text-sci-red font-display px-3 py-0.5 -rotate-12 text-xl font-black uppercase bg-black/80 shadow-2xl">
            Terminated
          </div>
        </div>
      )}
    </motion.div>
  );
};

const MBTI_LIST = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
];

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'login' | 'registration' | 'simulation' | 'database' | 'archive'>('login');
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [currentDay, setCurrentDay] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [integrity, setIntegrity] = useState(98.2);
  const [resources, setResources] = useState<Resources>({
    oxygen: 100,
    food: 100,
    water: 100,
    fuel: 100
  });
  const [mood, setMood] = useState(80);
  const [activeDanger, setActiveDanger] = useState<string | null>(null);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [hasSeenSystemInfo, setHasSeenSystemInfo] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'info' | 'success' | 'warning' }[]>([]);

  const addToast = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const [ending, setEnding] = useState<Ending | null>(null);
  const [isEndingLoading, setIsEndingLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  
  // Registration State
  const [newChar, setNewChar] = useState({
    name: '',
    age: 25,
    image: '',
    gender: '남성',
    keywords: ['', ''],
    mbti: 'ISTJ'
  });

  const logContainerRef = useRef<HTMLDivElement>(null);

  const saveGame = () => {
    const gameState = {
      nickname,
      code,
      characters,
      logs,
      currentDay,
      integrity,
      resources,
      mood,
      hasSeenSystemInfo
    };
    localStorage.setItem('drifter_save', JSON.stringify(gameState));
    playSound(880, 'sine', 0.2);
    addToast('데이터가 로컬 저장소에 성공적으로 기록되었습니다.', 'success');
  };

  const loadGame = () => {
    const saved = localStorage.getItem('drifter_save');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setNickname(state.nickname);
        setCode(state.code);
        setCharacters(state.characters);
        setLogs(state.logs);
        setCurrentDay(state.currentDay);
        setIntegrity(state.integrity);
        setResources(state.resources);
        setMood(state.mood);
        setHasSeenSystemInfo(state.hasSeenSystemInfo);
        setView('simulation');
        playSound(1200, 'sine', 0.2);
        addToast('이전 세션 데이터를 성공적으로 복구했습니다.', 'info');
      } catch (e) {
        console.error('Failed to load save', e);
        addToast('데이터 복구 중 치명적인 오류가 발생했습니다.', 'warning');
      }
    } else {
      addToast('복구할 수 있는 세션 데이터가 존재하지 않습니다.', 'warning');
    }
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs]);

  const handleLogin = () => {
    if (nickname && code) {
      setView('registration');
    }
  };

  useEffect(() => {
    if (view === 'registration' && !hasSeenSystemInfo) {
      setShowSystemInfo(true);
      setHasSeenSystemInfo(true);
    }
  }, [view, hasSeenSystemInfo]);

  const addCharacter = () => {
    if (characters.length >= 6) return;
    if (!newChar.name) return;

    const char: Character = {
      id: Math.random().toString(36).substr(2, 9),
      name: newChar.name,
      age: newChar.age,
      image: newChar.image || `https://picsum.photos/seed/${newChar.name}/200/300`,
      gender: newChar.gender,
      keywords: newChar.keywords.filter(k => k.trim()),
      mbti: newChar.mbti,
      isDead: false,
      uid: `DRFT-${Math.floor(1000 + Math.random() * 9000)}`,
      skills: []
    };

    setCharacters([...characters, char]);
    setNewChar({ name: '', age: 25, image: '', gender: '남성', keywords: ['', ''], mbti: 'ISTJ' });
  };

  const removeCharacter = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id));
  };

  const startSimulation = async () => {
    if (characters.length === 0) return;
    setView('simulation');
    setIsSimulating(true);
    
    try {
      const simulationPromise = generateDailySimulation(1, characters, [], resources);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Simulation timed out")), 60000)
      );

      const firstDay = await Promise.race([simulationPromise, timeoutPromise]) as DayLog;
      setLogs([firstDay]);
      
      // Apply resource changes
      const rc = firstDay.resourceChanges || {};
      const newResources = {
        oxygen: Math.max(0, Math.min(100, resources.oxygen + (rc.oxygen || 0))),
        food: Math.max(0, Math.min(100, resources.food + (rc.food || 0))),
        water: Math.max(0, Math.min(100, resources.water + (rc.water || 0))),
        fuel: Math.max(0, Math.min(100, resources.fuel + (rc.fuel || 0)))
      };
      setResources(newResources);

      const newIntegrity = rc.integrity !== undefined ? Math.max(0, Math.min(100, integrity + rc.integrity)) : integrity;
      setIntegrity(newIntegrity);
      setCurrentDay(1);

      // Auto-save
      const gameState = {
        nickname,
        code,
        characters,
        logs: [firstDay],
        currentDay: 1,
        integrity: newIntegrity,
        resources: newResources,
        mood: firstDay.moodScore,
        hasSeenSystemInfo
      };
      localStorage.setItem('drifter_save', JSON.stringify(gameState));
    } catch (error) {
      console.error("Initial simulation failed:", error);
      const fallbackLog = {
        day: 1,
        events: [{ text: "초기 시스템 부팅 중 오류가 발생했습니다. 수동 복구 모드로 전환합니다.", time: "00:00" }],
        statusUpdates: [],
        moodScore: 80,
        resourceChanges: { oxygen: -1, food: -1, water: -1 }
      };
      setLogs([fallbackLog]);
      setCurrentDay(1);
    } finally {
      setIsSimulating(false);
    }
  };

  const nextDay = async () => {
    if (currentDay >= 60 || isSimulating) return;
    setIsSimulating(true);
    playSound(440, 'sine', 0.1);
    
    try {
      // Check for deaths in the previous log and update characters
      const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
      const updatedCharacters = characters.map(c => {
        if (!lastLog) return c;
        const update = lastLog.statusUpdates.find(u => u.characterId === c.id);
        if (update?.isDead) return { ...c, isDead: true, deathDay: lastLog.day };
        return c;
      });
      setCharacters(updatedCharacters);

      const simulationPromise = generateDailySimulation(currentDay + 1, updatedCharacters, logs, resources);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Simulation timed out")), 60000)
      );

      const nextLog = await Promise.race([simulationPromise, timeoutPromise]) as DayLog;
      
      if (nextLog.isDanger) {
        setActiveDanger(nextLog.dangerType || 'UNKNOWN THREAT');
        playWarningSound();
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 1000);
      }

      if (nextLog.moodScore > mood || (nextLog.skillUnlocks && nextLog.skillUnlocks.length > 0)) {
        setIsGlowing(true);
        setTimeout(() => setIsGlowing(false), 2000);
      }

      // Apply resource changes
      let rc: any = nextLog.resourceChanges || {};
      const newResources = {
        oxygen: Math.max(0, Math.min(100, resources.oxygen + (rc.oxygen || 0))),
        food: Math.max(0, Math.min(100, resources.food + (rc.food || 0))),
        water: Math.max(0, Math.min(100, resources.water + (rc.water || 0))),
        fuel: Math.max(0, Math.min(100, resources.fuel + (rc.fuel || 0)))
      };
      setResources(newResources);
      
      let newIntegrity = integrity;
      if (rc.integrity !== undefined) {
        newIntegrity = Math.max(0, Math.min(100, integrity + rc.integrity));
      } else {
        newIntegrity = Math.max(0, integrity - (1 + Math.random() * 2));
      }
      setIntegrity(newIntegrity);

      // Apply skill unlocks
      let charUpdates = [...updatedCharacters];
      if (nextLog.skillUnlocks) {
        nextLog.skillUnlocks.forEach(unlock => {
          const charIdx = charUpdates.findIndex(c => c.id === unlock.characterId);
          if (charIdx !== -1) {
            const existingSkillIdx = charUpdates[charIdx].skills.findIndex(s => s.name === unlock.skillName);
            if (existingSkillIdx !== -1) {
              charUpdates[charIdx].skills[existingSkillIdx].level += 1;
            } else {
              charUpdates[charIdx].skills.push({
                name: unlock.skillName,
                level: 1,
                description: unlock.description
              });
            }
          }
        });
        setCharacters(charUpdates);
      }

      setLogs([...logs, nextLog]);
      setMood(nextLog.moodScore);
      setCurrentDay(currentDay + 1);
      playSound(880, 'sine', 0.1);

      // Auto-save after each day
      const gameState = {
        nickname,
        code,
        characters: charUpdates,
        logs: [...logs, nextLog],
        currentDay: currentDay + 1,
        integrity: newIntegrity,
        resources: newResources,
        mood: nextLog.moodScore,
        hasSeenSystemInfo
      };
      localStorage.setItem('drifter_save', JSON.stringify(gameState));

      if (currentDay + 1 === 60) {
        setIsEndingLoading(true);
        const endResult = await generateEnding(updatedCharacters, [...logs, nextLog]);
        setEnding(endResult);
        setIsEndingLoading(false);
      }
    } catch (error) {
      console.error("Simulation step failed:", error);
      // Fallback log if something went wrong in the UI logic
      const fallbackLog = {
        day: currentDay + 1,
        events: [{ text: "데이터 처리 중 오류가 발생했습니다. 시스템을 재부팅합니다.", time: "00:00" }],
        statusUpdates: [],
        moodScore: mood,
        resourceChanges: { oxygen: -1, food: -1, water: -1 }
      };
      setLogs([...logs, fallbackLog]);
      setCurrentDay(currentDay + 1);
    } finally {
      setIsSimulating(false);
    }
  };

  const resetGame = () => {
    setView('login');
    setCharacters([]);
    setLogs([]);
    setCurrentDay(0);
    setIntegrity(98.2);
    setMood(80);
    setEnding(null);
    setActiveDanger(null);
  };

  return (
    <div className={`h-screen flex flex-col relative selection:bg-sci-cyan selection:text-sci-bg ${isShaking ? 'animate-shake' : ''}`}>
      <div className="grunge-overlay" />
      
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className={`fixed top-8 right-8 z-[200] p-4 sci-border backdrop-blur-md flex items-center gap-3 min-w-[300px] ${
              toast.type === 'success' ? 'bg-sci-green/10 border-sci-green/50 text-sci-green' :
              toast.type === 'warning' ? 'bg-sci-red/10 border-sci-red/50 text-sci-red' :
              'bg-sci-cyan/10 border-sci-cyan/50 text-sci-cyan'
            }`}
          >
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              toast.type === 'success' ? 'bg-sci-green' :
              toast.type === 'warning' ? 'bg-sci-red' :
              'bg-sci-cyan'
            }`} />
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest font-black opacity-50 mb-1">System Notification</p>
              <p className="text-xs font-bold leading-tight">{toast.message}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {showSystemInfo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sci-bg/80 backdrop-blur-md"
          >
            <div className="w-full max-w-lg glass-panel p-8 space-y-6 relative">
              <div className="corner-marker corner-tl" />
              <div className="corner-marker corner-tr" />
              <div className="corner-marker corner-bl" />
              <div className="corner-marker corner-br" />
              
              <div className="flex items-center gap-3 border-b border-sci-border pb-4">
                <Info className="text-sci-orange w-6 h-6" />
                <h3 className="text-xl font-display font-black tracking-tighter uppercase">System Protocol: Crew Registration</h3>
              </div>
              
              <div className="space-y-4 text-[13px] leading-relaxed text-sci-ink/80">
                <p className="font-bold text-sci-orange">[시스템 설명]</p>
                <p>지구로 귀환하는 60일간의 여정을 함께할 대원들을 등록하십시오.</p>
                <p>각 대원의 성격과 MBTI는 시뮬레이션 중 발생하는 상호작용, 자원 관리, 기술 습득 및 생존 확률에 중대한 영향을 미칩니다.</p>
                <p>여정 동안 대원들은 경험을 통해 새로운 기술을 배우거나 능력을 강화할 수 있습니다.</p>
                <p className="text-sci-red/80">최대 6명까지 등록 가능하며, 등록된 데이터는 수정이 불가능하므로 신중히 입력해 주시기 바랍니다.</p>
              </div>
              
              <SciFiButton 
                variant="cyan" 
                className="w-full py-3" 
                onClick={() => {
                  setShowSystemInfo(false);
                  playSound(880, 'sine', 0.1);
                }}
              >
                Acknowledge Protocol
              </SciFiButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <AnimatePresence>
        {activeDanger && (
          <DangerAlert type={activeDanger} onClose={() => setActiveDanger(null)} />
        )}
        {ending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-sci-bg/90 backdrop-blur-xl"
          >
            <div className="w-full max-w-2xl glass-panel p-10 space-y-8 relative overflow-hidden text-center">
              <div className="corner-marker corner-tl" />
              <div className="corner-marker corner-tr" />
              <div className="corner-marker corner-bl" />
              <div className="corner-marker corner-br" />
              
              {/* Universe Icon / Visual */}
              <div className="relative h-48 flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,255,255,0.1)_0%,transparent_70%)] animate-pulse" />
                <div className="relative">
                  <Globe className={`w-32 h-32 ${
                    ending.outcome === 'success' ? 'text-sci-green' : 
                    ending.outcome === 'failure' ? 'text-sci-red' : 'text-sci-orange'
                  } animate-spin-slow`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 border border-sci-cyan/20 rounded-full animate-ping" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className={`text-5xl font-display font-black uppercase tracking-tighter ${
                  ending.outcome === 'success' ? 'text-sci-green' : 
                  ending.outcome === 'failure' ? 'text-sci-red' : 'text-sci-orange'
                }`}>
                  {ending.title}
                </div>
                <div className="h-1 w-24 bg-sci-cyan/30 mx-auto" />
                <p className="text-lg leading-relaxed font-medium text-sci-ink/90 italic">
                  {ending.description}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-4">
                <SciFiButton variant="cyan" onClick={resetGame} className="py-4 text-xl">
                  REPLAY MISSION
                </SciFiButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="p-8 flex justify-between items-center z-20">
        <div className="flex items-center gap-12">
          <h1 className="font-display text-4xl font-black tracking-tighter text-sci-cyan glitch-text">DRIFTER</h1>
          <nav className="hidden md:flex gap-8 text-[10px] uppercase tracking-widest font-bold text-sci-ink/40">
            <button 
              onClick={() => view !== 'login' && setView('simulation')} 
              className={`hover:text-sci-cyan transition-colors ${view === 'simulation' ? 'text-sci-cyan' : ''}`}
            >
              Mission
            </button>
            <button 
              onClick={() => view !== 'login' && setView('database')} 
              className={`hover:text-sci-cyan transition-colors ${view === 'database' ? 'text-sci-cyan' : ''}`}
            >
              Database
            </button>
            <button 
              onClick={() => view !== 'login' && setView('archive')} 
              className={`hover:text-sci-cyan transition-colors ${view === 'archive' ? 'text-sci-cyan' : ''}`}
            >
              Archive
            </button>
          </nav>
        </div>
        
        {view !== 'login' && (
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-6 text-[10px] font-display uppercase font-bold">
              <div className={`flex items-center gap-2 ${integrity > 50 ? 'text-sci-green' : 'text-sci-red'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${integrity > 50 ? 'bg-sci-green' : 'bg-sci-red'}`} />
                Hull: {integrity.toFixed(1)}%
              </div>
              <div className="flex items-center gap-2 text-sci-cyan">
                <div className="w-1.5 h-1.5 rounded-full bg-sci-cyan" />
                Life Support: 84%
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.location.reload()} className="p-2 border border-sci-border bg-transparent text-sci-red/60 hover:text-sci-red transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col relative z-10 overflow-hidden min-h-0">
        <AnimatePresence mode="wait">
          {view === 'database' ? (
            <motion.div
              key="database"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-8"
            >
              <div className="max-w-7xl mx-auto w-full space-y-24">
                <div className="flex justify-between items-end border-b border-sci-border pb-8">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-sci-cyan font-bold">Crew Manifest</p>
                    <h2 className="text-6xl font-display font-black tracking-tighter">DATABASE</h2>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-mono text-sci-ink/40 uppercase">Total Personnel</p>
                    <p className="text-4xl font-display">{characters.length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-sci-border">
                  {characters.map((char, i) => (
                    <div key={char.id} className="bg-sci-bg p-8 space-y-12 relative group overflow-hidden min-h-[500px] flex flex-col justify-between">
                      <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                        <img src={char.image} alt="" className="w-full h-full object-cover grayscale" />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="text-[120px] font-display font-black leading-none opacity-10 select-none">
                          0{i + 1}
                        </div>
                        <div className="absolute top-12 left-0 space-y-4">
                          <div className="inline-block px-3 py-1 border border-sci-ink text-[10px] uppercase tracking-widest font-bold">
                            {char.mbti}
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-3xl font-display font-black tracking-tighter uppercase">{char.name}</h3>
                            <p className="text-[10px] uppercase tracking-widest text-sci-ink/40 font-bold">{char.gender} / {char.uid}</p>
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 space-y-8">
                        <div className="space-y-4">
                          <p className="text-[10px] uppercase tracking-widest font-bold text-sci-cyan">Personality</p>
                          <div className="flex flex-wrap gap-2">
                            {char.keywords.map((k, ki) => (
                              <span key={ki} className="text-[10px] font-mono border-b border-sci-border pb-1">
                                {k}
                              </span>
                            ))}
                          </div>
                        </div>

                        {char.skills.length > 0 && (
                          <div className="space-y-4">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-sci-cyan">Specialization</p>
                            <div className="space-y-2">
                              {char.skills.map((s, si) => (
                                <div key={si} className="flex justify-between items-center text-[10px] font-mono">
                                  <span>{s.name}</span>
                                  <span className="text-sci-orange">LV.{s.level}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-8 border-t border-sci-border/20 flex justify-between items-center">
                          <div className="text-[10px] font-mono text-sci-ink/40">STATUS: {char.isDead ? 'DECEASED' : 'ACTIVE'}</div>
                          <div className={`w-2 h-2 rounded-full ${char.isDead ? 'bg-sci-red' : 'bg-sci-green animate-pulse'}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : view === 'archive' ? (
            <motion.div
              key="archive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-8"
            >
              <div className="max-w-7xl mx-auto w-full space-y-8">
                <div className="flex justify-between items-end border-b border-sci-border pb-6">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-sci-cyan font-bold">Vessel Diagnostics</p>
                    <h2 className="text-5xl font-display font-black tracking-tighter">ARCHIVE // SHIP MAP</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-sci-cyan/10 border border-sci-cyan/30 rounded-full">
                      <div className="w-2 h-2 bg-sci-cyan rounded-full animate-pulse" />
                      <span className="text-[10px] text-sci-cyan font-bold uppercase tracking-widest">Live Telemetry Active</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Map */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="sci-border bg-black/40 p-12 relative min-h-[600px] flex items-center justify-center overflow-hidden">
                      {/* Grid Background */}
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #00ffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                      
                      {/* Room Tooltip */}
                      <AnimatePresence>
                        {selectedRoom && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute z-50 bottom-8 left-1/2 -translate-x-1/2 w-80 sci-border bg-sci-bg/90 backdrop-blur-md p-4 space-y-3"
                          >
                            <div className="flex justify-between items-start border-b border-sci-cyan/30 pb-2">
                              <div>
                                <h4 className="text-sci-cyan font-display font-black uppercase tracking-wider">
                                  {selectedRoom === 'Bridge' && "함교 (BRIDGE)"}
                                  {selectedRoom === 'Medbay' && "의료실 (MEDBAY)"}
                                  {selectedRoom === 'Quarters' && "거주구역 (QUARTERS)"}
                                  {selectedRoom === 'Storage' && "창고 (STORAGE)"}
                                  {selectedRoom === 'Engineering' && "기관실 (ENGINEERING)"}
                                </h4>
                                <p className="text-[8px] font-mono text-sci-cyan/50 uppercase">구역 상태: 정상 작동 중</p>
                              </div>
                              <button onClick={() => setSelectedRoom(null)} className="text-sci-cyan/40 hover:text-sci-cyan">
                                <LogOut className="w-3 h-3 rotate-45" />
                              </button>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-[10px] font-mono text-sci-cyan/80 leading-relaxed">
                                {selectedRoom === 'Bridge' && "함선의 지휘 및 통제 센터입니다. 항법 시스템이 정상 작동 중입니다."}
                                {selectedRoom === 'Medbay' && "대원들의 건강 상태 모니터링 및 치료를 위한 의료 시설입니다."}
                                {selectedRoom === 'Quarters' && "대원들이 휴식을 취하고 여가를 즐기는 생활 공간입니다."}
                                {selectedRoom === 'Storage' && "주요 화물 보관 및 자원 관리 구역입니다."}
                                {selectedRoom === 'Engineering' && "원자로 코어 및 추진 시스템 유지보수 구역입니다."}
                              </p>
                              
                              <div className="pt-2 border-t border-sci-cyan/10">
                                <p className="text-[9px] font-display uppercase text-sci-cyan/40 mb-1">현재 인원:</p>
                                <div className="flex flex-wrap gap-1">
                                  {characters.filter(c => !c.isDead).filter(c => {
                                    const seed = c.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                    const roomNames = ['Bridge', 'Medbay', 'Quarters', 'Storage', 'Engineering'];
                                    return roomNames[seed % roomNames.length] === selectedRoom;
                                  }).length > 0 ? (
                                    characters.filter(c => !c.isDead).filter(c => {
                                      const seed = c.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                      const roomNames = ['Bridge', 'Medbay', 'Quarters', 'Storage', 'Engineering'];
                                      return roomNames[seed % roomNames.length] === selectedRoom;
                                    }).map(c => (
                                      <span key={c.id} className="text-[9px] px-1.5 py-0.5 bg-sci-cyan/20 text-sci-cyan sci-border border-sci-cyan/30">
                                        {c.name}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[9px] text-sci-cyan/30 italic">No personnel detected</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Ship SVG Map */}
                      <svg viewBox="0 0 1000 500" className="w-full h-full relative z-10 drop-shadow-[0_0_15px_rgba(0,255,255,0.1)]">
                        <defs>
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          <linearGradient id="hullGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--color-sci-cyan)" stopOpacity="0.1" />
                            <stop offset="50%" stopColor="var(--color-sci-cyan)" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="var(--color-sci-cyan)" stopOpacity="0.1" />
                          </linearGradient>
                        </defs>
                        
                        {/* Ship Hull - More detailed */}
                        <path d="M50,250 L150,50 L850,50 L950,250 L850,450 L150,450 Z" fill="url(#hullGradient)" stroke="var(--color-sci-cyan)" strokeWidth="3" opacity="0.4" />
                        <path d="M160,60 L840,60 L930,250 L840,440 L160,440 L70,250 Z" fill="none" stroke="var(--color-sci-cyan)" strokeWidth="1" opacity="0.2" />
                        
                        {/* Internal Corridors */}
                        <line x1="150" y1="250" x2="850" y2="250" stroke="var(--color-sci-cyan)" strokeWidth="1" opacity="0.1" strokeDasharray="5,5" />
                        <line x1="400" y1="50" x2="400" y2="450" stroke="var(--color-sci-cyan)" strokeWidth="1" opacity="0.1" strokeDasharray="5,5" />
                        <line x1="600" y1="50" x2="600" y2="450" stroke="var(--color-sci-cyan)" strokeWidth="1" opacity="0.1" strokeDasharray="5,5" />

                        {/* Rooms */}
                        <g className="rooms cursor-pointer">
                          {/* Bridge */}
                          <g onClick={() => setSelectedRoom('Bridge')} className="group/room">
                            <rect x="800" y="150" width="120" height="200" fill="var(--color-sci-cyan)" fillOpacity={selectedRoom === 'Bridge' ? "0.2" : "0.08"} stroke="var(--color-sci-cyan)" strokeWidth={selectedRoom === 'Bridge' ? "3" : "2"} className="transition-all" />
                            <text x="860" y="255" textAnchor="middle" fill="var(--color-sci-cyan)" fontSize="14" className={`font-mono font-black tracking-widest transition-opacity ${selectedRoom === 'Bridge' ? 'opacity-100' : 'opacity-60'}`}>BRIDGE</text>
                          </g>
                          
                          {/* Medbay */}
                          <g onClick={() => setSelectedRoom('Medbay')} className="group/room">
                            <rect x="580" y="80" width="180" height="120" fill="var(--color-sci-cyan)" fillOpacity={selectedRoom === 'Medbay' ? "0.2" : "0.08"} stroke="var(--color-sci-cyan)" strokeWidth={selectedRoom === 'Medbay' ? "3" : "2"} className="transition-all" />
                            <text x="670" y="145" textAnchor="middle" fill="var(--color-sci-cyan)" fontSize="14" className={`font-mono font-black tracking-widest transition-opacity ${selectedRoom === 'Medbay' ? 'opacity-100' : 'opacity-60'}`}>MEDBAY</text>
                          </g>
                          
                          {/* Quarters */}
                          <g onClick={() => setSelectedRoom('Quarters')} className="group/room">
                            <rect x="580" y="300" width="180" height="120" fill="var(--color-sci-cyan)" fillOpacity={selectedRoom === 'Quarters' ? "0.2" : "0.08"} stroke="var(--color-sci-cyan)" strokeWidth={selectedRoom === 'Quarters' ? "3" : "2"} className="transition-all" />
                            <text x="670" y="365" textAnchor="middle" fill="var(--color-sci-cyan)" fontSize="14" className={`font-mono font-black tracking-widest transition-opacity ${selectedRoom === 'Quarters' ? 'opacity-100' : 'opacity-60'}`}>QUARTERS</text>
                          </g>
                          
                          {/* Storage */}
                          <g onClick={() => setSelectedRoom('Storage')} className="group/room">
                            <rect x="300" y="80" width="240" height="340" fill="var(--color-sci-cyan)" fillOpacity={selectedRoom === 'Storage' ? "0.2" : "0.08"} stroke="var(--color-sci-cyan)" strokeWidth={selectedRoom === 'Storage' ? "3" : "2"} className="transition-all" />
                            <text x="420" y="255" textAnchor="middle" fill="var(--color-sci-cyan)" fontSize="14" className={`font-mono font-black tracking-widest transition-opacity ${selectedRoom === 'Storage' ? 'opacity-100' : 'opacity-60'}`}>STORAGE</text>
                          </g>
                          
                          {/* Engineering */}
                          <g onClick={() => setSelectedRoom('Engineering')} className="group/room">
                            <rect x="80" y="150" width="180" height="200" fill="var(--color-sci-cyan)" fillOpacity={selectedRoom === 'Engineering' ? "0.2" : "0.08"} stroke="var(--color-sci-cyan)" strokeWidth={selectedRoom === 'Engineering' ? "3" : "2"} className="transition-all" />
                            <text x="170" y="255" textAnchor="middle" fill="var(--color-sci-cyan)" fontSize="14" className={`font-mono font-black tracking-widest transition-opacity ${selectedRoom === 'Engineering' ? 'opacity-100' : 'opacity-60'}`}>ENGINEERING</text>
                          </g>

                          {/* Life Support */}
                          <circle cx="420" cy="250" r="30" fill="none" stroke="var(--color-sci-cyan)" strokeWidth="1" opacity="0.3" strokeDasharray="2,2" />
                        </g>

                        {/* Crew Markers */}
                        {characters.filter(c => !c.isDead).map((char, i) => {
                          const colors = [
                            '#00ffff', // Cyan
                            '#ff00ff', // Magenta
                            '#ffff00', // Yellow
                            '#00ff00', // Green
                            '#ff4444', // Red
                            '#ff8800', // Orange
                            '#8844ff', // Purple
                            '#ffffff'  // White
                          ];
                          const charColor = colors[i % colors.length];
                          
                          const seed = char.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                          const rooms = [
                            { x: 860, y: 250 }, // Bridge
                            { x: 670, y: 140 }, // Medbay
                            { x: 670, y: 360 }, // Quarters
                            { x: 420, y: 250 }, // Storage
                            { x: 170, y: 250 }  // Engineering
                          ];
                          const pos = rooms[seed % rooms.length];
                          const offset = (seed % 60) - 30;
                          
                          return (
                            <motion.g 
                              key={char.id}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="crew-marker"
                            >
                              <circle 
                                cx={pos.x + offset} 
                                cy={pos.y + offset} 
                                r="12" 
                                fill={charColor} 
                                filter="url(#glow)" 
                                className="animate-pulse"
                              />
                              <circle 
                                cx={pos.x + offset} 
                                cy={pos.y + offset} 
                                r="16" 
                                fill="none" 
                                stroke={charColor} 
                                strokeWidth="1" 
                                opacity="0.3"
                              >
                                <animate attributeName="r" from="12" to="28" dur="2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
                              </circle>
                              <text 
                                x={pos.x + offset} 
                                y={pos.y + offset - 24} 
                                textAnchor="middle" 
                                fill={charColor} 
                                fontSize="18" 
                                className="font-mono font-black uppercase tracking-tighter drop-shadow-md"
                              >
                                {char.name}
                              </text>
                            </motion.g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* System Logs */}
                    <div className="sci-border bg-sci-bg p-4 space-y-3">
                      <div className="flex justify-between items-center border-b border-sci-border/20 pb-2">
                        <span className="text-[10px] text-sci-cyan font-bold uppercase tracking-widest">System Logs</span>
                        <span className="text-[10px] text-sci-ink/40 font-mono">SECURE CHANNEL // 0x4F2</span>
                      </div>
                      <div className="space-y-1 font-mono text-[10px]">
                        <p className="text-sci-cyan/60">[08:42] INTERNAL SENSORS CALIBRATED</p>
                        <p className="text-sci-cyan/60">[09:15] CREW VITALS WITHIN NOMINAL RANGE</p>
                        <p className="text-sci-cyan/60">[10:02] HULL INTEGRITY SCAN COMPLETE: {integrity.toFixed(1)}%</p>
                        <p className="text-sci-cyan/60">[11:20] RESOURCE CONSUMPTION OPTIMIZED</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Resources & Inventory */}
                  <div className="space-y-6">
                    <div className="sci-border bg-sci-bg p-6 space-y-6">
                      <h3 className="text-xl font-display font-black text-white tracking-tight uppercase border-b border-sci-border/30 pb-4">Inventory & Supplies</h3>
                      
                      <div className="space-y-6">
                        {Object.entries(resources).map(([key, val]) => {
                          const value = val as number;
                          return (
                            <div key={key} className="space-y-2">
                              <div className="flex justify-between items-end">
                                <span className="text-[10px] uppercase font-bold text-sci-cyan tracking-widest">{key}</span>
                                <span className="text-lg font-display font-bold text-white">{value.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 bg-white/5 sci-border border-white/10 overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${value}%` }}
                                  className={`h-full ${value < 20 ? 'bg-sci-red' : value < 40 ? 'bg-sci-orange' : 'bg-sci-cyan'}`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-6 border-t border-sci-border/30 space-y-4">
                        <div className="text-[10px] uppercase font-black text-sci-ink/40 tracking-widest">Critical Assets</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/5 p-3 sci-border border-white/10 flex flex-col gap-1">
                            <span className="text-[8px] text-sci-cyan font-bold uppercase">Med-Kits</span>
                            <span className="text-xl font-display font-bold">04</span>
                          </div>
                          <div className="bg-white/5 p-3 sci-border border-white/10 flex flex-col gap-1">
                            <span className="text-[8px] text-sci-cyan font-bold uppercase">Repair Tools</span>
                            <span className="text-xl font-display font-bold">02</span>
                          </div>
                          <div className="bg-white/5 p-3 sci-border border-white/10 flex flex-col gap-1">
                            <span className="text-[8px] text-sci-cyan font-bold uppercase">Cryo-Pods</span>
                            <span className="text-xl font-display font-bold">08</span>
                          </div>
                          <div className="bg-white/5 p-3 sci-border border-white/10 flex flex-col gap-1">
                            <span className="text-[8px] text-sci-cyan font-bold uppercase">Escape Pods</span>
                            <span className="text-xl font-display font-bold">02</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vessel Info */}
                    <div className="sci-border bg-sci-cyan/5 p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-sci-cyan" />
                        <span className="text-sm font-display font-bold uppercase tracking-widest">Vessel Status</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="opacity-40 uppercase">Designation</span>
                          <span className="text-sci-cyan font-bold">DRIFTER-01</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="opacity-40 uppercase">Class</span>
                          <span className="text-sci-cyan font-bold">EXPLORER-IV</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="opacity-40 uppercase">Mission Day</span>
                          <span className="text-sci-cyan font-bold">{currentDay} / 60</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-sci-border/30 grid grid-cols-2 gap-2">
                        <button 
                          onClick={saveGame}
                          className="py-2 text-[9px] uppercase font-bold border border-sci-cyan/30 text-sci-cyan hover:bg-sci-cyan/10 transition-all"
                        >
                          Manual Save
                        </button>
                        <button 
                          onClick={loadGame}
                          className="py-2 text-[9px] uppercase font-bold border border-sci-cyan/30 text-sci-cyan hover:bg-sci-cyan/10 transition-all"
                        >
                          Manual Load
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : view === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-4"
            >
              <div className="w-full max-w-4xl space-y-24">
                <div className="flex flex-col items-center space-y-8">
                  <div className="relative p-12 w-full max-w-lg glass-panel">
                    <div className="corner-marker corner-tl" />
                    <div className="corner-marker corner-tr" />
                    <div className="corner-marker corner-bl" />
                    <div className="corner-marker corner-br" />
                    
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-sci-ink/40 font-bold text-center">Authentication Required</p>
                        <h2 className="text-6xl font-display font-black tracking-tighter text-sci-cyan text-center glitch-text">DRIFTER</h2>
                      </div>

                      <div className="space-y-4">
                        <SciFiInput 
                          label="Operator ID" 
                          value={nickname} 
                          onChange={(e: any) => setNickname(e.target.value)} 
                          placeholder="ENTER ID..."
                        />
                        <SciFiInput 
                          label="Access Code" 
                          type="password" 
                          value={code} 
                          onChange={(e: any) => setCode(e.target.value)} 
                          placeholder="••••••••"
                        />
                      </div>

                      <div className="flex gap-4">
                        {localStorage.getItem('drifter_save') && (
                          <button 
                            onClick={loadGame}
                            className="flex-1 py-4 text-[10px] uppercase tracking-widest font-bold border border-sci-cyan text-sci-cyan hover:bg-sci-cyan/10 transition-all"
                          >
                            Resume Journey
                          </button>
                        )}
                        <button 
                          onClick={handleLogin}
                          className="flex-1 py-4 text-[10px] uppercase tracking-widest font-bold bg-sci-cyan text-sci-bg hover:bg-white transition-all"
                        >
                          Launch Campaign
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="w-full max-w-lg space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="text-[10px] uppercase tracking-widest font-bold text-sci-cyan">Status</div>
                      <div className="flex-1 h-px bg-sci-border" />
                      <div className="text-[10px] font-mono text-sci-ink/40">00:54</div>
                      <div className="text-[10px] uppercase tracking-widest font-bold text-sci-green">Sound On</div>
                    </div>
                    <div className="h-0.5 w-full bg-sci-border relative overflow-hidden">
                      <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                        className="absolute inset-0 w-1/3 bg-sci-cyan"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-sci-border pt-12">
                  {[
                    { city: 'PARIS', addr: '3 PL. DES VICTOIRES', zip: '75001 PARIS', country: 'FRANCE' },
                    { city: 'NEW YORK', addr: '120 BROADWAY', zip: '10271 NY', country: 'USA' },
                    { city: 'TOKYO', addr: '1-1-1 MARUNOUCHI', zip: '100-0005', country: 'JAPAN' }
                  ].map((loc, i) => (
                    <div key={i} className="space-y-4">
                      <div className="text-[10px] font-mono text-sci-ink/40">04:00:34</div>
                      <div className="space-y-1">
                        <div className="text-xs font-bold tracking-widest">{loc.city}</div>
                        <div className="text-[10px] font-mono text-sci-ink/40 leading-tight">
                          {loc.addr}<br />
                          {loc.zip}<br />
                          {loc.country}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'registration' && (
            <motion.div
              key="registration"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 p-6 flex flex-col md:flex-row gap-8 overflow-y-auto"
            >
              {/* Left: Form */}
              <div className="w-full md:w-1/3 space-y-6">
                <div className="sci-border p-6 bg-sci-paper space-y-6">
                  <div className="flex items-center gap-2 border-b-2 border-sci-border pb-2">
                    <Dna className="text-sci-orange w-5 h-5" />
                    <h3 className="font-display text-sci-orange uppercase tracking-wider">Crew Registration</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <SciFiInput 
                      label="이름" 
                      value={newChar.name} 
                      onChange={(e: any) => setNewChar({...newChar, name: e.target.value})} 
                    />

                    <SciFiInput 
                      label="나이" 
                      type="number"
                      value={newChar.age} 
                      onChange={(e: any) => setNewChar({...newChar, age: parseInt(e.target.value) || 0})} 
                    />
                    
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-sci-ink/60 tracking-tighter font-display">성별</label>
                      <div className="flex gap-2">
                        {['남성', '여성', '기타'].map(g => (
                          <button
                            key={g}
                            onClick={() => {
                              setNewChar({...newChar, gender: g});
                              playSound(440, 'sine', 0.05);
                            }}
                            className={`flex-1 py-1 text-xs border-2 ${newChar.gender === g ? 'bg-sci-cyan/20 border-sci-cyan text-sci-cyan' : 'border-sci-border text-sci-ink/40'} font-display font-bold`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-sci-ink/60 tracking-tighter font-display">MBTI</label>
                      <select 
                        value={newChar.mbti}
                        onChange={(e) => setNewChar({...newChar, mbti: e.target.value})}
                        className="w-full bg-white/40 border-2 border-sci-border p-2 px-4 text-sci-ink text-[19px] focus:outline-none focus:bg-white/60 transition-all font-mono"
                      >
                        {MBTI_LIST.map(m => <option key={m} value={m} className="bg-sci-bg">{m}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-sci-ink/60 tracking-tighter font-display">프로필 이미지</label>
                      <label className={`flex flex-col items-center justify-center w-full min-h-[100px] border-2 border-dashed transition-all cursor-pointer overflow-hidden ${newChar.image ? 'border-sci-cyan bg-sci-cyan/5' : 'border-sci-border bg-white/40 hover:border-sci-cyan'}`}>
                        {newChar.image ? (
                          <div className="relative w-full h-full flex flex-col items-center p-4">
                            <img src={newChar.image} alt="Preview" className="w-20 h-20 object-cover sci-border mb-2" />
                            <span className="text-[10px] text-sci-cyan font-bold uppercase">Image Uploaded</span>
                          </div>
                        ) : (
                          <>
                            <Camera className="w-6 h-6 text-sci-ink/40 mb-2" />
                            <span className="text-[10px] text-sci-ink/40 font-bold uppercase">Click to Upload</span>
                          </>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setNewChar({...newChar, image: reader.result as string});
                                playSound(880, 'sine', 0.1);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase text-sci-ink/60 tracking-tighter font-display">성격 키워드</label>
                      {newChar.keywords.map((k, i) => (
                        <SciFiInput 
                          key={i}
                          value={k} 
                          onChange={(e: any) => {
                            const next = [...newChar.keywords];
                            next[i] = e.target.value;
                            setNewChar({...newChar, keywords: next});
                          }} 
                          placeholder={`키워드 ${i+1}...`}
                        />
                      ))}
                    </div>
                  </div>

                  <SciFiButton 
                    variant="orange" 
                    className="w-full" 
                    onClick={addCharacter}
                    disabled={characters.length >= 6 || !newChar.name}
                  >
                    <Plus className="inline w-4 h-4 mr-2" /> Register Member
                  </SciFiButton>
                </div>

                <div className="sci-border p-4 bg-sci-red/5 border-sci-red/20">
                  <div className="flex items-center gap-2 text-sci-red mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-[10px] font-display uppercase font-bold">Mission Critical</span>
                  </div>
                  <p className="text-[10px] text-sci-red/60 leading-relaxed font-mono">
                    A minimum of 1 and maximum of 6 crew members are required for the DRIFTER protocol. 
                    Ensure all biometric data is accurate before deployment.
                  </p>
                </div>
              </div>

              {/* Right: List */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <h3 className="font-display text-xl text-sci-cyan uppercase">Manifest</h3>
                    <div className="text-[10px] text-sci-ink/40 uppercase font-bold">Crew Count: {characters.length} / 6</div>
                  </div>
                  <SciFiButton 
                    variant="green" 
                    disabled={characters.length === 0}
                    onClick={startSimulation}
                  >
                    Launch Simulation <Play className="inline w-4 h-4 ml-2" />
                  </SciFiButton>
                </div>

                <div className="flex-1 sci-border bg-white/40 p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar content-start">
                  {characters.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center opacity-20 py-20">
                      <User className="w-20 h-20 mb-4" />
                      <p className="font-display uppercase tracking-widest">No Crew Registered</p>
                    </div>
                  ) : (
                    characters.map(char => (
                      <div key={char.id} className="relative group min-h-[260px]">
                        <CharacterCard character={char} />
                        <button 
                          onClick={() => removeCharacter(char.id)}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-sci-red text-white flex items-center justify-center rounded-none opacity-0 group-hover:opacity-100 transition-opacity z-10 sci-border"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'simulation' && (
            <motion.div
              key="simulation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex-1 flex flex-col md:flex-row overflow-hidden ${isGlowing ? 'animate-glow' : ''}`}
            >
              {/* Left: Simulation Log */}
              <div className="flex-1 flex flex-col p-6 border-r-2 border-sci-border bg-white/20">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <div className="sci-border px-4 py-1 bg-white/60">
                      <span className="text-xs text-sci-ink/60 font-display uppercase mr-2">Day</span>
                      <span className="text-2xl font-display text-sci-cyan">{currentDay}</span>
                    </div>
                    <div className="h-8 w-px bg-sci-border" />
                    <div className="text-[10px] font-display uppercase text-sci-ink/40 font-bold">
                      Destination: Earth<br />
                      ETA: {60 - currentDay} Days
                    </div>
                  </div>
                  
                  <SciFiButton 
                    variant="cyan" 
                    onClick={nextDay} 
                    disabled={isSimulating || currentDay >= 60}
                    className="relative overflow-hidden"
                  >
                    {isSimulating ? (
                      <span className="flex items-center gap-2">
                        <Activity className="w-4 h-4 animate-pulse" /> Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Next Cycle <ChevronRight className="w-4 h-4" />
                      </span>
                    )}
                  </SciFiButton>
                </div>

                <div ref={logContainerRef} className="flex-1 sci-border bg-sci-paper p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8">
                  {isSimulating && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 text-sci-cyan font-mono text-sm animate-pulse"
                    >
                      <Activity className="w-4 h-4" />
                      <span>GENERATING NEXT CYCLE DATA...</span>
                    </motion.div>
                  )}
                  {[...logs].reverse().map((log, i) => (
                    <DayLogDisplay 
                      key={log.day} 
                      log={log} 
                      characters={characters} 
                      isLatest={i === 0} 
                    />
                  ))}
                </div>
              </div>

              {/* Right: Crew Status */}
              <div className="w-full md:w-[350px] p-6 flex flex-col gap-6 bg-sci-paper overflow-y-auto custom-scrollbar border-l-2 border-sci-border">
                <div className="flex gap-2 mb-2">
                  <SciFiButton variant="cyan" className="flex-1 py-1 text-[10px]" onClick={saveGame}>Save Progress</SciFiButton>
                  <SciFiButton variant="orange" className="flex-1 py-1 text-[10px]" onClick={loadGame}>Load Progress</SciFiButton>
                </div>

                <motion.div 
                  key="crew"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b-2 border-sci-border pb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="text-sci-green w-5 h-5" />
                      <h3 className="font-display text-sci-green uppercase tracking-wider">Crew Status</h3>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {characters.map(char => {
                      const isInteracting = logs.length > 0 && 
                        logs[logs.length - 1].dialogues?.some(d => d.characterId === char.id);
                      return (
                        <CharacterCard 
                          key={char.id} 
                          character={char} 
                          isInteracting={isInteracting && !isSimulating} 
                        />
                      );
                    })}
                  </div>
                </motion.div>

                <div className="mt-auto pt-6 border-t-2 border-sci-border space-y-4">
                  <div className="flex justify-between text-[10px] font-display uppercase text-sci-ink/40 font-bold">
                    <div className="flex items-center gap-1">
                      <Smile className={`w-3 h-3 ${mood > 70 ? 'text-sci-green' : mood > 40 ? 'text-sci-orange' : 'text-sci-red'}`} />
                      <span>Crew Mood</span>
                    </div>
                    <span>{mood}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/40 sci-border">
                    <div 
                      className={`h-full transition-all duration-500 ${mood > 70 ? 'bg-sci-green' : mood > 40 ? 'bg-sci-orange' : 'bg-sci-red'}`} 
                      style={{ width: `${mood}%` }} 
                    />
                  </div>

                  <div className="flex justify-between text-[10px] font-display uppercase text-sci-ink/40 font-bold">
                    <span>System Integrity</span>
                    <span>{integrity.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/40 sci-border">
                    <div className="h-full bg-sci-cyan transition-all duration-500" style={{ width: `${integrity}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-display uppercase text-sci-ink/40 font-bold">
                    <span>산소 잔량</span>
                    <span>{resources.oxygen.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/40 sci-border">
                    <div className="h-full bg-sci-cyan transition-all duration-1000" style={{ width: `${resources.oxygen}%` }} />
                  </div>

                  <div className="flex justify-between text-[10px] font-display uppercase text-sci-ink/40 font-bold">
                    <span>식량 비축량</span>
                    <span>{resources.food.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/40 sci-border">
                    <div className="h-full bg-sci-orange transition-all duration-1000" style={{ width: `${resources.food}%` }} />
                  </div>

                  <div className="flex justify-between text-[10px] font-display uppercase text-sci-ink/40 font-bold">
                    <span>식수 비축량</span>
                    <span>{resources.water.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/40 sci-border">
                    <div className="h-full bg-sci-cyan transition-all duration-1000" style={{ width: `${resources.water}%` }} />
                  </div>

                  <div className="flex justify-between text-[10px] font-display uppercase text-sci-ink/40 font-bold">
                    <span>연료 잔량</span>
                    <span>{resources.fuel.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/40 sci-border">
                    <div className="h-full bg-sci-red transition-all duration-1000" style={{ width: `${resources.fuel}%` }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Decoration */}
      <footer className="h-8 border-t-2 border-sci-border bg-sci-paper flex items-center px-4 justify-between text-[8px] font-mono text-sci-ink/30 uppercase tracking-[0.2em] z-20 font-bold">
        <div className="flex gap-4">
          <span>Terminal: AIS-09</span>
          <span>Status: Online</span>
        </div>
        <div className="flex gap-4">
          <span>Lat: 37.7749° N</span>
          <span>Long: 122.4194° W</span>
          <span>© 2026 Drifter Systems</span>
        </div>
      </footer>
    </div>
  );
}
