import { createBrowserRouter } from 'react-router-dom'
import { PermissionRoute } from '@/auth/PermissionRoute'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/features/auth/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ForbiddenPage, NotFoundPage } from '@/features/errors/ErrorPages'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { AttendancePage, AttendanceSheetPage } from '@/features/attendance/AttendancePages'
import { GradingPage } from '@/features/assessment/AssessmentPages'
import { InstructorClassesPage } from '@/features/instructor/ClassesPage'
import { InstructorSchedulePage } from '@/features/instructor/SchedulePage'
import { InstructorAssessmentsPage } from '@/features/instructor/AssessmentsPage'
import { InstructorReportCardsPage } from '@/features/instructor/ReportCardsPage'
import { InstructorAnnouncementsPage } from '@/features/instructor/AnnouncementsPage'
import { InstructorInboxPage } from '@/features/instructor/InboxPage'
import { InstructorChatPage } from '@/features/instructor/ChatPage'
import { CounselorWorkspacePage } from '@/features/counseling/CounselorWorkspacePage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/forbidden', element: <ForbiddenPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/inbox', element: <InstructorInboxPage /> },
          {
            element: <PermissionRoute anyOf={['CLASS_READ']} />,
            children: [{ path: '/classes', element: <InstructorClassesPage /> }],
          },
          {
            element: <PermissionRoute anyOf={['SCHEDULE_READ']} />,
            children: [{ path: '/schedule', element: <InstructorSchedulePage /> }],
          },
          {
            element: <PermissionRoute anyOf={['ATTENDANCE_READ']} />,
            children: [
              { path: '/attendance', element: <AttendancePage /> },
              { path: '/attendance/:sessionId', element: <AttendanceSheetPage /> },
            ],
          },
          {
            element: <PermissionRoute anyOf={['ASSESSMENT_READ']} />,
            children: [{ path: '/assessments', element: <InstructorAssessmentsPage /> }],
          },
          {
            element: <PermissionRoute anyOf={['GRADING_READ']} />,
            children: [
              { path: '/grading', element: <GradingPage /> },
              { path: '/assessments/:assessmentId/grading', element: <GradingPage /> },
            ],
          },
          {
            element: <PermissionRoute anyOf={['REPORT_CARD_READ']} />,
            children: [{ path: '/report-cards', element: <InstructorReportCardsPage /> }],
          },
          {
            element: <PermissionRoute anyOf={['NOTIFICATION_READ']} />,
            children: [{ path: '/announcements', element: <InstructorAnnouncementsPage /> }],
          },
          {
            element: <PermissionRoute anyOf={['COUNSELING_READ']} />,
            children: [{ path: '/counseling', element: <CounselorWorkspacePage /> }],
          },
          {
            element: <PermissionRoute anyOf={['CHAT_READ']} />,
            children: [{ path: '/chat', element: <InstructorChatPage /> }],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
