/**
 * Centralized Icon System
 *
 * Re-exports lucide-react icons with consistent defaults.
 * Use these instead of inline SVGs throughout the app.
 */

// Navigation & Layout
export {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Home,
  Settings,
  LogOut,
  User,
} from 'lucide-react';

// Recipe & Food
export {
  Clock,
  Users,
  ChefHat,
  UtensilsCrossed,
  Flame,
  Timer,
} from 'lucide-react';

// Content & Organization
export {
  BookOpen,
  Archive,
  FolderOpen,
  FileText,
  Image,
  Plus,
  Search,
  Filter,
  Bookmark,
  Heart,
} from 'lucide-react';

// Planning & Shopping
export { Calendar, ShoppingCart, ListTodo, CheckSquare } from 'lucide-react';

// Discovery & Social
export { Compass, Share2, ExternalLink, Link2, Copy, Check } from 'lucide-react';

// Actions
export { Edit, Trash2, MoreVertical, MoreHorizontal } from 'lucide-react';

// Alerts & Status
export {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
} from 'lucide-react';

// Icon size constants for consistent sizing
export const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
  '3xl': 'w-12 h-12',
} as const;

export type IconSize = keyof typeof ICON_SIZES;
