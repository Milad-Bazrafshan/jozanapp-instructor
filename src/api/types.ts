export type Permission =
  | 'ORGANIZATION_READ'
  | 'BRANCH_WRITE'
  | 'USER_READ'
  | 'USER_WRITE'
  | 'ROLE_READ'
  | 'ROLE_WRITE'
  | 'AUDIT_READ'
  | 'PEOPLE_READ'
  | 'PEOPLE_WRITE'
  | 'ACADEMIC_READ'
  | 'ACADEMIC_WRITE'
  | 'CLASS_READ'
  | 'CLASS_WRITE'
  | 'ENROLLMENT_READ'
  | 'ENROLLMENT_WRITE'
  | 'SCHEDULE_READ'
  | 'SCHEDULE_WRITE'
  | 'ATTENDANCE_READ'
  | 'ATTENDANCE_WRITE'
  | 'QUESTION_READ'
  | 'QUESTION_WRITE'
  | 'ASSESSMENT_READ'
  | 'ASSESSMENT_WRITE'
  | 'ASSESSMENT_PUBLISH'
  | 'GRADING_READ'
  | 'GRADING_WRITE'
  | 'RESULT_PUBLISH'
  | 'FINANCE_READ'
  | 'FINANCE_WRITE'
  | 'PAYMENT_WRITE'
  | 'FILE_READ'
  | 'FILE_WRITE'
  | 'NOTIFICATION_READ'
  | 'NOTIFICATION_WRITE'
  | 'REPORT_CARD_READ'
  | 'REPORT_CARD_WRITE'
  | 'REPORT_CARD_PUBLISH'
  | 'LEDGER_READ'
  | 'LEDGER_WRITE'
  | 'WORKFLOW_READ'
  | 'WORKFLOW_WRITE'
  | 'WORKFLOW_APPROVE'
  | 'CHAT_READ'
  | 'CHAT_WRITE'
  | 'CHAT_MODERATE'
  | 'SURVEY_READ'
  | 'SURVEY_WRITE'
  | 'STUDENT_CARD_READ'
  | 'STUDENT_CARD_WRITE'
  | 'MEETING_READ'
  | 'MEETING_WRITE'
  | 'FEATURE_WRITE'
  | 'COUNSELING_READ'
  | 'COUNSELING_WRITE'
  | 'COUNSELING_ASSIGN'
  | 'COUNSELING_ADMIN_REPORT_READ'
  | 'COUNSELING_SENIOR_REPORT_READ'

export type GrantView = {
  roleId: string
  roleCode?: string
  roleName: string
  scopeType: 'TENANT' | 'BRANCH'
  scopeId: string | null
}

export type AuthUser = {
  accountId: string
  membershipId: string
  tenantId: string
  tenantSlug: string
  tenantName: string
  email: string
  fullName: string
  grants: GrantView[]
}

export type Session = {
  expiresInSeconds: number
  user: AuthUser
  permissions: Permission[]
}

export type OrganizationView = {
  tenantId: string
  tenantSlug: string
  tenantName: string
  tenantStatus: string
  timezone: string
  institutionId: string
  institutionName: string
  institutionType: string
  branchCount: number
}

export type BranchView = {
  id: string
  code: string
  name: string
  status: string
  phone: string | null
  address: string | null
}

export type PermissionView = {
  code: Permission | string
  module: string
  description: string
}

export type RoleView = {
  id: string
  code: string
  name: string
  description: string | null
  systemRole: boolean
  status: string
  permissions: string[]
}

export type OrgUserGrant = {
  roleId: string
  roleName: string
  scopeType: 'TENANT' | 'BRANCH'
  scopeId: string | null
}

export type OrgUserView = {
  membershipId: string
  accountId: string
  email: string
  firstName: string
  lastName: string
  nationalId: string | null
  mobile: string | null
  membershipStatus: string
  accountStatus: string
  grants: OrgUserGrant[]
}

export type PersonView = {
  id: string
  firstName: string
  lastName: string
  nationalId: string | null
  mobile: string | null
}

