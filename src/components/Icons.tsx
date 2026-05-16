// BidVault icon library — Lucide React wrappers with same export names
import {
  Check, Mail, Lock, Eye, ArrowRight, ArrowLeft, Info, Key, RotateCcw,
  Shield, LayoutDashboard, List, Users, AlertTriangle, TrendingUp, Settings,
  Search, Bell, Upload, Plus, ChevronRight, ChevronLeft, Calendar, Clock,
  FileText, Phone, CreditCard, Star, Flame, Heart, SlidersHorizontal, X,
  Trophy, Store, User, Filter, ToggleRight,
} from 'lucide-react';

// ─── Brand logos (custom SVG, not Lucide) ────────────────────────────────────

export const IconBidVaultLogo = ({ className = 'size-[22px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 22 22" fill="none">
    <path d="M11 2L19 18H3L11 2Z" fill="white" />
  </svg>
);

export const IconGoogle = ({ className = 'size-[20px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20">
    <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.39a4.62 4.62 0 01-2 3.03v2.52h3.23c1.89-1.74 2.98-4.31 2.98-7.34z" fill="#4285F4" />
    <path d="M10 20c2.7 0 4.96-.9 6.62-2.43l-3.23-2.52c-.9.6-2.04.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H1.06v2.6A10 10 0 0010 20z" fill="#34A853" />
    <path d="M4.39 11.88A5.98 5.98 0 014 10c0-.65.11-1.29.39-1.88V5.52H1.06A10 10 0 000 10c0 1.62.39 3.16 1.06 4.48l3.33-2.6z" fill="#FBBC05" />
    <path d="M10 3.96c1.47 0 2.79.51 3.83 1.5l2.87-2.87C14.96.99 12.7 0 10 0A10 10 0 001.06 5.52l3.33 2.6C5.18 5.72 7.39 3.96 10 3.96z" fill="#EA4335" />
  </svg>
);

// Custom trophy stays — Lucide Trophy doesn't have the filled/gold look we need
export const IconTrophy = ({ className = 'size-[40px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none">
    <path d="M14 6h12v12a6 6 0 01-12 0V6Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
    <path d="M6 6h8v8a4 4 0 01-8 0V6Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
    <path d="M26 6h8v8a4 4 0 01-8 0V6Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
    <rect x="17" y="21" width="6" height="5" fill="#d97706" />
    <rect x="13" y="26" width="14" height="3" rx="1" fill="#d97706" />
    <circle cx="20" cy="13" r="3" fill="white" opacity="0.4" />
  </svg>
);

// ─── Lucide wrappers ──────────────────────────────────────────────────────────

export const IconCheck = ({ className = 'h-[8px] w-[10px]' }: { className?: string }) => (
  <Check className={className} strokeWidth={2.5} />
);

export const IconCheckGreen = ({ className = 'h-[9px] w-[11px]' }: { className?: string }) => (
  <Check className={className} strokeWidth={2.5} />
);

export const IconStepDone = ({ className = 'h-[8px] w-[10px]' }: { className?: string }) => (
  <Check className={className} color="#d0021b" strokeWidth={2.5} />
);

export const IconCheckbox = ({ className = 'h-[7px] w-[9px]' }: { className?: string }) => (
  <Check className={className} strokeWidth={2.5} />
);

export const IconUser = ({ className = 'size-[16px]' }: { className?: string }) => (
  <User className={className} color="#adb5bd" strokeWidth={1.4} />
);

export const IconEmail = ({ className = 'h-[13px] w-[16px]' }: { className?: string }) => (
  <Mail className={className} color="#adb5bd" strokeWidth={1.4} />
);

export const IconEmailLg = ({ className = 'h-[30px] w-[36px]' }: { className?: string }) => (
  <Mail className={className} color="#d0021b" strokeWidth={1.5} />
);

export const IconMail = ({ className = 'size-[20px]' }: { className?: string }) => (
  <Mail className={className} color="#d0021b" strokeWidth={1.5} />
);

export const IconMailLock = ({ className = 'size-[30px]' }: { className?: string }) => (
  <Mail className={className} color="#d0021b" strokeWidth={1.5} />
);

export const IconLock = ({ className = 'h-[16px] w-[14px]' }: { className?: string }) => (
  <Lock className={className} color="#adb5bd" strokeWidth={1.4} />
);

export const IconEye = ({ className = 'h-[13px] w-[17px]' }: { className?: string }) => (
  <Eye className={className} color="#adb5bd" strokeWidth={1.4} />
);

export const IconArrow = ({ className = 'size-[16px]' }: { className?: string }) => (
  <ArrowRight className={className} color="white" strokeWidth={1.5} />
);

export const IconArrowLeft = ({ className = 'size-[16px]' }: { className?: string }) => (
  <ArrowLeft className={className} color="#6c757d" strokeWidth={1.5} />
);

export const IconInfo = ({ className = 'size-[16px]', color = '#3451b2' }: { className?: string; color?: string }) => (
  <Info className={className} color={color} strokeWidth={1.4} />
);

export const IconKey = ({ className = 'size-[16px]' }: { className?: string }) => (
  <Key className={className} color="white" strokeWidth={1.5} />
);

export const IconResend = ({ className = 'size-[14px]' }: { className?: string }) => (
  <RotateCcw className={className} color="#6c757d" strokeWidth={1.3} />
);

export const IconShield = ({ className = 'h-[16px] w-[15px]' }: { className?: string }) => (
  <Shield className={className} color="white" strokeWidth={1.4} />
);

export const IconBuyer = ({ className = 'size-[16px]' }: { className?: string }) => (
  <User className={className} color="#d0021b" strokeWidth={1.4} />
);

export const IconSeller = ({ className = 'size-[16px]' }: { className?: string }) => (
  <Store className={className} color="#6c757d" strokeWidth={1.3} />
);

// ─── Dashboard / Nav icons ────────────────────────────────────────────────────

export const IconDashboard = () => (
  <LayoutDashboard className="size-[16px]" strokeWidth={1.5} />
);

export const IconList = () => (
  <List className="size-[16px]" strokeWidth={1.5} />
);

export const IconUsers = () => (
  <Users className="size-[16px]" strokeWidth={1.5} />
);

export const IconAlert = () => (
  <AlertTriangle className="size-[16px]" strokeWidth={1.5} />
);

export const IconAnalytics = () => (
  <TrendingUp className="size-[16px]" strokeWidth={1.5} />
);

export const IconSettings = () => (
  <Settings className="size-[16px]" strokeWidth={1.5} />
);

export const IconBell = () => (
  <Bell className="size-[18px]" color="#6c757d" strokeWidth={1.4} />
);

// ─── Action icons ─────────────────────────────────────────────────────────────

export const IconSearch = ({ className = 'size-[16px]', color = '#6c757d' }: { className?: string; color?: string }) => (
  <Search className={className} color={color} strokeWidth={1.4} />
);

export const IconFilter = ({ className = 'size-[16px]' }: { className?: string }) => (
  <SlidersHorizontal className={className} color="#6c757d" strokeWidth={1.4} />
);

export const IconExport = () => (
  <Upload className="size-[14px]" strokeWidth={1.4} />
);

export const IconPlus = ({ color = 'white', className = 'size-[14px]' }: { color?: string; className?: string }) => (
  <Plus className={className} color={color} strokeWidth={2} />
);

export const IconUpload = ({ className = 'size-[20px]', color = '#6c757d' }: { className?: string; color?: string }) => (
  <Upload className={className} color={color} strokeWidth={1.5} />
);

export const IconDocument = ({ className = 'size-[16px]', color = '#6c757d' }: { className?: string; color?: string }) => (
  <FileText className={className} color={color} strokeWidth={1.4} />
);

export const IconPhone = ({ className = 'size-[16px]' }: { className?: string }) => (
  <Phone className={className} color="#adb5bd" strokeWidth={1.3} />
);

export const IconIdCard = ({ className = 'size-[16px]' }: { className?: string }) => (
  <CreditCard className={className} color="#adb5bd" strokeWidth={1.3} />
);

export const IconCalendar = ({ className = 'size-[16px]' }: { className?: string }) => (
  <Calendar className={className} color="#adb5bd" strokeWidth={1.3} />
);

export const IconClock = ({ className = 'size-[16px]' }: { className?: string }) => (
  <Clock className={className} color="#adb5bd" strokeWidth={1.3} />
);

export const IconChevronRight = ({ className = 'size-[14px]', color = '#6c757d' }: { className?: string; color?: string }) => (
  <ChevronRight className={className} color={color} strokeWidth={1.8} />
);

export const IconChevronLeft = ({ className = 'size-[14px]', color = '#6c757d' }: { className?: string; color?: string }) => (
  <ChevronLeft className={className} color={color} strokeWidth={1.8} />
);

export const IconX = ({ className = 'size-[12px]', color = '#6c757d' }: { className?: string; color?: string }) => (
  <X className={className} color={color} strokeWidth={1.8} />
);

// ─── Decorative / status icons ────────────────────────────────────────────────

export const IconStar = ({ className = 'size-[12px]', filled = false }: { className?: string; filled?: boolean }) => (
  <Star className={className} color="#f59e0b" fill={filled ? '#f59e0b' : 'none'} strokeWidth={1.3} />
);

export const IconHeart = ({ className = 'size-[16px]', filled = false }: { className?: string; filled?: boolean }) => (
  <Heart className={className} color="#d0021b" fill={filled ? '#d0021b' : 'none'} strokeWidth={1.4} />
);

export const IconFire = ({ className = 'size-[14px]' }: { className?: string }) => (
  <Flame className={className} color="#ef4444" fill="#ef4444" strokeWidth={0} />
);

export const IconWarning = ({ className = 'size-[16px]' }: { className?: string }) => (
  <AlertTriangle className={className} color="#f59e0b" strokeWidth={1.4} />
);

export const IconToggle = ({ className = 'h-[22px] w-[40px]' }: { className?: string }) => (
  <ToggleRight className={className} color="#d0021b" strokeWidth={1.3} />
);
