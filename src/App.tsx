import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Chrome, 
  Facebook, 
  Apple, 
  ArrowRight, 
  LogOut, 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  Bell, 
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Cpu,
  Zap,
  Brain,
  Search as SearchIcon,
  Calculator,
  Upload,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Send,
  History as HistoryIcon,
  Bookmark,
  ChevronRight,
  Maximize2,
  Camera,
  Atom,
  Binary,
  FlaskConical,
  Plus,
  Sparkles,
  Mic,
  PenTool,
  Copy,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Moon,
  Sun,
  Shield,
  Globe,
  Trash2,
  Scan,
  Flashlight,
  FlipHorizontal,
  Check,
  RefreshCw,
  Minimize2,
  Maximize2 as Maximize,
  HardDrive,
  Cloud,
  AtSign,
  Info,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { 
  auth, 
  db,
  signInWithGoogle, 
  signInWithFacebook,
  signInWithApple,
  signUpWithEmail,
  loginWithEmail,
  resetPassword,
  logout, 
  onAuthStateChanged, 
  FirebaseUser,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection
} from './lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer 
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { LatexEditor } from './components/LatexEditor';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// --- Types ---

type AIMode = 'fast' | 'accurate' | 'deep';
type Theme = 'dark' | 'light' | 'neon';

interface ChatSession {
  id: string;
  userId: string;
  title: string;
  timestamp: number;
  lastUpdated: number;
  tag: string;
  history: { 
    role: 'user' | 'model', 
    parts: { text: string }[],
    detection?: string,
    detectedCategory?: string,
    status?: 'success' | 'safe_redirect' | 'restricted' | 'fallback',
    summary?: string,
    explanation?: string,
    steps?: string,
    keyPoints?: string,
    answerOnly?: string,
    examMarks?: string,
    simplify?: string,
    deepDive?: string,
    isExpanded?: boolean,
    expandedType?: 'steps' | 'explain' | 'simplify' | 'deep',
    given?: string,
    required?: string,
    method?: string,
    working?: string,
    methodNote?: string,
    aiConfirmation?: string,
    graphData?: any
  }[];
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'ai' | 'alert' | 'insight';
  timestamp: number;
  read: boolean;
}

interface PrivacySettings {
  saveHistory: boolean;
  aiMemoryMode: boolean;
  dataStorageMode: 'local' | 'cloud';
  language: string;
}

interface UserProfile {
  fullName: string;
  username: string;
  avatar: string | null;
  email: string;
  memberSince: string;
  planType: 'Free' | 'Pro' | 'Premium';
  bio: string;
}

// --- Utils ---

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: '中文 (简体)', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
];

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    workspace: 'Workspace',
    history: 'History',
    privacy: 'Privacy',
    notifications: 'Notifications',
    settings: 'Settings',
    newChat: 'New Chat Session',
    online: 'Online',
    processing: 'Processing',
    error: 'Error',
    askNeuroask: 'Ask NEUROASK',
    saveHistory: 'Save Chat History',
    aiMemory: 'AI Memory Mode',
    dataStorage: 'Data Storage Mode',
    language: 'Language',
    appearance: 'Appearance',
    deleteAll: 'Delete All Data',
    syncStatus: 'Sync Status',
    synced: 'Synced',
    syncing: 'Syncing...',
    offline: 'Offline',
    pending: 'Pending sync',
  },
  sw: {
    workspace: 'Eneo la Kazi',
    history: 'Historia',
    privacy: 'Faragha',
    notifications: 'Arifa',
    settings: 'Mipangilio',
    newChat: 'Kikao Kipya cha Soga',
    online: 'Iko Mtandaoni',
    processing: 'Inachakata',
    error: 'Hitilafu',
    askNeuroask: 'Uliza NEUROASK',
    saveHistory: 'Hifadhi Historia ya Soga',
    aiMemory: 'Hali ya Kumbukumbu ya AI',
    dataStorage: 'Hali ya Uhifadhi wa Data',
    language: 'Lugha',
    appearance: 'Muonekano',
    deleteAll: 'Futa Data Zote',
    syncStatus: 'Hali ya Usawazishaji',
    synced: 'Imesawazishwa',
    syncing: 'Inasawazisha...',
    offline: 'Nje ya Mtandao',
    pending: 'Inasubiri usawazishaji',
  },
  // Add more as needed, but for now focus on core logic
};

const sanitizeData = (obj: any) => {
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      sanitized[key] = value.map(v => typeof v === 'object' ? sanitizeData(v) : (v ?? ""));
    } else if (value !== null && typeof value === 'object') {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value ?? "";
    }
  }
  return sanitized;
};

// --- Components ---