export type StudentView = {
  id: string
  code: string
  status: string
  admissionDate: string | null
  person: PersonView
}

export type InstructorView = {
  id: string
  code: string
  title: string | null
  specialization: string | null
  status: string
  person: PersonView
}

export type GuardianView = {
  id: string
  occupation: string | null
  status: string
  person: PersonView
}

export type RelationshipView = {
  id: string
  student: StudentView
  guardian: GuardianView
  relationshipType: string
  primary: boolean
  academicAccess: boolean
  financialAccess: boolean
  pickupPermission: boolean
  receivesNotifications: boolean
  effectiveFrom: string
  effectiveTo: string | null
}

export type PeopleDirectory = {
  students: StudentView[]
  instructors: InstructorView[]
  guardians: GuardianView[]
  relationships: RelationshipView[]
}

export type PersonInput = {
  firstName: string
  lastName: string
  nationalId?: string | null
  mobile?: string | null
  email?: string | null
  initialPassword?: string | null
}

export type PeriodView = {
  id: string
  code: string
  name: string
  type: string
  startsOn: string
  endsOn: string
  status: string
}

export type ProgramView = {
  id: string
  code: string
  name: string
  type: string
  description: string | null
  status: string
}

export type CourseView = {
  id: string
  code: string
  title: string
  description: string | null
  durationMinutes: number | null
  status: string
}

export type ProgramCourseView = {
  id: string
  programId: string
  programName: string
  courseId: string
  courseTitle: string
  sequenceNumber: number
  required: boolean
}

export type AcademicCatalog = {
  periods: PeriodView[]
  programs: ProgramView[]
  courses: CourseView[]
  programCourses: ProgramCourseView[]
}

export type OfferingView = {
  id: string
  code: string
  courseId: string
  courseTitle: string
  academicPeriodId: string
  academicPeriodName: string
  branchId: string
  branchName: string
  enrollmentStartsOn: string | null
  enrollmentEndsOn: string | null
  status: string
}

export type SectionView = {
  id: string
  offeringId: string
  courseTitle: string
  branchName: string
  code: string
  name: string
  capacity: number
  deliveryMode: string
  status: string
}

export type ClassInstructorView = {
  id: string
  classSectionId: string
  className: string
  instructorId: string
  instructorName: string
  role: string
  primary: boolean
  effectiveFrom: string
  effectiveTo: string | null
  status: string
}

export type ClassroomCatalog = {
  offerings: OfferingView[]
  sections: SectionView[]
  instructors: ClassInstructorView[]
}

export type EnrollmentView = {
  id: string
  studentId: string
  studentCode: string
  studentName: string
  classSectionId: string
  className: string
  courseTitle: string
  branchName: string
  status: string
  source: string
  startedOn: string | null
  endedOn: string | null
}

export type LocationView = {
  id: string
  branchId: string
  branchName: string
  code: string
  name: string
  type: string
  capacity: number | null
  status: string
}

export type RuleInstructorView = {
  id: string
  name: string
}

export type RuleView = {
  id: string
  classSectionId: string
  className: string
  code: string
  recurrenceType: string
  startsOn: string
  endsOn: string
  dayOfWeek: string | null
  startsAt: string
  endsAt: string
  timeZone: string
  intervalWeeks: number
  locationId: string | null
  locationName: string | null
  instructors: RuleInstructorView[]
  status: string
}

export type SessionView = {
  id: string
  classSectionId: string
  className: string
  courseTitle: string
  branchName: string
  scheduleRuleId: string
  sessionDate: string
  plannedStartAt: string
  plannedEndAt: string
  locationName: string | null
  instructors: RuleInstructorView[]
  status: string
  manuallyOverridden: boolean
  changeReason: string | null
  replacementSessionId: string | null
}

export type SchedulingCatalog = {
  locations: LocationView[]
  rules: RuleView[]
  sessions: SessionView[]
}

export type AttendanceSummary = {
  sessionId: string
  className: string
  courseTitle: string
  sessionDate: string
  plannedStartAt: string
  sheetStatus: string
  markedCount: number
  absentCount: number
}

