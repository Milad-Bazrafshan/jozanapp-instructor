import {
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Home,
  Inbox,
  Megaphone,
  MessageSquare,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import type { Permission } from '@/api/types'

export type NavChild = {
  id: string
  to: string
  labelKey: string
  anyOf: Permission[]
}

export type NavGroup = {
  id: string
  labelKey: string
  icon: LucideIcon
  children: NavChild[]
}

export const navGroups: NavGroup[] = [
  {
    id: 'home',
    labelKey: 'nav.today',
    icon: Home,
    children: [{ id: 'home', to: '/', labelKey: 'nav.today', anyOf: [] }],
  },
  {
    id: 'schedule',
    labelKey: 'nav.sessions',
    icon: CalendarDays,
    children: [{ id: 'sessions', to: '/schedule', labelKey: 'nav.sessions', anyOf: ['SCHEDULE_READ'] }],
  },
  {
    id: 'attendance',
    labelKey: 'nav.attendance',
    icon: ClipboardCheck,
    children: [{ id: 'attendance', to: '/attendance', labelKey: 'nav.attendance', anyOf: ['ATTENDANCE_READ'] }],
  },
  {
    id: 'classes',
    labelKey: 'nav.classes',
    icon: GraduationCap,
    children: [{ id: 'classes', to: '/classes', labelKey: 'nav.classes', anyOf: ['CLASS_READ'] }],
  },
  {
    id: 'grading',
    labelKey: 'nav.grading',
    icon: BookOpenCheck,
    children: [{ id: 'grading', to: '/grading', labelKey: 'nav.grading', anyOf: ['GRADING_READ'] }],
  },
  {
    id: 'assessments',
    labelKey: 'nav.assessmentList',
    icon: BookOpenCheck,
    children: [{ id: 'assessmentList', to: '/assessments', labelKey: 'nav.assessmentList', anyOf: ['ASSESSMENT_READ'] }],
  },
  {
    id: 'reportCards',
    labelKey: 'nav.reportCards',
    icon: GraduationCap,
    children: [{ id: 'reportCards', to: '/report-cards', labelKey: 'nav.reportCards', anyOf: ['REPORT_CARD_READ'] }],
  },
  {
    id: 'announcements',
    labelKey: 'nav.announcements',
    icon: Megaphone,
    children: [{ id: 'announcements', to: '/announcements', labelKey: 'nav.announcements', anyOf: ['NOTIFICATION_READ'] }],
  },
  {
    id: 'counseling',
    labelKey: 'nav.counseling',
    icon: ClipboardCheck,
    children: [{ id: 'counseling', to: '/counseling', labelKey: 'nav.counseling', anyOf: ['COUNSELING_READ'] }],
  },
  {
    id: 'chat',
    labelKey: 'nav.chat',
    icon: MessageSquare,
    children: [{ id: 'chat', to: '/chat', labelKey: 'nav.chat', anyOf: ['CHAT_READ'] }],
  },
  {
    id: 'inbox',
    labelKey: 'nav.inbox',
    icon: Inbox,
    children: [{ id: 'inbox', to: '/inbox', labelKey: 'nav.inbox', anyOf: [] }],
  },
  {
    id: 'system',
    labelKey: 'nav.settings',
    icon: Settings,
    children: [{ id: 'settings', to: '/settings', labelKey: 'nav.settings', anyOf: [] }],
  },
]

export const pageMeta: Record<string, { titleKey: string; subtitleKey: string }> = {
  '/': { titleKey: 'page.dashboard.title', subtitleKey: 'page.dashboard.subtitle' },
  '/classes': { titleKey: 'page.classes.title', subtitleKey: 'page.classes.subtitle' },
  '/schedule': { titleKey: 'page.sessions.title', subtitleKey: 'page.sessions.subtitle' },
  '/attendance': { titleKey: 'page.attendance.title', subtitleKey: 'page.attendance.subtitle' },
  '/assessments': { titleKey: 'page.assessments.title', subtitleKey: 'page.assessments.subtitle' },
  '/grading': { titleKey: 'page.grading.title', subtitleKey: 'page.grading.subtitle' },
  '/report-cards': { titleKey: 'page.reportCards.title', subtitleKey: 'page.reportCards.subtitle' },
  '/announcements': { titleKey: 'page.announcements.title', subtitleKey: 'page.announcements.subtitle' },
  '/inbox': { titleKey: 'page.inbox.title', subtitleKey: 'page.inbox.subtitle' },
  '/chat': { titleKey: 'page.chat.title', subtitleKey: 'page.chat.subtitle' },
  '/counseling': { titleKey: 'counseling.pageTitle', subtitleKey: 'counseling.workspaceSubtitle' },
  '/settings': { titleKey: 'page.settings.title', subtitleKey: 'page.settings.subtitle' },
}
