// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string>;
}

// ============================================
// User & Auth Types
// ============================================

export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PENDING' | 'NONE';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  role: UserRole;
  isEmailVerified: boolean;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionEndDate?: string;
  socialLinks?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginResponse extends AuthTokens {
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface RegisterResponse extends AuthTokens {
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface UpdateProfileRequest {
  fullName?: string;
  bio?: string;
  phone?: string;
  socialLinks?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================
// Course Types
// ============================================

export interface PlatformStats {
  totalCourses: number;
  totalEnrollments: number;
  totalInstructors: number;
  totalStudents: number;
}

export interface FeaturedInstructor {
  id: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  totalCourses: number;
  totalStudents: number;
  averageRating: number;
}

export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
export type CourseStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
export type EnrollmentType = 'FREE' | 'PREMIUM' | 'PURCHASED';

export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder?: number;
  coursesCount: number;
}

export interface CourseInstructor {
  id: string;
  fullName: string;
  avatarUrl?: string;
  headline?: string;
  totalStudents: number;
  averageRating: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  level: CourseLevel;
  status: CourseStatus;
  price?: number;
  originalPrice?: number;
  currency?: string;
  requiresPurchase: boolean;
  isBeginner: boolean;
  durationMinutes: number;
  lessonsCount: number;
  modulesCount: number;
  enrolledCount: number;
  ratingAverage: number;
  ratingCount: number;
  language?: string;
  category: CourseCategory;
  instructor: CourseInstructor;
  tags: string;
  requirements: string;
  whatYouWillLearn: string;
  targetAudience?: string;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  isEnrolled?: boolean;
  isWishlisted?: boolean;
  enrollmentProgress?: number;
}

export interface CourseModule {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessonsCount?: number;
  totalDurationSeconds?: number;
  lessons: CourseLesson[];
  // Computed helper for templates
  duration?: number;
}

export interface CourseLesson {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  videoDurationSeconds?: number;
  duration?: number; // in minutes (computed)
  isFreePreview?: boolean;
  isPreview?: boolean; // backend field name
  isCompleted?: boolean;
  watchProgress?: number;
  contentType: 'VIDEO' | 'TEXT' | 'QUIZ';
  hasResources?: boolean;
  videoStatus?: string;
  muxPlaybackId?: string;
  muxAssetId?: string;
}

export interface LessonDetail extends CourseLesson {
  videoUrl?: string;
  textContent?: string;
  resources: LessonResource[];
}

export interface LessonResource {
  id: number;
  name: string;
  type: string;
  url: string;
  size: number;
}

export interface CourseReview {
  id: number;
  rating: number;
  comment: string;
  user: {
    id: number;
    fullName: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt?: string;
  isOwner?: boolean;
}

export interface CreateReviewRequest {
  rating: number;
  comment: string;
}

// ============================================
// Enrollment & Progress Types
// ============================================

export interface Enrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail?: string;
  courseCategory?: string;
  instructorName?: string;
  enrollmentType: EnrollmentType;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  isCompleted: boolean;
  enrolledAt: string;
  lastAccessedAt?: string;
  completedAt?: string;
  isActive: boolean;
  certificateId?: string;
}

export interface LessonProgress {
  lessonId: number;
  watchedSeconds: number;
  isCompleted: boolean;
}

// ============================================
// Subscription & Payment Types
// ============================================

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

export interface SubscriptionPlan {
  planId: string;        // matches backend planId field
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingPeriod: string; // matches backend billingPeriod field
  features: string[];
  isPopular?: boolean;
}

export interface Subscription {
  id: string;                    // UUID
  planType: string;              // e.g. "yearly"
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;      // expiry date
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
  renewalCount: number;
  lastPaymentAt?: string;
  nextBillingDate?: string;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;                     // UUID
  payzoneOrderId?: string;        // e.g. "CRS-XXXXXXXX"
  payzoneTransactionId?: string;  // payment gateway txn ID
  transactionType: 'COURSE_PURCHASE' | 'SUBSCRIPTION';
  courseName?: string;            // populated for COURSE_PURCHASE
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  // Admin-only fields (populated by /admin/transactions endpoint)
  userName?: string;
  userEmail?: string;
}

export interface InitiatePaymentResponse {
  paymentUrl: string;
  transactionId: string;
}

// ============================================
// Certificate Types
// ============================================

export interface Certificate {
  id: string;
  certificateNumber: string;
  studentName: string;
  studentEmail?: string;
  courseId: string;
  courseTitle: string;
  instructorName?: string;
  pdfUrl?: string;
  completionDate: string;
  issuedAt: string;
}

// ============================================
// Community Types
// ============================================

export type PostType = 'DISCUSSION' | 'QUESTION' | 'ANNOUNCEMENT' | 'RESOURCE';

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  content: string;
  images?: string[];
  postType: PostType;
  isPinned: boolean;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  isEdited: boolean;
  isLikedByCurrentUser: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likesCount: number;
  isEdited: boolean;
  isLikedByCurrentUser: boolean;
  replies?: CommunityComment[];
  createdAt: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  postType: PostType;
}

// ============================================
// Messaging Types
// ============================================

export interface Conversation {
  userId: number;
  fullName: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  isRead: boolean;
  createdAt: string;
}

export interface SendMessageRequest {
  receiverId: number;
  content: string;
}

// ============================================
// Notification Types
// ============================================

export type NotificationType =
  | 'COURSE_ENROLLED'
  | 'COURSE_COMPLETED'
  | 'CERTIFICATE_ISSUED'
  | 'NEW_MESSAGE'
  | 'NEW_REVIEW'
  | 'SUBSCRIPTION_EXPIRING'
  | 'SUBSCRIPTION_RENEWED'
  | 'PAYMENT_RECEIVED'
  | 'ANNOUNCEMENT';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  linkUrl?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  courseUpdates: boolean;
  promotionalEmails: boolean;
  communityUpdates: boolean;
}