const Footer = ({ onLogin, onSignup, onAbout, onTerms, onPrivacy }: { 
  onLogin: () => void, 
  onSignup: () => void, 
  onAbout: () => void,
  onTerms: () => void,
  onPrivacy: () => void
}) => (
  <footer className="w-full bg-surface border-t border-on-surface/5 mt-20">
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
        {/* About Section */}
        <div id="about-section" className="space-y-6 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-headline font-bold tracking-tight">NEUROASK</span>
          </div>
          <p className="text-sm text-on-surface/60 leading-relaxed max-w-xs mx-auto md:mx-0">
            NEUROASK is a smart platform designed to help users learn, solve problems, and manage digital tasks efficiently. It provides a simple and fast experience for all users.
          </p>
        </div>

        {/* Quick Links */}
        <div className="space-y-6 text-center md:text-left">
          <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-on-surface/40">Quick Links</h4>
          <ul className="space-y-4">
            <li><button onClick={onLogin} className="text-sm text-on-surface/60 hover:text-primary transition-colors">Login</button></li>
            <li><button onClick={onSignup} className="text-sm text-on-surface/60 hover:text-primary transition-colors">Sign Up</button></li>
            <li><button onClick={onAbout} className="text-sm text-on-surface/60 hover:text-primary transition-colors">About</button></li>
          </ul>
        </div>

        {/* Legal Section */}
        <div className="space-y-6 text-center md:text-left">
          <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-on-surface/40">Legal</h4>
          <ul className="space-y-4">
            <li><button onClick={onTerms} className="text-sm text-on-surface/60 hover:text-primary transition-colors">Terms & Conditions</button></li>
            <li><button onClick={onPrivacy} className="text-sm text-on-surface/60 hover:text-primary transition-colors">Privacy Policy</button></li>
          </ul>
        </div>

        {/* Contact Section */}
        <div className="space-y-6 text-center md:text-left">
          <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-on-surface/40">Contact</h4>
          <div className="space-y-4">
            <p className="text-sm text-on-surface/60">Need support? Reach out to us anytime.</p>
            <a 
              href="mailto:nilmahrandrew@gmail.com?subject=NEUROASK%20Support%20Request" 
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:opacity-80 transition-opacity"
            >
              <Mail className="w-4 h-4" />
              nilmahrandrew@gmail.com
            </a>
          </div>
        </div>
      </div>

      <div className="mt-20 pt-8 border-t border-on-surface/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-xs text-on-surface/40">
          © {new Date().getFullYear()} NEUROASK Intelligence. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">System Operational</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50, x: '-50%' }}
    animate={{ opacity: 1, y: 0, x: '-50%' }}
    exit={{ opacity: 0, y: 50, x: '-50%' }}
    className={cn(
      "fixed bottom-8 left-1/2 z-[300] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-xl",
      type === 'success' ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-red-500/20 border-red-500/50 text-red-400"
    )}
  >
    {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
    <span className="text-sm font-medium">{message}</span>
    <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
      <X className="w-4 h-4" />
    </button>
  </motion.div>
);

const InputField = ({ icon: Icon, type, placeholder, value, onChange, showPasswordToggle }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="relative group">
      <input
        type={isPassword ? (showPassword ? 'text' : 'password') : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        className="w-full glass-input rounded-2xl py-4 px-5 pl-12 text-sm text-on-surface placeholder:text-on-surface/30 outline-none focus:border-primary/50"
      />
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface/40 group-focus-within:text-primary transition-colors" />
      {isPassword && showPasswordToggle && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface/40 hover:text-on-surface transition-colors"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
};

// --- Error Boundary ---

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Something went wrong. Please refresh the page.";
      try {
        const firestoreError = JSON.parse(this.state.error.message);
        if (firestoreError.error) {
          displayMessage = `Database Error: ${firestoreError.error}. Please check your permissions.`;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-center">
          <div className="glass-card p-8 rounded-3xl max-w-md w-full space-y-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-headline font-bold">System Anomaly</h1>
            <p className="text-on-surface/60">{displayMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full btn-gradient py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Main App ---

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

interface StackSession {
  id: string;
  question: string;
  response: any | null;
  status: 'idle' | 'solving' | 'completed' | 'fallback';
  timestamp: number;
  isExpanded?: boolean;
  expandedType?: 'steps' | 'explain' | 'simplify' | 'deep';
}

interface UserMemory {
  topics: string[];
  lastSolved: string[];
  preferences: {
    solutionStyle: string;
    uiMode: string;
  };
  patterns: string[];
}

function AppContent() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({ 
    fullName: '',
    username: '', 
    email: '', 
    password: '',
    confirmPassword: ''
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'workspace' | 'history' | 'notifications' | 'privacy' | 'latex'>('workspace');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [activeModal, setActiveModal] = useState<'file' | 'image' | 'camera' | null>(null);
  const [isProcessingInput, setIsProcessingInput] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [inputPreview, setInputPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [flashOn, setFlashOn] = useState(false);
  const [isEditingExtractedText, setIsEditingExtractedText] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'pending'>('synced');
  const [theme, setTheme] = useState<Theme>('dark');
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    saveHistory: true,
    aiMemoryMode: true,
    dataStorageMode: 'cloud',
    language: 'en'
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({
    fullName: '',
    username: '',
    avatar: null,
    email: '',
    memberSince: new Date().toLocaleDateString(),
    planType: 'Free',
    bio: ''
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setToast({ message: 'Avatar must be less than 2MB.', type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      setToast({ message: 'Profile updated successfully.', type: 'success' });
      setShowProfile(false);
    } catch (error) {
      setToast({ message: 'Failed to update profile.', type: 'error' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // History & Notification Filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'system' | 'ai' | 'alert'>('all');
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Translation Helper
  const t = (key: string) => {
    return TRANSLATIONS[privacy.language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  // Sync Status Logic
  useEffect(() => {
    const handleOnline = () => setSyncStatus('synced');
    const handleOffline = () => setSyncStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Suppress benign Vite WebSocket errors that can occur in sandboxed environments
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || String(event.reason || '');
      if (reason.includes('WebSocket') || reason.includes('vite')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handleError = (event: ErrorEvent) => {
      const message = event.message || '';
      if (message.includes('WebSocket') || message.includes('vite')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('error', handleError);

    if (!navigator.onLine) setSyncStatus('offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Theme Logic
  useEffect(() => {
    const savedTheme = localStorage.getItem('neuroask-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('neuroask-theme', theme);
  }, [theme]);

  // AI & Chat State
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<{ 
    role: 'user' | 'model', 
    parts: { text: string }[],
    detection?: string,
    detectedCategory?: string,
    status?: 'success' | 'safe_redirect' | 'restricted' | 'fallback',
    summary?: string,
    explanation?: string,
    steps?: string,
    keyPoints?: string,
    answerOnly?: string,
    examMarks?: string,
    simplify?: string,
    deepDive?: string,
    isExpanded?: boolean,
    expandedType?: 'steps' | 'explain' | 'simplify' | 'deep',
    given?: string,
    required?: string,
    method?: string,
    working?: string,
    methodNote?: string,
    aiConfirmation?: string,
    graphData?: any
  }[]>([]);
  
  // Elite Stack State
  const [stackSessions, setStackSessions] = useState<StackSession[]>([]);
  const [userMemory, setUserMemory] = useState<UserMemory>({
    topics: [],
    lastSolved: [],
    preferences: { solutionStyle: 'step-by-step', uiMode: 'elite-stack' },
    patterns: []
  });

  const [chatInput, setChatInput] = useState('');
  const [methodOverride, setMethodOverride] = useState('');
  const [detailLevel, setDetailLevel] = useState<'Strict' | 'Teaching' | 'Speed'>('Speed');
  const [aiMode, setAiMode] = useState<AIMode>('accurate');
  const [isThinking, setIsThinking] = useState(false);
  const [isBillingDepleted, setIsBillingDepleted] = useState(false);
  const [aiStatus, setAiStatus] = useState<'active' | 'processing' | 'error'>('active');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'System Online', message: 'NEUROASK AI Core v4.2 is fully operational.', type: 'system', timestamp: Date.now(), read: false },
    { id: '2', title: 'Login Successful', message: 'Welcome back, Operator.', type: 'system', timestamp: Date.now() - 10000, read: true },
    { id: '3', title: 'Model Improvement', message: 'Gemini 3.1 Pro optimization complete.', type: 'ai', timestamp: Date.now() - 3600000, read: false },
    { id: '4', title: 'Security Alert', message: 'New device recognized in London, UK.', type: 'alert', timestamp: Date.now() - 86400000, read: true }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    testFirestoreConnection();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => {
      unsubscribe();
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Load Sessions
  useEffect(() => {
    if (!user) {
      setSessions([]);
      return;
    }

    if (privacy.dataStorageMode === 'cloud') {
      const q = query(
        collection(db, 'sessions'),
        where('userId', '==', user.uid),
        orderBy('lastUpdated', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loadedSessions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ChatSession[];
        setSessions(loadedSessions);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'sessions');
      });

      return () => unsubscribe();
    } else {
      // Local Storage Mode
      const loadLocal = () => {
        const localSessions = JSON.parse(localStorage.getItem('neuroask-local-sessions') || '[]');
        setSessions(localSessions.sort((a: any, b: any) => b.lastUpdated - a.lastUpdated));
      };
      loadLocal();
      // Listen for local storage changes (in case of multiple tabs)
      window.addEventListener('storage', loadLocal);
      return () => window.removeEventListener('storage', loadLocal);
    }
  }, [user, privacy.dataStorageMode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isThinking]);

  // Auto-scroll to expanded content
  useEffect(() => {
    const lastMsg = chatHistory[chatHistory.length - 1];
    if (lastMsg?.isExpanded) {
      setTimeout(() => {
        const expandedElement = document.getElementById(`expanded-${chatHistory.length - 1}`);
        if (expandedElement) {
          expandedElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [chatHistory]);

  const handleSocialLogin = async (method: 'google' | 'facebook' | 'apple') => {
    setIsAuthenticating(true);
    try {
      if (method === 'google') await signInWithGoogle();
      if (method === 'facebook') await signInWithFacebook();
      if (method === 'apple') await signInWithApple();
      setToast({ message: `Successfully logged in with ${method}!`, type: 'success' });
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/popup-closed-by-user') {
        // Silent fail for user closing popup
        return;
      }
      if (error.code === 'auth/operation-not-allowed') {
        setToast({ 
          message: `${method} sign-in is not enabled. Please enable it in the Firebase Console.`, 
          type: 'error' 
        });
      } else {
        setToast({ message: error.message || 'Authentication failed.', type: 'error' });
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    try {
      if (authMode === 'signup') {
        if (!formData.fullName) throw new Error('Full Name is required');
        if (!formData.username) throw new Error('Username is required');
        if (formData.password.length < 8) throw new Error('Password must be at least 8 characters');
        if (formData.password !== formData.confirmPassword) throw new Error('Passwords do not match');
        if (!termsAccepted) throw new Error('You must accept the Terms & Conditions');
        
        await signUpWithEmail(formData.email, formData.password, formData.username);
        setToast({ message: 'Account created successfully!', type: 'success' });
      } else {
        if (!formData.email) throw new Error('Email is required');
        if (!formData.password) throw new Error('Password is required');
        await loginWithEmail(formData.email, formData.password);
        setToast({ message: 'Logged in successfully!', type: 'success' });
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/operation-not-allowed') {
        setToast({ 
          message: 'Email/Password sign-in is not enabled. Please enable it in the Firebase Console.', 
          type: 'error' 
        });
      } else {
        setToast({ message: error.message || 'Authentication failed.', type: 'error' });
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setToast({ message: 'Please enter your email address first.', type: 'error' });
      return;
    }
    setIsAuthenticating(true);
    try {
      await resetPassword(formData.email);
      setToast({ message: 'Password reset email sent! Check your inbox.', type: 'success' });
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/operation-not-allowed') {
        setToast({ 
          message: 'Password reset is not enabled. Please enable Email/Password in the Firebase Console.', 
          type: 'error' 
        });
      } else {
        setToast({ message: error.message || 'Failed to send reset email.', type: 'error' });
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const startNewChat = () => {
    setChatHistory([]);
    setStackSessions([]);
    setChatInput('');
    setCurrentChatId(null);
    setActiveTab('workspace');
  };

  const processMultimodalInput = async (file: File | string, type: 'file' | 'image') => {
    setIsProcessingInput(true);
    try {
      // For images, we can show a preview immediately
      if (type === 'image' && typeof file !== 'string') {
        const reader = new FileReader();
        reader.onloadend = () => setInputPreview(reader.result as string);
        reader.readAsDataURL(file);
      }

      const prompt = `You are a professional OCR and document analysis engine for NEUROASK.
      Your task is to extract all meaningful text, mathematical equations (in LaTeX), and specific questions from this input.
      
      RULES:
      - Ignore irrelevant background noise or UI elements.
      - Format mathematical equations using LaTeX.
      - If multiple questions are found, list them clearly.
      - Maintain the original structure as much as possible.
      - If it's a diagram, describe it briefly and extract any labels.`;
      
      let base64Data: string;
      let mimeType: string;

      if (typeof file === 'string') {
        // Base64 from camera
        base64Data = file.split(',')[1];
        mimeType = "image/jpeg";
      } else {
        // File upload
        base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        mimeType = file.type;
      }

      const result = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType
                }
              }
            ]
          }
        ]
      });

      const text = result.text || "";
      setIsBillingDepleted(false);
      setExtractedText(text);
    } catch (error: any) {
      console.error(error);
      const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
      if (errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('spending cap') || errorStr.includes('prepayment credits')) {
        setIsBillingDepleted(true);
        setToast({ 
          message: "Project spending cap exceeded or credits depleted. Please manage your billing at https://ai.studio/projects.", 
          type: 'error' 
        });
      } else {
        setToast({ message: "Failed to process input. Please try again.", type: 'error' });
      }
    } finally {
      setIsProcessingInput(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const type = file.type.startsWith('image/') ? 'image' : 'file';
      setActiveModal(type as any);
      processMultimodalInput(file, type);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      setIsCameraReady(true);
      setActiveModal('camera');
    } catch (error) {
      setToast({ message: "Camera access denied or not available.", type: 'error' });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraReady(false);
    setActiveModal(null);
  };

  const capturePhoto = () => {
    const video = document.getElementById('camera-video') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setInputPreview(dataUrl);
    stopCamera();
    setActiveModal('image'); // Switch to image preview modal
    processMultimodalInput(dataUrl, 'image');
  };

  const toggleCamera = async () => {
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(newFacing);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newFacing } });
      setCameraStream(stream);
    } catch (error) {
      setToast({ message: "Failed to switch camera.", type: 'error' });
    }
  };

  const generateAutoTitle = async (firstMessage: string) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: `Generate a very short (max 5 words) descriptive title for a chat that starts with: "${firstMessage}"`,
      });
      setIsBillingDepleted(false);
      return response.text?.trim().replace(/^"|"$/g, '') || 'New Analysis Session';
    } catch (error) {
      const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
      if (errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('spending cap') || errorStr.includes('prepayment credits')) {
        setIsBillingDepleted(true);
      }
      return 'New Analysis Session';
    }
  };

  const handleChat = async (e?: React.FormEvent, overrideMessage?: string) => {
    if (e) e.preventDefault();
    const userMessage = overrideMessage || chatInput;
    if (!userMessage.trim() || isThinking || !user) return;

    const sessionId = Date.now().toString();
    const newSession: StackSession = {
      id: sessionId,
      question: userMessage,
      response: null,
      status: 'solving',
      timestamp: Date.now()
    };

    setStackSessions(prev => [...prev, newSession]);
    setChatInput('');
    setIsThinking(true);
    setAiStatus('processing');

    // Build context from memory and previous sessions
    const memoryContext = `
      USER MEMORY CONTEXT:
      - Recent Topics: ${userMemory.topics.join(', ')}
      - Last Solved: ${userMemory.lastSolved.slice(-3).join(', ')}
      - Patterns: ${userMemory.patterns.join(', ')}
    `;

    // AI Memory Mode Logic
    const historyToProcess = privacy.aiMemoryMode ? chatHistory : [];
    const methodPrompt = methodOverride ? `\n[METHOD OVERRIDE]: Use the following method strictly: ${methodOverride}` : '';
    const detailPrompt = `\n[DETAIL LEVEL]: ${detailLevel} mode.`;
    const newHistory = [...historyToProcess, { role: 'user' as const, parts: [{ text: userMessage + methodPrompt + detailPrompt }] }];
    
    setMethodOverride(''); // Clear after use
    
    // Select model based on AI Mode
    let modelName = aiMode === 'fast' ? "gemini-3.1-flash-lite-preview" : 
                      aiMode === 'deep' ? "gemini-3.1-pro-preview" : 
                      "gemini-3-flash-preview";

    try {
      let response;
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: [
            { role: 'user', parts: [{ text: memoryContext }] },
            ...newHistory.map(h => ({ role: h.role, parts: h.parts }))
          ],
          config: {
            systemInstruction: `You are NEUROASK, a production-grade, crash-proof AI academic operating system.
            Your goal is to provide precise, direct answers first, then structured on-demand intelligence.
            
            ELITE STACK MODE:
            - You are part of a continuous intelligence thread.
            - Use the provided USER MEMORY CONTEXT to personalize your response.
            - If the user asks a similar question to a past one, reference the previous method.
            
            CORE DIRECTIVES:
            1. ACCURACY FIRST: Double-check all mathematical calculations and logical steps internally before outputting.
            2. SPEED: Use the most efficient path to the solution.
            3. CLARITY: Use precise terminology and LaTeX for all mathematical expressions.
            
            LANGUAGE:
            Respond entirely in the following language: ${privacy.language}.
            
            INTELLIGENT CLASSIFICATION:
            Before responding, classify the intent into one of these categories:
            - Academic (math, science, engineering)
            - Programming / technical
            - General knowledge
            - Image editing / tools / software (NEVER reject these; provide helpful advice/tools)
            - Writing / explanation
            - Restricted (ONLY for illegal, harmful, or safety threats)
            
            RESPONSE FORMAT (MANDATORY):
            You must return your response in the following structured format:
            [CATEGORY]: One of the categories above.
            [STATUS]: "success", "safe_redirect" (for unclear/tool queries), or "restricted".
            [DETECTION]: A 1-line classification (e.g., "Detected: Image editing tools")
            [GIVEN]: List all given values/parameters from the problem.
            [REQUIRED]: State exactly what needs to be found.
            [METHOD]: The solving method used (Auto-selected or User-specified).
            [AI_CONFIRMATION]: If a user specified a method, confirm it (e.g., "✔ Using Quadratic Formula as requested").
            [WORKING]: Step-by-step working with clear numbering and mathematical notation.
            [METHOD_NOTE]: Brief note on method efficiency or alternatives.
            [SUMMARY]: 1-2 lines maximum. Direct answer or conclusion first. No unnecessary explanation.
            [EXPLANATION]: Well-structured paragraphs. Logical flow of ideas. Clear separation of concepts.
            [STEPS]: A detailed, numbered breakdown of the [WORKING] section. Each step must be clearly numbered and logically follow from the previous one. This is for users who want to see the logic behind the working.
            [KEY_POINTS]: Bullet-style summary of important facts, formulas, or results.
            [FINAL_ANSWER]: The direct, final answer. NEVER undefined or empty.
            [EXAM_MARKS]: ONLY if the question is exam-style. Breakdown marks 1-5.
            [SIMPLIFY]: Beginner-friendly version.
            [DEEP_DIVE]: Expert-level intelligence.
            [GRAPH_DATA]: Optional JSON for graphing (e.g., {"type": "line", "data": [{"x": 1, "y": 2}]}).
            
            VERIFICATION STEP:
            Before finalizing the [FINAL_ANSWER], perform a mental verification of the [WORKING]. If any error is found, correct the [WORKING] and [FINAL_ANSWER] immediately.
            
            METHOD OVERRIDE RULES:
            - If [METHOD OVERRIDE] is provided, you MUST follow it strictly.
            - In [AI_CONFIRMATION], confirm the method.
            - In [METHOD_NOTE], validate suitability or suggest better alternatives if applicable.
            
            DETAIL LEVEL RULES:
            - Strict: Follow examiner marking schemes exactly.
            - Teaching: Add brief conceptual explanations between steps.
            - Speed: Provide the fastest path to the answer with minimal working. Focus on the [FINAL_ANSWER] and [SUMMARY].
            
            BEHAVIOR RULES:
            - NEVER say "cannot assist" unless truly restricted (illegal/harmful).
            - If a query is about tools/software (e.g. sticker removal), REDIRECT with helpful recommendations instead of refusing.
            - ALWAYS prioritize clarity over length.
            - Use LaTeX for math. Use Markdown for code.
            - Be precise, professional, and ultra-intelligent.`
          }
        });
      } catch (innerError: any) {
        const errorStr = JSON.stringify(innerError);
        if ((errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('spending cap') || errorStr.includes('prepayment credits')) && modelName !== "gemini-3.1-flash-lite-preview") {
          console.warn("Primary model capped. Falling back to Lite model...");
          setToast({ message: "Quota limit reached. Falling back to Lite model...", type: 'success' });
          response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite-preview",
            contents: [
              { role: 'user', parts: [{ text: memoryContext }] },
              ...newHistory.map(h => ({ role: h.role, parts: h.parts }))
            ],
            config: {
              systemInstruction: `You are NEUROASK (Lite Mode). You are responding because the primary intelligence stream is currently resource-constrained.
              Provide a direct, accurate answer using the Lite model.
              
              RESPONSE FORMAT (MANDATORY):
              [CATEGORY]: General
              [STATUS]: success
              [DETECTION]: Detected: Lite Intelligence Stream
              [SUMMARY]: Direct answer.
              [FINAL_ANSWER]: The final answer.
              [EXPLANATION]: Brief explanation.`
            }
          });
        } else {
          throw innerError;
        }
      }
      
      const rawText = response.text || "";
      setIsBillingDepleted(false);
      
      // Parse the structured response
      const parsedResponse = {
        category: rawText.match(/\[CATEGORY\]:(.*?)(?=\[|$)/s)?.[1]?.trim() || "General knowledge",
        status: (rawText.match(/\[STATUS\]:(.*?)(?=\[|$)/s)?.[1]?.trim() || "success") as any,
        detection: rawText.match(/\[DETECTION\]:(.*?)(?=\[|$)/s)?.[1]?.trim() || "Detected: Intelligence Stream",
        given: rawText.match(/\[GIVEN\]:(.*?)(?=\[|$)/s)?.[1]?.trim(),
        required: rawText.match(/\[REQUIRED\]:(.*?)(?=\[|$)/s)?.[1]?.trim(),
        method: rawText.match(/\[METHOD\]:(.*?)(?=\[|$)/s)?.[1]?.trim(),
        aiConfirmation: rawText.match(/\[AI_CONFIRMATION\]:(.*?)(?=\[|$)/s)?.[1]?.trim(),
        working: rawText.match(/\[WORKING\]:(.*?)(?=\[|$)/s)?.[1]?.trim(),
        methodNote: rawText.match(/\[METHOD_NOTE\]:(.*?)(?=\[|$)/s)?.[1]?.trim(),
        summary: rawText.match(/\[SUMMARY\]:(.*?)(?=\[|$)/s)?.[1]?.trim() || "",
        explanation: rawText.match(/\[EXPLANATION\]:(.*?)(?=\[|$)/s)?.[1]?.trim() || "",
        steps: rawText.match(/\[STEPS\]:(.*?)(?=\[|$)/s)?.[1]?.trim(),
        keyPoints: rawText.match(/\[KEY_POINTS\]:(.*?)(?=\[|$)/s)?.[1]?.trim(),
        finalAnswer: rawText.match(/\[FINAL_ANSWER\]:(.*?)(?=\[|$)/s)?.[1]?.trim() || "I've processed your request.",
        examMarks: rawText.match(/\[EXAM_MARKS\]:(.*?)(?=\[|$)/s)?.[1]?.trim(),
        simplify: rawText.match(/\[SIMPLIFY\]:(.*?)(?=\[|$)/s)?.[1]?.trim(),
        deepDive: rawText.match(/\[DEEP_DIVE\]:(.*?)(?=\[|$)/s)?.[1]?.trim(),
        graphData: null as any
      };

      const graphDataRaw = rawText.match(/\[GRAPH_DATA\]:(.*?)(?=\[|$)/s)?.[1]?.trim();
      if (graphDataRaw) {
        try {
          parsedResponse.graphData = JSON.parse(graphDataRaw);
        } catch (e) {}
      }

      // Update Stack Session
      setStackSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, response: parsedResponse, status: 'completed' } : s
      ));

      // Update Memory
      setUserMemory(prev => ({
        ...prev,
        topics: Array.from(new Set([...prev.topics, parsedResponse.category])),
        lastSolved: [...prev.lastSolved, userMessage],
        patterns: Array.from(new Set([...prev.patterns, parsedResponse.method || '']))
      }));

      // Update Chat History for context
      const aiMessage = { role: 'model' as const, parts: [{ text: rawText }], ...parsedResponse };
      const updatedHistory = [
        ...chatHistory,
        { role: 'user' as const, parts: [{ text: userMessage }] },
        aiMessage
      ];
      setChatHistory(updatedHistory);

      // Persistence with Crash-Proof Saving
      if (privacy.saveHistory) {
        const sanitizedHistory = updatedHistory.map(msg => sanitizeData(msg));
        
        if (privacy.dataStorageMode === 'cloud') {
          setSyncStatus('syncing');
          try {
            if (!currentChatId) {
              const title = await generateAutoTitle(userMessage);
              const path = 'sessions';
              try {
                const docRef = await addDoc(collection(db, path), {
                  userId: user.uid,
                  title: title || "New Session",
                  tag: parsedResponse.category || "General",
                  timestamp: Date.now(),
                  lastUpdated: Date.now(),
                  history: sanitizedHistory
                });
                setCurrentChatId(docRef.id);
              } catch (error) {
                handleFirestoreError(error, OperationType.CREATE, path);
              }
            } else {
              const path = `sessions/${currentChatId}`;
              try {
                await updateDoc(doc(db, 'sessions', currentChatId), {
                  history: sanitizedHistory,
                  lastUpdated: Date.now()
                });
              } catch (error) {
                handleFirestoreError(error, OperationType.UPDATE, path);
              }
            }
            setSyncStatus('synced');
          } catch (error) {
            console.error("Cloud sync failed:", error);
            setSyncStatus('offline');
          }
        } else {
          // Local Storage Mode
          const localSessions = JSON.parse(localStorage.getItem('neuroask-local-sessions') || '[]');
          if (!currentChatId) {
            const title = await generateAutoTitle(userMessage);
            const newSession = {
              id: `local-${Date.now()}`,
              userId: user.uid,
              title: title || "New Session",
              tag: parsedResponse.category || "General",
              timestamp: Date.now(),
              lastUpdated: Date.now(),
              history: sanitizedHistory
            };
            localSessions.push(newSession);
            setCurrentChatId(newSession.id);
          } else {
            const idx = localSessions.findIndex((s: any) => s.id === currentChatId);
            if (idx !== -1) {
              localSessions[idx].history = sanitizedHistory;
              localSessions[idx].lastUpdated = Date.now();
            }
          }
          localStorage.setItem('neuroask-local-sessions', JSON.stringify(localSessions));
          setSyncStatus('synced'); // Local "sync" is instant
        }
      }
    } catch (error: any) {
      console.error("NEUROASK System Error:", error);
      
      let errorMessage = "I encountered an error while processing that request. Please try rephrasing or asking something else.";
      let detection = "Detected: System Anomaly";

      const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
      if (errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('spending cap') || errorStr.includes('prepayment credits')) {
        setIsBillingDepleted(true);
        errorMessage = "Your project has exceeded its spending cap or prepayment credits are depleted. Please manage your billing at https://ai.studio/projects. " + 
                       (aiMode !== 'fast' ? "Try switching to 'Fast (Lite)' mode to reduce resource usage." : "");
        detection = "Detected: Resource Exhaustion";
      }

      // Fallback Response instead of crashing
      const fallbackResponse = {
        role: 'model' as const,
        parts: [{ text: `Intelligence stream interrupted. ${errorMessage}` }],
        detection,
        detectedCategory: "unknown",
        status: "fallback" as const,
        answerOnly: errorMessage,
        isExpanded: false
      };
      
      const errorHistory = [...newHistory, fallbackResponse];
      setChatHistory(errorHistory);
      setAiStatus('error');
      setToast({ message: "Intelligence stream interrupted. Fallback active.", type: 'error' });
      
      // Even on error, try to save the fallback state if history is enabled
      if (privacy.saveHistory && currentChatId) {
        const path = `sessions/${currentChatId}`;
        try {
          await updateDoc(doc(db, 'sessions', currentChatId), {
            history: errorHistory.map(msg => sanitizeData(msg)),
            lastUpdated: Date.now()
          });
        } catch (saveError) {
          console.error("Failed to save fallback history:", saveError);
          handleFirestoreError(saveError, OperationType.UPDATE, path);
        }
      }
    } finally {
      setIsThinking(false);
    }
  };

  const restoreSession = (session: ChatSession) => {
    setCurrentChatId(session.id);
    setChatHistory(session.history);
    
    // Convert history to stack sessions for the Elite UI
    const sessions: StackSession[] = [];
    for (let i = 0; i < session.history.length; i += 2) {
      const userMsg = session.history[i];
      const aiMsg = session.history[i+1];
      if (userMsg && aiMsg && userMsg.role === 'user' && aiMsg.role === 'model') {
        sessions.push({
          id: `restored-${i}-${Date.now()}`,
          question: userMsg.parts[0].text,
          response: aiMsg as any,
          status: 'completed',
          timestamp: Date.now()
        });
      }
    }
    setStackSessions(sessions);
    
    setActiveTab('workspace');
  };

  const deleteSession = async (sessionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) return;
    const path = `sessions/${sessionId}`;
    try {
      await deleteDoc(doc(db, 'sessions', sessionId));
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentChatId === sessionId) {
        startNewChat();
      }
      setToast({ message: 'Session deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Error deleting session:', error);
      setToast({ message: 'Failed to delete session', type: 'error' });
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const clearAllHistory = async () => {
    if (!user) return;
    const path = 'sessions';
    try {
      const q = query(collection(db, path), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      startNewChat();
      setToast({ message: 'All history cleared.', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to clear history.', type: 'error' });
      handleFirestoreError(error, OperationType.LIST, path);
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const deleteAllData = async () => {
    if (deleteConfirmText !== 'CONFIRM DELETE') return;
    await clearAllHistory();
    setNotifications([]);
    setPrivacy({
      saveHistory: true,
      aiMemoryMode: true,
      dataStorageMode: 'cloud',
      language: 'en'
    });
    setTheme('dark');
    setShowDeleteAllConfirm(false);
    setDeleteConfirmText('');
    setToast({ message: 'All data permanently deleted.', type: 'success' });
  };

  const updatePrivacySetting = (key: keyof PrivacySettings, value: any) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToast({ message: 'Copied to clipboard!', type: 'success' });
  };

  const regenerateResponse = (index: number) => {
    const lastUserMessage = chatHistory[index - 1]?.parts[0].text;
    if (!lastUserMessage) return;
    
    // Remove the old AI response
    const newHistory = chatHistory.slice(0, index);
    setChatHistory(newHistory);
    
    // Trigger chat with the last user message
    handleChat(undefined, lastUserMessage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen text-on-surface font-body overflow-hidden relative flex transition-colors duration-500 bg-surface">
        {/* Cyber Grid Background */}
        <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-secondary/5 blur-[150px] rounded-full animate-pulse" />

        {/* Modals */}
        <AnimatePresence>
          {showProfile && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-surface/80 backdrop-blur-xl flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-xl glass-card rounded-[40px] border border-on-surface/10 overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-on-surface/5 flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <User className="w-6 h-6 text-primary" />
                    Profile Intelligence
                  </h3>
                  <button onClick={() => setShowProfile(false)} className="p-2 rounded-xl hover:bg-on-surface/5 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative group">
                      <div className="absolute -inset-2 bg-primary/20 rounded-[40px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <img 
                        src={userProfile.avatar || user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                        alt="Avatar"
                        className="w-32 h-32 rounded-[40px] border-4 border-surface shadow-2xl relative object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <input 
                        type="file" 
                        id="avatar-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                      <button 
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        className="absolute bottom-0 right-0 p-3 rounded-2xl bg-primary text-on-primary shadow-xl hover:scale-110 transition-transform"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="text-center">
                      <h4 className="text-2xl font-bold">{userProfile.fullName || user.displayName}</h4>
                      <p className="text-sm text-on-surface/40">@{userProfile.username || 'operator'}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest ml-1">Full Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface/20 group-focus-within:text-primary transition-colors" />
                        <input 
                          type="text"
                          value={userProfile.fullName}
                          onChange={(e) => setUserProfile({ ...userProfile, fullName: e.target.value })}
                          className="w-full bg-on-surface/5 border border-on-surface/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary/30 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest ml-1">Username</label>
                      <div className="relative group">
                        <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface/20 group-focus-within:text-primary transition-colors" />
                        <input 
                          type="text"
                          value={userProfile.username}
                          onChange={(e) => setUserProfile({ ...userProfile, username: e.target.value })}
                          className="w-full bg-on-surface/5 border border-on-surface/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary/30 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest ml-1">Bio / Status</label>
                      <textarea 
                        value={userProfile.bio}
                        onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
                        placeholder="Neural status..."
                        className="w-full bg-on-surface/5 border border-on-surface/5 rounded-2xl p-4 outline-none focus:border-primary/30 transition-all h-24 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-on-surface/5">
                  <button 
                    onClick={handleProfileUpdate}
                    disabled={isUpdatingProfile}
                    className="w-full py-4 rounded-2xl bg-primary text-on-primary font-bold text-sm uppercase tracking-widest hover:bg-primary/80 transition-all neon-glow-primary disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isUpdatingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    Save Profile Changes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeModal === 'camera' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black flex flex-col"
            >
              <video 
                id="camera-video"
                autoPlay 
                playsInline 
                ref={(el) => { if (el && cameraStream) el.srcObject = cameraStream; }}
                className="flex-1 object-cover"
              />
              
              {/* Overlay Guide */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[80%] h-[40%] border-2 border-primary/50 rounded-3xl relative">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium whitespace-nowrap">
                    Align your question inside the frame
                  </div>
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                </div>
              </div>

              {/* Controls */}
              <div className="p-8 pb-12 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent">
                <button onClick={stopCamera} className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
                  <X className="w-6 h-6" />
                </button>
                
                <button 
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group active:scale-90 transition-all"
                >
                  <div className="w-16 h-16 rounded-full bg-white group-hover:scale-95 transition-transform" />
                </button>

                <div className="flex gap-4">
                  <button onClick={toggleCamera} className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
                    <FlipHorizontal className="w-6 h-6" />
                  </button>
                  <button onClick={() => setFlashOn(!flashOn)} className={cn("p-4 rounded-full transition-all", flashOn ? "bg-primary text-on-primary" : "bg-white/10 text-white")}>
                    <Flashlight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {(activeModal === 'image' || activeModal === 'file') && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-surface/80 backdrop-blur-xl flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-2xl glass-card rounded-[40px] border border-on-surface/10 overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-on-surface/5 flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    {activeModal === 'image' ? <ImageIcon className="w-6 h-6 text-primary" /> : <FileText className="w-6 h-6 text-primary" />}
                    {activeModal === 'image' ? 'Image Intelligence' : 'Document Analysis'}
                  </h3>
                  <button onClick={() => setActiveModal(null)} className="p-2 rounded-xl hover:bg-on-surface/5 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  {/* Preview */}
                  {inputPreview && activeModal === 'image' && (
                    <div className="relative rounded-3xl overflow-hidden border border-on-surface/10 group">
                      <img src={inputPreview} alt="Preview" className="w-full h-auto max-h-80 object-contain bg-black/20" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button onClick={() => setInputPreview(null)} className="p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-all">
                          <RefreshCw className="w-5 h-5" />
                        </button>
                        <button className="p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-all">
                          <Maximize className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedFile && activeModal === 'file' && (
                    <div className="p-6 rounded-3xl bg-on-surface/5 border border-on-surface/10 flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate">{selectedFile.name}</h4>
                        <p className="text-xs text-on-surface/40 uppercase tracking-widest">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type.split('/')[1].toUpperCase()}</p>
                      </div>
                    </div>
                  )}

                  {/* Extraction Result */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-on-surface/40 uppercase tracking-widest">Detected Intelligence</span>
                      {isProcessingInput && (
                        <div className="flex items-center gap-2 text-primary">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">AI Core Processing...</span>
                        </div>
                      )}
                    </div>
                    
                    <div className={cn(
                      "p-6 rounded-3xl border transition-all min-h-[120px] relative",
                      isProcessingInput ? "bg-on-surface/5 border-on-surface/5 opacity-50" : "bg-on-surface/5 border-on-surface/10"
                    )}>
                      {isEditingExtractedText ? (
                        <textarea 
                          value={extractedText}
                          onChange={(e) => setExtractedText(e.target.value)}
                          className="w-full h-40 bg-transparent outline-none resize-none text-sm custom-scrollbar"
                          autoFocus
                        />
                      ) : extractedText ? (
                        <div className="prose prose-invert max-w-none text-sm">
                          <ReactMarkdown>{extractedText}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-on-surface/20 italic text-sm">
                          {isProcessingInput ? 'Deconstructing input...' : 'No text detected yet.'}
                        </div>
                      )}
                      
                      {extractedText && !isProcessingInput && (
                        <button 
                          onClick={() => setIsEditingExtractedText(!isEditingExtractedText)}
                          className="absolute top-4 right-4 p-2 rounded-xl bg-on-surface/10 text-on-surface/40 hover:text-primary transition-all"
                        >
                          {isEditingExtractedText ? <Check className="w-4 h-4" /> : <PenTool className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-on-surface/5 flex gap-4">
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="flex-1 py-4 rounded-2xl border border-on-surface/10 font-bold text-sm uppercase tracking-widest hover:bg-on-surface/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={!extractedText || isProcessingInput}
                    onClick={() => {
                      const text = extractedText;
                      setActiveModal(null);
                      setExtractedText('');
                      setInputPreview(null);
                      setSelectedFile(null);
                      setIsEditingExtractedText(false);
                      handleChat(undefined, text);
                    }}
                    className="flex-[2] py-4 rounded-2xl bg-primary text-on-primary font-bold text-sm uppercase tracking-widest hover:bg-primary/80 transition-all neon-glow-primary disabled:opacity-50"
                  >
                    Confirm & Solve
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Billing Depletion Banner */}
        <AnimatePresence>
          {isBillingDepleted && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500/10 border-b border-red-500/20 px-6 py-3 flex items-center justify-between gap-4 z-[60] relative"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                  Billing Depleted: Intelligence stream may be limited.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <a 
                  href="https://ai.studio/projects" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-red-400 hover:underline uppercase tracking-widest"
                >
                  Manage Billing
                </a>
                <button 
                  onClick={() => setIsBillingDepleted(false)}
                  className="p-1 rounded-lg hover:bg-red-500/10 text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar (AI Control Panel) */}
        <aside className={cn(
          "glass-card border-r border-on-surface/5 z-50 flex flex-col p-6 relative transition-all duration-500",
          isFocusMode ? "w-0 p-0 opacity-0 overflow-hidden border-none" : "w-20 md:w-72"
        )}>
          <div className="flex items-center gap-4 mb-10 px-2">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center neon-glow-primary animate-float">
              <Cpu className="text-on-primary w-7 h-7" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-headline font-bold tracking-tight neon-text-primary">NEUROASK</h1>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full ai-pulse",
                  aiStatus === 'active' ? "bg-green-500" : aiStatus === 'processing' ? "bg-yellow-500" : "bg-red-500"
                )} />
                <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">
                  {aiStatus === 'active' ? t('online') : aiStatus === 'processing' ? t('processing') : t('error')} • v4.2
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={startNewChat}
            className="w-full mb-8 flex items-center gap-4 p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all group"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
            <span className="hidden md:block font-bold uppercase tracking-wider text-xs">{t('newChat')}</span>
          </button>

          <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
            {[
              { id: 'workspace', icon: LayoutDashboard, label: t('workspace') },
              { id: 'latex', icon: FileText, label: 'LaTeX Editor' },
              { id: 'history', icon: HistoryIcon, label: t('history') },
              { id: 'privacy', icon: Shield, label: t('privacy') },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl transition-all group",
                  activeTab === item.id ? "bg-on-surface/10 text-on-surface border border-on-surface/10" : "text-on-surface/40 hover:bg-on-surface/5 hover:text-on-surface"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", activeTab === item.id && "neon-text-primary")} />
                <span className="hidden md:block font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-on-surface/5 space-y-2">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-on-surface/40 hover:bg-on-surface/5 hover:text-on-surface transition-all relative"
            >
              <div className="relative">
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-surface animate-pulse" />
                )}
              </div>
              <span className="hidden md:block font-medium">{t('notifications')}</span>
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-on-surface/40 hover:bg-on-surface/5 hover:text-on-surface transition-all"
            >
              <SettingsIcon className="w-5 h-5" />
              <span className="hidden md:block font-medium">{t('settings')}</span>
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden md:block font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
          {/* Header */}
          <header className={cn(
            "h-20 border-b border-on-surface/5 flex items-center justify-between px-8 backdrop-blur-md bg-surface/50 transition-all duration-500",
            isFocusMode && "opacity-0 h-0 overflow-hidden border-none"
          )}>
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-headline font-bold capitalize">{t(activeTab)}</h2>
              <div className="h-4 w-px bg-on-surface/10" />
              <div className="flex items-center gap-2 text-xs font-bold text-on-surface/40 uppercase tracking-widest">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  syncStatus === 'synced' ? "bg-green-500" : syncStatus === 'syncing' ? "bg-yellow-500 animate-pulse" : "bg-red-500"
                )} />
                {t(syncStatus)}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowProfile(true)}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                <img
                  src={userProfile.avatar || user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                  alt="Profile"
                  className="w-10 h-10 rounded-xl border border-on-surface/10 relative"
                  referrerPolicy="no-referrer"
                />
              </button>
            </div>
          </header>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'workspace' && (
                <motion.div
                  key="workspace"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col max-w-4xl mx-auto"
                >
                  {/* Chat History / Output Area */}
                  <div className="flex-1 space-y-12 mb-8 overflow-y-auto custom-scrollbar pr-4 pb-12 flex flex-col-reverse">
                    <div ref={chatEndRef} />
                    
                    {/* Active Solving Session */}
                    {isThinking && stackSessions.find(s => s.status === 'solving') && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-12 space-y-4"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center ai-pulse neon-glow-primary">
                          <Cpu className="w-6 h-6 text-on-primary" />
                        </div>
                        <span className="text-xs font-bold text-primary uppercase tracking-[0.3em] animate-pulse">
                          Processing Neural Stream...
                        </span>
                      </motion.div>
                    )}

                    {/* Stacked Session Cards */}
                    <AnimatePresence initial={false}>
                      {[...stackSessions].reverse().map((session, i) => (
                        <motion.div
                          key={session.id}
                          layout
                          initial={{ opacity: 0, y: 50, scale: 0.9 }}
                          animate={{ 
                            opacity: session.status === 'completed' ? 1 : 0.8, 
                            y: 0, 
                            scale: 1,
                            zIndex: stackSessions.length - i
                          }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className={cn(
                            "flex flex-col gap-4 p-8 rounded-[32px] relative group transition-all duration-500 mb-8",
                            session.status === 'completed' ? "bg-on-surface/5 border border-on-surface/10" : "bg-primary/5 border border-primary/20",
                            i > 0 && "opacity-60 scale-95 -mt-12 hover:opacity-100 hover:scale-100 hover:-mt-8"
                          )}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-4 items-center">
                              <div className="w-10 h-10 rounded-xl bg-on-surface/10 flex items-center justify-center shrink-0">
                                <User className="w-5 h-5" />
                              </div>
                              <p className="text-lg font-medium">{session.question}</p>
                            </div>
                            {session.status === 'completed' && (
                              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest">
                                <CheckCircle2 className="w-3 h-3" />
                                Completed
                              </div>
                            )}
                            {session.status === 'fallback' && (
                              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-widest">
                                <AlertCircle className="w-3 h-3" />
                                Fallback Active
                              </div>
                            )}
                          </div>

                          {session.response && (
                            <div className="space-y-8 text-center">
                              {session.response.detection && (
                                <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] opacity-60">
                                  {session.response.detection}
                                </div>
                              )}
                              
                              {/* Summary Block */}
                              {session.response.summary && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="max-w-2xl mx-auto p-6 rounded-3xl bg-primary/5 border border-primary/10 text-left"
                                >
                                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Zap className="w-3 h-3" />
                                    Intelligent Summary
                                  </p>
                                  <div className="text-sm leading-relaxed text-on-surface/80">
                                    {session.response.summary}
                                  </div>
                                </motion.div>
                              )}

                              {/* Structured Blocks */}
                              {(session.response.given || session.response.required || session.response.method) && (
                                <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                                  {session.response.given && (
                                    <div className="p-5 rounded-3xl bg-on-surface/5 border border-on-surface/10">
                                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Given</p>
                                      <div className="text-sm text-on-surface/80 leading-relaxed">
                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                          {session.response.given}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  )}
                                  {session.response.required && (
                                    <div className="p-5 rounded-3xl bg-on-surface/5 border border-on-surface/10">
                                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Required</p>
                                      <div className="text-sm text-on-surface/80 leading-relaxed">
                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                          {session.response.required}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  )}
                                  {session.response.method && (
                                    <div className="p-5 rounded-3xl bg-on-surface/5 border border-on-surface/10">
                                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Method</p>
                                      <div className="text-sm text-on-surface/80 leading-relaxed">
                                        {session.response.aiConfirmation && (
                                          <div className="text-primary font-bold mb-1 flex items-center gap-1">
                                            <Check className="w-3 h-3" />
                                            {session.response.aiConfirmation}
                                          </div>
                                        )}
                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                          {session.response.method}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Final Answer Block */}
                              <div className="max-w-2xl mx-auto py-10 px-8 rounded-[40px] bg-primary text-on-primary shadow-2xl shadow-primary/20 relative overflow-hidden group/answer">
                                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover/answer:opacity-40 transition-opacity">
                                  <Sparkles className="w-12 h-12" />
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.4em] mb-4 opacity-70">Final Answer</p>
                                <div className="text-3xl md:text-4xl font-headline font-bold leading-tight">
                                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {session.response.finalAnswer}
                                  </ReactMarkdown>
                                </div>
                                {session.status === 'fallback' && (
                                  <div className="mt-8 pt-8 border-t border-white/10">
                                    <a 
                                      href="https://ai.studio/projects" 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-xs font-bold uppercase tracking-widest"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      Fix Billing in AI Studio
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap items-center justify-center gap-3">
                                {[
                                  { id: 'steps', label: 'View Steps', icon: Calculator },
                                  { id: 'explain', label: 'Explain Logic', icon: Brain },
                                  { id: 'simplify', label: 'Simplify', icon: Sparkles },
                                  { id: 'deep', label: 'Deep Dive', icon: Atom }
                                ].map((btn) => (
                                  <button
                                    key={btn.id}
                                    onClick={() => {
                                      setStackSessions(prev => prev.map(s => 
                                        s.id === session.id ? { 
                                          ...s, 
                                          isExpanded: s.expandedType === btn.id ? !s.isExpanded : true,
                                          expandedType: btn.id as any
                                        } : s
                                      ));
                                    }}
                                    className={cn(
                                      "px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all",
                                      session.isExpanded && session.expandedType === btn.id 
                                        ? "bg-primary text-on-primary neon-glow-primary" 
                                        : "bg-on-surface/5 text-on-surface/60 hover:bg-on-surface/10"
                                    )}
                                  >
                                    <btn.icon className="w-4 h-4" />
                                    {btn.label}
                                  </button>
                                ))}
                              </div>

                              {/* Expanded Content */}
                              <AnimatePresence>
                                {session.isExpanded && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0, y: 20 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: 20 }}
                                    className="text-left glass-card p-8 rounded-[32px] border border-on-surface/10 mt-8 overflow-hidden"
                                  >
                                    <div className="markdown-body prose prose-invert max-w-none relative group/content">
                                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {(session.expandedType === 'steps' ? session.response.steps : 
                                          session.expandedType === 'explain' ? session.response.explanation :
                                          session.expandedType === 'simplify' ? session.response.simplify :
                                          session.response.deepDive) || ""}
                                      </ReactMarkdown>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Welcome Header */}
                    <div className={cn(
                      "flex flex-col items-center justify-center text-center space-y-8 py-20 transition-all duration-500",
                      stackSessions.length > 0 ? "opacity-40 scale-90" : "h-full",
                      isFocusMode && "hidden"
                    )}>
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-8 neon-glow-primary"
                      >
                        <Brain className="w-12 h-12 text-primary" />
                      </motion.div>
                      <h1 className="text-5xl md:text-6xl font-headline font-bold tracking-tight">
                        NEUROASK
                      </h1>
                      <p className="text-on-surface/40 text-xl max-w-2xl mx-auto leading-relaxed">
                        Intelligence systems operational. Ask anything.
                      </p>
                    </div>
                  </div>

                  {/* Centered Input Zone */}
                  <div className={cn(
                    "w-full max-w-3xl mx-auto pb-12 transition-all duration-500",
                    isFocusMode && "opacity-0 translate-y-20 pointer-events-none"
                  )}>
                    {isFocusMode && (
                      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100]">
                        <button 
                          onClick={() => setIsFocusMode(false)}
                          className="px-6 py-3 rounded-2xl bg-primary text-on-primary font-bold text-sm uppercase tracking-widest flex items-center gap-2 neon-glow-primary hover:scale-105 transition-all pointer-events-auto"
                        >
                          <Minimize2 className="w-4 h-4" />
                          Exit Focus Mode
                        </button>
                      </div>
                    )}
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-primary/20 rounded-[32px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                      <div className="relative glass-card rounded-[32px] p-2 border border-on-surface/5 group-focus-within:border-primary/30 transition-colors">
                        <div className="px-6 pt-4 flex items-center gap-4">
                          <div className="flex items-center gap-2 shrink-0">
                            <Brain className="w-4 h-4 text-primary opacity-50" />
                            <input 
                              type="text"
                              value={methodOverride}
                              onChange={(e) => setMethodOverride(e.target.value)}
                              placeholder="Method Override..."
                              className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-primary/60 outline-none w-32 placeholder:text-primary/20"
                            />
                          </div>
                          <div className="w-px h-4 bg-on-surface/10" />
                          <div className="flex items-center gap-2">
                            <Cpu className="w-3 h-3 text-primary opacity-50" />
                            <select 
                              value={aiMode}
                              onChange={(e) => setAiMode(e.target.value as any)}
                              className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-primary/60 outline-none cursor-pointer"
                            >
                              <option value="fast" className="bg-surface">Fast (Lite)</option>
                              <option value="accurate" className="bg-surface">Accurate (Flash)</option>
                              <option value="deep" className="bg-surface">Deep (Pro)</option>
                            </select>
                          </div>
                          <div className="w-px h-4 bg-on-surface/10" />
                          <div className="flex items-center gap-2">
                            <Zap className="w-3 h-3 text-primary opacity-50" />
                            <select 
                              value={detailLevel}
                              onChange={(e) => setDetailLevel(e.target.value as any)}
                              className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-primary/60 outline-none cursor-pointer"
                            >
                              <option value="Strict" className="bg-surface">Strict Mode</option>
                              <option value="Teaching" className="bg-surface">Teaching Mode</option>
                              <option value="Speed" className="bg-surface">Speed Mode</option>
                            </select>
                          </div>
                        </div>
                        <textarea
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChat()}
                          placeholder={isThinking ? "Processing..." : "Ask anything..."}
                          disabled={isThinking}
                          className="w-full bg-transparent px-8 py-6 text-xl outline-none resize-none max-h-60 min-h-[80px] custom-scrollbar placeholder:text-on-surface/10 text-on-surface disabled:opacity-50"
                          rows={1}
                        />
                        <div className="flex items-center justify-between p-4 border-t border-on-surface/5">
                            <div className="flex gap-2">
                              <input 
                                type="file" 
                                id="file-upload" 
                                className="hidden" 
                                onChange={handleFileSelect}
                                accept=".pdf,.docx,.txt,image/*"
                              />
                              {[
                                { icon: FileText, label: 'Upload File', onClick: () => document.getElementById('file-upload')?.click() },
                                { icon: ImageIcon, label: 'Upload Image', onClick: () => document.getElementById('file-upload')?.click() },
                                { icon: Camera, label: 'Camera Scan', onClick: startCamera },
                              ].map((tool, i) => (
                                <button 
                                  key={i}
                                  title={tool.label}
                                  onClick={tool.onClick}
                                  className="p-3 rounded-2xl hover:bg-on-surface/10 transition-all text-on-surface/20 hover:text-primary group"
                                >
                                  <tool.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                                </button>
                              ))}
                            </div>
                          <button 
                            onClick={handleChat}
                            disabled={!chatInput.trim() || isThinking}
                            className="bg-primary hover:bg-primary/80 text-on-primary px-8 py-3 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all neon-glow-primary disabled:opacity-50"
                          >
                            {isThinking ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              "Ask NEUROASK"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'privacy' && (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-4xl mx-auto space-y-8"
                >
                  <div className="mb-8">
                    <h2 className="text-3xl font-headline font-bold mb-2">{t('privacy')} & Security</h2>
                    <p className="text-sm text-on-surface/40">Control your data, memory, and system behavior.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6 md:p-8 rounded-[40px] border border-on-surface/5 space-y-8">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold">Data Control</h3>
                          <p className="text-[10px] text-on-surface/40 uppercase tracking-widest">Manage how we store your data</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-on-surface/5 border border-on-surface/5">
                          <div>
                            <p className="text-sm font-bold">{t('saveHistory')}</p>
                            <p className="text-[10px] text-on-surface/40">Store sessions in the cloud</p>
                          </div>
                          <button 
                            onClick={() => updatePrivacySetting('saveHistory', !privacy.saveHistory)}
                            className={cn(
                              "w-12 h-6 rounded-full transition-all relative",
                              privacy.saveHistory ? "bg-primary" : "bg-white/10"
                            )}
                          >
                            <motion.div 
                              animate={{ x: privacy.saveHistory ? 24 : 4 }}
                              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-on-surface/5 border border-on-surface/5">
                          <div>
                            <p className="text-sm font-bold">{t('aiMemory')}</p>
                            <p className="text-[10px] text-on-surface/40">Remember past context</p>
                          </div>
                          <button 
                            onClick={() => updatePrivacySetting('aiMemoryMode', !privacy.aiMemoryMode)}
                            className={cn(
                              "w-12 h-6 rounded-full transition-all relative",
                              privacy.aiMemoryMode ? "bg-primary" : "bg-white/10"
                            )}
                          >
                            <motion.div 
                              animate={{ x: privacy.aiMemoryMode ? 24 : 4 }}
                              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                            />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest ml-1">{t('dataStorage')}</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'cloud', label: 'Cloud Sync', icon: Cloud },
                              { id: 'local', label: 'Local Only', icon: HardDrive },
                            ].map((mode) => (
                              <button
                                key={mode.id}
                                onClick={() => updatePrivacySetting('dataStorageMode', mode.id as any)}
                                className={cn(
                                  "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                                  privacy.dataStorageMode === mode.id 
                                    ? "bg-primary/10 border-primary text-primary" 
                                    : "bg-on-surface/5 border-on-surface/5 text-on-surface/40 hover:border-on-surface/10"
                                )}
                              >
                                <mode.icon className="w-5 h-5" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{mode.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-6 md:p-8 rounded-[40px] border border-red-500/10 bg-red-500/5 space-y-8 flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                          <Trash2 className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-red-400">Destructive Actions</h3>
                          <p className="text-[10px] text-red-400/40 uppercase tracking-widest">Permanent data removal</p>
                        </div>
                      </div>

                      <p className="text-sm text-on-surface/60 leading-relaxed">
                        Permanently delete all your interactions, history, and personal data from NEUROASK. This action cannot be undone.
                      </p>

                      <div className="mt-auto">
                        <button 
                          onClick={() => setShowDeleteAllConfirm(true)}
                          className="w-full p-4 rounded-2xl bg-red-500 text-white font-bold text-sm uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                        >
                          {t('deleteAll')}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'latex' && (
                <motion.div
                  key="latex"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <LatexEditor />
                </motion.div>
              )}
              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-4xl mx-auto space-y-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                      <h2 className="text-3xl font-headline font-bold mb-2">Interaction History</h2>
                      <p className="text-sm text-on-surface/40">Restore previous sessions and AI context.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/40" />
                        <input 
                          type="text" 
                          placeholder="Search history..."
                          value={historySearch}
                          onChange={(e) => setHistorySearch(e.target.value)}
                          className="w-full bg-on-surface/5 border border-on-surface/10 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:border-primary/40"
                        />
                      </div>
                      <button 
                        onClick={() => setShowDeleteAllConfirm(true)}
                        className="text-[10px] font-bold text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-xl transition-all uppercase tracking-widest"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {sessions.length === 0 ? (
                    <div className="glass-card p-20 rounded-[40px] text-center opacity-40">
                      <HistoryIcon className="w-16 h-16 mx-auto mb-6" />
                      <p className="text-xl font-medium">No previous interactions found.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {sessions
                        .filter(s => s.title.toLowerCase().includes(historySearch.toLowerCase()))
                        .map((session) => (
                        <div
                          key={session.id}
                          onClick={() => restoreSession(session)}
                          className={cn(
                            "glass-card p-6 rounded-[32px] flex items-center gap-6 text-left hover:bg-on-surface/5 transition-all group cursor-pointer border",
                            currentChatId === session.id ? "border-primary/40 bg-primary/5" : "border-on-surface/5"
                          )}
                        >
                          <div className="w-12 h-12 rounded-2xl bg-on-surface/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                            <MessageSquare className="w-6 h-6 text-on-surface/40 group-hover:text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-bold truncate">{session.title}</h3>
                              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-widest">
                                {session.tag || 'General'}
                              </span>
                            </div>
                            <p className="text-[10px] text-on-surface/40 uppercase tracking-widest">{new Date(session.timestamp).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => deleteSession(session.id, e)}
                              className="p-3 rounded-xl hover:bg-red-500/10 text-on-surface/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                            <ChevronRight className="w-5 h-5 text-on-surface/20 group-hover:text-on-surface transition-all" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Slide-in Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettings(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-full max-w-md glass-card border-l border-white/10 z-[101] p-10 flex flex-col"
              >
                <div className="flex items-center justify-between mb-12">
                  <h2 className="text-2xl font-headline font-bold">System Settings</h2>
                  <button onClick={() => setShowSettings(false)} className="p-2 rounded-xl hover:bg-white/10 transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 space-y-10 overflow-y-auto custom-scrollbar pr-2">
                  <section className="space-y-6">
                    <h3 className="text-xs font-bold text-on-surface/20 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Sun className="w-4 h-4" /> Appearance
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'neon', label: 'Neon', icon: Zap },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id as any)}
                          className={cn(
                            "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all",
                            theme === t.id ? "bg-primary/10 border-primary/40 text-primary" : "bg-on-surface/5 border-on-surface/5 text-on-surface/40 hover:bg-on-surface/10"
                          )}
                        >
                          <t.icon className="w-5 h-5" />
                          <span className="text-[10px] font-bold uppercase">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xs font-bold text-on-surface/20 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Language
                    </h3>
                    <select className="w-full bg-on-surface/5 border border-on-surface/5 rounded-2xl p-4 text-sm outline-none text-on-surface">
                      <option value="en">English (US)</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xs font-bold text-on-surface/20 uppercase tracking-[0.2em] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Billing & Quota
                    </h3>
                    <div className="p-4 rounded-2xl bg-on-surface/5 border border-on-surface/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Status</span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                          isBillingDepleted ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                        )}>
                          {isBillingDepleted ? 'Depleted' : 'Active'}
                        </span>
                      </div>
                      <p className="text-[10px] text-on-surface/40 leading-relaxed">
                        Manage your project credits and spending limits in the AI Studio dashboard.
                      </p>
                      <a 
                        href="https://ai.studio/projects" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all font-bold text-[10px] uppercase tracking-widest"
                      >
                        <ExternalLink className="w-3 h-3" />
                        AI Studio Dashboard
                      </a>
                    </div>
                  </section>
                </div>

                <div className="mt-auto pt-8 border-t border-on-surface/5">
                  <button 
                    onClick={() => setShowDeleteAllConfirm(true)}
                    className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all font-bold"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete All Data
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Notifications Dropdown */}
        <AnimatePresence>
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-[150]" onClick={() => setShowNotifications(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="fixed bottom-24 left-6 md:left-72 w-[calc(100vw-3rem)] md:w-96 glass-card rounded-[32px] border border-white/10 z-[151] overflow-hidden shadow-2xl flex flex-col max-h-[500px]"
              >
                <div className="p-6 border-b border-on-surface/5 flex items-center justify-between bg-on-surface/5">
                  <div>
                    <h3 className="font-bold text-lg">Intelligence Feed</h3>
                    <p className="text-[10px] text-on-surface/40 uppercase tracking-widest">Real-time system updates</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={markAllNotificationsAsRead}
                      className="p-2 rounded-lg hover:bg-on-surface/10 text-on-surface/40 hover:text-primary transition-all"
                      title="Mark all as read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={clearAllNotifications}
                      className="p-2 rounded-lg hover:bg-on-surface/10 text-on-surface/40 hover:text-red-400 transition-all"
                      title="Clear all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 p-3 bg-on-surface/5 border-b border-on-surface/5 overflow-x-auto no-scrollbar">
                  {['all', 'system', 'ai', 'alert'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setNotificationFilter(f as any)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                        notificationFilter === f ? "bg-primary text-on-primary" : "bg-on-surface/5 text-on-surface/40 hover:bg-on-surface/10"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-12 text-center opacity-20">
                      <Bell className="w-10 h-10 mx-auto mb-4" />
                      <p className="text-xs font-bold uppercase tracking-widest">No notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-on-surface/5">
                      {notifications
                        .filter(n => notificationFilter === 'all' || n.type === notificationFilter)
                        .map((n) => (
                        <div 
                          key={n.id} 
                          className={cn(
                            "p-5 flex gap-4 hover:bg-on-surface/5 transition-all cursor-default relative group",
                            !n.read && "bg-primary/5"
                          )}
                        >
                          {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            n.type === 'system' ? "bg-blue-500/10 text-blue-400" :
                            n.type === 'ai' ? "bg-purple-500/10 text-purple-400" :
                            n.type === 'alert' ? "bg-red-500/10 text-red-400" :
                            "bg-green-500/10 text-green-400"
                          )}>
                            {n.type === 'system' ? <Shield className="w-5 h-5" /> :
                             n.type === 'ai' ? <Cpu className="w-5 h-5" /> :
                             n.type === 'alert' ? <AlertCircle className="w-5 h-5" /> :
                             <Sparkles className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-xs font-bold truncate">{n.title}</h4>
                              <span className="text-[8px] text-on-surface/30 uppercase">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-[10px] text-on-surface/60 leading-relaxed">{n.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Global Confirmation Modal */}
        <AnimatePresence>
          {showDeleteAllConfirm && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass-card p-10 rounded-[40px] border border-red-500/20 z-[201] text-center"
              >
                <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-8">
                  <Trash2 className="w-10 h-10 text-red-400" />
                </div>
                <h2 className="text-2xl font-headline font-bold mb-4">Critical Action Required</h2>
                <p className="text-sm text-on-surface/60 mb-8 leading-relaxed">
                  This will permanently delete all chats, history, and saved data. This action is irreversible.
                </p>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Type "CONFIRM DELETE" to proceed</p>
                    <input 
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type here..."
                      className="w-full bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-center text-sm outline-none focus:border-red-500/50 text-red-400 placeholder:text-red-500/20"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setShowDeleteAllConfirm(false);
                        setDeleteConfirmText('');
                      }}
                      className="flex-1 p-4 rounded-2xl bg-on-surface/5 hover:bg-on-surface/10 transition-all font-bold text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={deleteAllData}
                      disabled={deleteConfirmText !== 'CONFIRM DELETE'}
                      className="flex-1 p-4 rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
                    >
                      Delete Everything
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Auth View
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
      
      {/* Animated Background Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, 60, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary/10 blur-[120px] rounded-full"
      />

      <div className="w-full max-w-5xl flex flex-col items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full grid grid-cols-1 lg:grid-cols-2 glass-card rounded-[40px] overflow-hidden shadow-2xl border border-white/5"
        >
          {/* Left Side - Visual (Desktop Only) */}
          <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-on-surface flex items-center justify-center mb-12 shadow-2xl neon-glow-primary">
                <Cpu className="text-primary w-10 h-10" />
              </div>
              <h2 className="text-6xl font-headline font-bold leading-tight mb-8 text-on-surface">
                The Future of<br />
                <span className="text-primary neon-text-primary">Intelligence</span>
              </h2>
              <p className="text-on-surface/60 text-xl max-w-sm leading-relaxed">
                NEUROASK Assistant: A complete AI-powered academic operating system for the next generation of thinkers.
              </p>
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-on-surface/5 border border-on-surface/10 backdrop-blur-md">
                <div className="w-3 h-3 bg-green-500 rounded-full ai-pulse" />
                <span className="text-sm font-bold tracking-widest uppercase text-on-surface">AI Core v4.2 Online</span>
              </div>
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <img
                    key={i}
                    src={`https://picsum.photos/seed/${i + 50}/100/100`}
                    alt="User"
                    className="w-12 h-12 rounded-full border-2 border-surface"
                  />
                ))}
                <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-surface flex items-center justify-center text-[10px] font-bold text-on-surface">
                  +10k
                </div>
              </div>
            </div>

            {/* Decorative Grid */}
            <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
          </div>

          {/* Right Side - Auth Forms Container */}
          <div className="relative overflow-hidden bg-on-surface/[0.02] min-h-[600px] flex flex-col">
            <div className="p-8 md:p-12 lg:p-16 flex-1 flex flex-col">
              <div className="mb-10 text-center lg:text-left">
                <div className="lg:hidden flex justify-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-on-surface flex items-center justify-center shadow-xl">
                    <Cpu className="text-primary w-7 h-7" />
                  </div>
                </div>
                <h3 className="text-3xl md:text-4xl font-headline font-bold mb-3 text-on-surface">
                  {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h3>
                <p className="text-on-surface/40 text-base md:text-lg">
                  {authMode === 'login' ? 'Sign in to continue' : 'Join NEUROASK today'}
                </p>
              </div>

              <div className="relative flex-1">
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={authMode}
                    initial={{ x: authMode === 'login' ? 100 : -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: authMode === 'login' ? -100 : 100, opacity: 0 }}
                    transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                    className="w-full"
                  >
                    <form onSubmit={handleManualAuth} className="space-y-5">
                      {authMode === 'signup' && (
                        <>
                          <InputField
                            icon={User}
                            type="text"
                            placeholder="Enter your full name"
                            value={formData.fullName}
                            onChange={(e: any) => setFormData({ ...formData, fullName: e.target.value })}
                          />
                          <InputField
                            icon={AtSign}
                            type="text"
                            placeholder="Choose a username"
                            value={formData.username}
                            onChange={(e: any) => setFormData({ ...formData, username: e.target.value })}
                          />
                        </>
                      )}

                      <InputField
                        icon={Mail}
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                      />

                      <InputField
                        icon={Lock}
                        type="password"
                        placeholder={authMode === 'login' ? "Enter your password" : "Create a password"}
                        value={formData.password}
                        onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
                        showPasswordToggle
                      />

                      {authMode === 'login' && (
                        <div className="flex justify-end px-1">
                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            Forgot Password?
                          </button>
                        </div>
                      )}

                      {authMode === 'signup' && (
                        <>
                          <InputField
                            icon={ShieldCheck}
                            type="password"
                            placeholder="Re-enter your password"
                            value={formData.confirmPassword}
                            onChange={(e: any) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            showPasswordToggle
                          />
                          <div className="flex items-start gap-3 p-1">
                            <button
                              type="button"
                              onClick={() => setTermsAccepted(!termsAccepted)}
                              className={cn(
                                "mt-1 w-5 h-5 rounded border transition-all flex items-center justify-center shrink-0",
                                termsAccepted ? "bg-primary border-primary text-on-primary" : "bg-on-surface/5 border-on-surface/10"
                              )}
                            >
                              {termsAccepted && <Check className="w-3.5 h-3.5" />}
                            </button>
                            <span className="text-xs text-on-surface/60 leading-relaxed">
                              I agree to the{' '}
                              <button type="button" onClick={() => setShowTermsModal(true)} className="text-primary font-bold hover:underline">Terms & Conditions</button>
                              {' '}and{' '}
                              <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-primary font-bold hover:underline">Privacy Policy</button>
                            </span>
                          </div>
                        </>
                      )}

                      <button
                        type="submit"
                        disabled={isAuthenticating}
                        className="w-full btn-gradient rounded-2xl py-5 flex items-center justify-center gap-3 text-on-primary font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-primary/20"
                      >
                        {isAuthenticating ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <>
                            <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                            <ArrowRight className="w-6 h-6" />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="my-10 flex items-center gap-4">
                      <div className="flex-1 h-px bg-on-surface/10" />
                      <span className="text-[10px] font-bold text-on-surface/20 uppercase tracking-[0.3em]">SOCIAL LOGIN</span>
                      <div className="flex-1 h-px bg-on-surface/10" />
                    </div>

                    <button 
                      onClick={() => handleSocialLogin('google')} 
                      disabled={isAuthenticating}
                      className="w-full flex items-center justify-center gap-4 p-4 rounded-2xl bg-white text-black hover:bg-white/90 transition-all font-bold shadow-lg disabled:opacity-50"
                    >
                      <Chrome className="w-6 h-6" />
                      <span>Or continue with Google</span>
                    </button>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-10 text-center">
                <p className="text-sm text-on-surface/40">
                  {authMode === 'login' ? "new here ?" : "Already registered?"}{' '}
                  <button
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    className="text-primary font-bold hover:underline"
                  >
                    {authMode === 'login' ? 'sign up' : 'Sign In'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <Footer 
          onLogin={() => setAuthMode('login')}
          onSignup={() => setAuthMode('signup')}
          onAbout={() => {
            const aboutSection = document.getElementById('about-section');
            if (aboutSection) aboutSection.scrollIntoView({ behavior: 'smooth' });
          }}
          onTerms={() => setShowTermsModal(true)}
          onPrivacy={() => setShowPrivacyModal(true)}
        />
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTermsModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass-card rounded-[40px] border border-white/10 overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-on-surface/5 flex items-center justify-between">
                <h3 className="text-2xl font-headline font-bold">Terms & Conditions</h3>
                <button onClick={() => setShowTermsModal(false)} className="p-2 rounded-xl hover:bg-on-surface/5 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar text-sm text-on-surface/60 space-y-6 leading-relaxed">
                <section className="space-y-3">
                  <h4 className="text-on-surface font-bold uppercase tracking-widest text-xs">1. User Responsibilities</h4>
                  <p>As an operator of NEUROASK, you are responsible for maintaining the security of your Neural ID and Access Key. Any activity performed under your profile is your sole responsibility.</p>
                </section>
                <section className="space-y-3">
                  <h4 className="text-on-surface font-bold uppercase tracking-widest text-xs">2. Data Usage Policy</h4>
                  <p>NEUROASK processes your data to provide intelligent academic assistance. We do not sell your personal information to third parties. Your data is encrypted and stored according to your selected storage mode (Cloud or Local).</p>
                </section>
                <section className="space-y-3">
                  <h4 className="text-on-surface font-bold uppercase tracking-widest text-xs">3. Platform Rules</h4>
                  <p>Users must not attempt to reverse-engineer the AI core, bypass security protocols, or use the platform for illegal activities. We reserve the right to terminate access for any violation of these rules.</p>
                </section>
                <section className="space-y-3">
                  <h4 className="text-on-surface font-bold uppercase tracking-widest text-xs">4. Privacy Handling</h4>
                  <p>Your privacy is our priority. We implement industry-standard security measures to protect your data. Please refer to our full Privacy Policy for detailed information on data collection and retention.</p>
                </section>
              </div>
              <div className="p-8 border-t border-on-surface/5">
                <button 
                  onClick={() => {
                    setTermsAccepted(true);
                    setShowTermsModal(false);
                  }}
                  className="w-full btn-gradient rounded-2xl py-4 font-bold text-on-primary shadow-lg shadow-primary/20"
                >
                  I Accept the Terms
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showPrivacyModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrivacyModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass-card rounded-[40px] border border-white/10 overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-on-surface/5 flex items-center justify-between">
                <h3 className="text-2xl font-headline font-bold">Privacy Policy</h3>
                <button onClick={() => setShowPrivacyModal(false)} className="p-2 rounded-xl hover:bg-on-surface/5 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar text-sm text-on-surface/60 space-y-6 leading-relaxed">
                <p className="text-xs font-bold text-primary uppercase tracking-widest">Last Updated: April 15, 2026</p>
                <section className="space-y-3">
                  <h4 className="text-on-surface font-bold uppercase tracking-widest text-xs">Data Collection</h4>
                  <p>We collect minimal data required to operate the AI services, including your email, username, and chat history (if Cloud Sync is enabled).</p>
                </section>
                <section className="space-y-3">
                  <h4 className="text-on-surface font-bold uppercase tracking-widest text-xs">Cookies & Tracking</h4>
                  <p>We use essential cookies to maintain your session. We do not use tracking cookies for advertising purposes.</p>
                </section>
                <section className="space-y-3">
                  <h4 className="text-on-surface font-bold uppercase tracking-widest text-xs">Security Measures</h4>
                  <p>All data transmissions are encrypted via SSL. We perform regular security audits to ensure your intelligence data remains protected.</p>
                </section>
              </div>
            </motion.div>
          </div>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