export type AttendanceRecordView = {
  id: string | null
  studentId: string
  studentCode: string
  studentName: string
  status: string | null
  deliveryMode: string
  lateMinutes: number | null
  note: string | null
  markedAt: string | null
}

export type AttendanceSheet = {
  id: string
  sessionId: string
  className: string
  courseTitle: string
  sessionDate: string
  plannedStartAt: string
  status: string
  finalizedAt: string | null
  records: AttendanceRecordView[]
}

export type QuestionView = {
  id: string
  code: string
  type: string
  courseId: string | null
  courseTitle: string | null
  status: string
  currentVersionId: string
  versionNumber: number
  prompt: string
  options: string[]
  correctAnswers: string[]
  explanation: string | null
  defaultPoints: number
}

export type AssessmentSectionView = {
  id: string
  title: string
  instructions: string | null
  sequenceNumber: number
}

export type AssessmentQuestionView = {
  id: string
  sectionId: string
  questionVersionId: string
  questionCode: string
  prompt: string
  points: number
  sequenceNumber: number
}

export type AssessmentTargetView = {
  id: string
  classSectionId: string
  className: string
  branchName: string
}

export type AssessmentView = {
  id: string
  code: string
  title: string
  type: string
  status: string
  courseId: string | null
  courseTitle: string | null
  opensAt: string
  closesAt: string
  durationMinutes: number
  attemptsAllowed: number
  randomizeQuestions: boolean
  totalPoints: number
  publishedAt: string | null
  participantCount: number
  sections: AssessmentSectionView[]
  questions: AssessmentQuestionView[]
  targets: AssessmentTargetView[]
}

export type ResponseGradeView = {
  id: string
  questionId: string
  prompt: string
  type: string
  answer: string[]
  points: number
  autoScore: number | null
  manualScore: number | null
  feedback: string | null
}

export type ResultView = {
  id: string
  assessmentId: string
  assessmentTitle: string
  studentName: string
  studentCode: string
  status: string
  autoScore: number | null
  manualScore: number | null
  totalScore: number | null
  maxScore: number | null
  publishedAt: string | null
  responses: ResponseGradeView[]
}

export type ChargeView = {
  id: string
  studentId: string
  studentCode: string
  studentName: string
  classSectionId: string | null
  className: string | null
  enrollmentId: string | null
  code: string
  type: string
  title: string
  amount: number
  discount: number
  netAmount: number
  allocated: number
  remaining: number
  dueOn: string
  status: string
  notes: string | null
  invoiceId: string | null
  invoiceCode: string | null
}

export type InvoiceItemView = {
  id: string
  lineNo: number
  charge: ChargeView
}

export type InvoiceView = {
  id: string
  studentId: string
  studentCode: string
  studentName: string
  code: string
  dueOn: string
  issuedOn: string | null
  status: string
  settlementStatus: string
  total: number
  remaining: number
  notes: string | null
  items: InvoiceItemView[]
}

export type PaymentAllocationView = {
  id: string
  chargeId: string
  chargeTitle: string
  amount: number
}

export type PaymentView = {
  id: string
  studentId: string
  studentCode: string
  studentName: string
  receiptNumber: string
  amount: number
  allocated: number
  unallocated: number
  method: string
  provider: string
  externalReference: string | null
  status: string
  paidAt: string
  notes: string | null
  allocations: PaymentAllocationView[]
}

export type BalanceView = {
  studentId: string
  studentCode: string
  studentName: string
  charged: number
  paid: number
  outstanding: number
  credit: number
  overdue: number
}

export type FinanceStatement = {
  balance: BalanceView
  charges: ChargeView[]
  invoices: InvoiceView[]
  payments: PaymentView[]
}

export type FinanceOverview = {
  outstanding: number
  collected: number
  overdueCount: number
  balances: BalanceView[]
}

export type ForgotPasswordResponse = {
  message: string
  developmentToken?: string | null
}

export type ProblemDetails = {
  type?: string
  title?: string
  status?: number
  detail?: string
  code?: string
  traceId?: string
  errors?: Array<{ field?: string; code?: string; message: string }>
}