// ============================================
// Public Instructor Profile
// ============================================

export interface PublicInstructorProfile {
  id: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  socialLinks?: string; // JSON string: { facebook, instagram, twitter, youtube, linkedin, website }
  totalCourses: number;
  totalStudents: number;
  averageRating: number;
  totalReviews: number;
}

// ============================================
// Instructor Types
// ============================================

export interface InstructorDashboard {
  totalStudents: number;
  totalCourses: number;
  totalEarnings: number;
  pendingPayout: number;
  averageRating: number;
  recentEnrollments: {
    courseId: number;
    courseTitle: string;
    studentName: string;
    enrolledAt: string;
  }[];
  earningsChart: {
    month: string;
    amount: number;
  }[];
}

export interface InstructorEarning {
  id: string;
  sourceType: 'COURSE_PURCHASE' | 'SUBSCRIPTION_SHARE';
  courseId?: string;
  courseName?: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  payoutStatus: 'PENDING' | 'PAID' | 'CANCELLED';
  description?: string;
  createdAt: string;
}

export interface MonthlyBreakdown {
  month: string;   // "Jan 2025"
  amount: number;
}

export interface EarningsSummary {
  totalEarnings: number;
  pendingEarnings: number;
  monthlyEarnings: number;
  totalPaidOut: number;
  monthlyBreakdown: MonthlyBreakdown[];
}

export interface PayoutRequest {
  amount: number;
  paymentMethod: string;
  bankAccountInfo: string;
  notes?: string;
}

export interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  paymentMethod?: string;
  transactionReference?: string;
  notes?: string;
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
}

// ============================================
// Admin Types
// ============================================

export interface CourseStats {
  course: Course;
  enrollmentsCount: number;
  revenue: number;
  averageRating: number;
}

export interface UserStats {
  user: User;
  studentsCount: number;
  coursesCount: number;
  totalRevenue: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  enrollments: number;
}

export interface AdminDashboard {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  newUsersThisMonth: number;
  revenueThisMonth: number;
  topCourses: CourseStats[];
  topInstructors: UserStats[];
  revenueHistory: MonthlyRevenue[];
  userGrowthChart: {
    date: string;
    users: number;
  }[];
  revenueChart: {
    date: string;
    amount: number;
  }[];
}

export interface AdminUser extends User {
  isBanned: boolean;
  bannedAt?: string;
  bannedReason?: string;
  enrollmentsCount: number;
  lastLoginAt?: string;
}

// ============================================
// Quiz Types
// ============================================

export type QuestionType = 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE';

export interface AnswerOption {
  id?: number;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface QuizQuestion {
  id?: number;
  type: QuestionType;
  text: string;
  points: number;
  options: AnswerOption[];
  explanation?: string;
  orderIndex: number;
}

export interface Quiz {
  id: string; // UUID
  courseId: string; // UUID
  courseName?: string;
  lessonId?: string; // UUID — linked lesson (nullable)
  title: string;
  description?: string;
  passingScore: number;
  duration: number; // in minutes
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
  allowRetake: boolean;
  maxAttempts: number;
  questions: QuizQuestion[];
  totalPoints: number;
  questionCount: number;
  status: 'DRAFT' | 'PUBLISHED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuizRequest {
  courseId: string; // UUID string
  lessonId?: string; // UUID string — optional lesson link
  title: string;
  description?: string;
  passingScore: number;
  duration: number;
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
  allowRetake: boolean;
  maxAttempts: number;
  questions: Omit<QuizQuestion, 'id'>[];
}

export interface UpdateQuizRequest extends Partial<CreateQuizRequest> {}

// Quiz Attempt Types (for students)
export interface QuizAttempt {
  id: string; // UUID
  quizId?: string; // UUID
  quizTitle?: string;
  studentId?: string; // UUID
  studentName?: string;
  studentEmail?: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  violated?: boolean;
  status?: string;
  startedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  timeSpent?: number; // in seconds
  attemptNumber?: number;
}

export interface QuizAnswer {
  questionId: number;
  selectedOptionIds: number[];
}

export interface SubmitQuizRequest {
  answers: QuizAnswer[];
}

export interface QuizResult {
  attemptId: number;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timeSpent: number;
  questionResults: {
    questionId: number;
    questionText: string;
    isCorrect: boolean;
    pointsEarned: number;
    pointsPossible: number;
    selectedOptionIds: number[];
    correctOptionIds: number[];
    explanation?: string;
  }[];
}

// ============================================
// Query Parameters
// ============================================

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface CourseQueryParams extends PaginationParams {
  search?: string;
  categoryId?: string;
  level?: CourseLevel;
  isPremium?: boolean;
  isFree?: boolean;
  minRating?: number;
  instructorId?: string;
  sortBy?: string;   // backend-expected sort keyword: newest | popular | rating | price_asc | price_desc
}

// ============================================
// Assignment Types
// ============================================

export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface Assignment {
  id: string;
  courseId: string;
  courseTitle?: string;
  instructorId?: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate?: string;
  totalMark: number;
  status: AssignmentStatus;
  submissionsCount?: number;
  createdAt: string;
}

export interface CreateAssignmentRequest {
  courseId: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate?: string;
  totalMark?: number;
  status?: AssignmentStatus;
}

export interface SubmitAssignmentRequest {
  content: string;
  fileUrl?: string;
}

export interface GradeSubmissionRequest {
  grade: number;
  feedback?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  content: string;
  fileUrl?: string;
  grade?: number;
  totalMark: number;
  feedback?: string;
  gradedAt?: string;
  gradedByName?: string;
  submittedAt: string;
}
