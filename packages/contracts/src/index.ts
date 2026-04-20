import { z } from "zod"

export type LeadStatus = "pending" | "submitted" | "archived"
export type LeadStage =
  | "new"
  | "ready_to_show"
  | "appointment_booked"
  | "nurture"
  | "hold"
  | "closed_won"
  | "closed_lost"
  | "archived"
export type Recommendation = "show" | "nurture" | "hold"
export type NotificationPreference = "email" | "email_and_push"
export type IntakeType = "sale" | "rental"
export type IntakeIntent = "buy" | "rent"
export type InviteStatus = "generated" | "opened" | "converted" | "expired"
export type AppointmentStatus = "scheduled" | "completed" | "cancelled"

export type BuyerPurchaseGoal = "myself" | "investment" | "not_sure"
export type BuyerTimeline =
  | "asap"
  | "within_1_month"
  | "1_3_months"
  | "3_6_months"
  | "6_plus_months"
  | "exploring"
export type BuyerBudgetKnowledge = "know_it" | "rough_idea" | "not_yet"
export type BuyerMortgageStatus =
  | "pre_approved"
  | "not_yet"
  | "cash"
  | "not_sure"
export type BuyerPropertyType =
  | "condo"
  | "townhouse"
  | "detached"
  | "semi_detached"
  | "multi_family"
  | "other"
export type BuyerMustHave =
  | "parking"
  | "backyard"
  | "near_transit"
  | "near_school"
  | "pet_friendly"
  | "low_maintenance"
export type WorkedWithAnotherRealtor = "yes" | "no" | "browsing"

export type RentalMoveTimeline =
  | "asap"
  | "within_2_weeks"
  | "within_1_month"
  | "1_3_months"
  | "exploring"
export type RentalPlaceType =
  | "condo"
  | "apartment"
  | "basement"
  | "house"
  | "room"
  | "not_sure"
export type PetAnswer = "yes" | "no"
export type IncomeProofAnswer = "yes" | "no" | "discuss_later"
export type RentalMustHave =
  | "parking"
  | "laundry"
  | "furnished"
  | "balcony"
  | "near_transit"
  | "pet_friendly"
export type RentedInCanadaAnswer = "yes" | "no"

export type LeadContactInfo = {
  fullName: string
  phone?: string
  email?: string
}

export type BuyerQuestionnaireAnswers = {
  buyingFor: BuyerPurchaseGoal
  timeline: BuyerTimeline
  budgetKnowledge: BuyerBudgetKnowledge
  mortgageStatus: BuyerMortgageStatus
  neighborhoods: string
  propertyType: BuyerPropertyType
  bedrooms?: string
  bathrooms?: string
  mustHaves?: BuyerMustHave[]
  workedWithAnotherRealtor?: WorkedWithAnotherRealtor
  additionalContext?: string
}

export type RentalQuestionnaireAnswers = {
  moveTimeline: RentalMoveTimeline
  rentRange: string
  neighborhoods: string
  placeType: RentalPlaceType
  bedrooms: string
  hasPets: PetAnswer
  occupantCount: string
  incomeProof?: IncomeProofAnswer
  preferredMoveInDate?: string
  mustHaves?: RentalMustHave[]
  rentedInCanadaBefore?: RentedInCanadaAnswer
  additionalContext?: string
}

export type IntakeDraft = {
  contact: LeadContactInfo
  intent?: IntakeIntent
  buyer?: Partial<BuyerQuestionnaireAnswers>
  rental?: Partial<RentalQuestionnaireAnswers>
  customAnswers?: Record<string, string | string[]>
}

export type IntakeSubmission =
  | {
      contact: LeadContactInfo
      intent: "buy"
      buyer: BuyerQuestionnaireAnswers
      customAnswers?: Record<string, string | string[]>
    }
  | {
      contact: LeadContactInfo
      intent: "rent"
      rental: RentalQuestionnaireAnswers
      customAnswers?: Record<string, string | string[]>
    }

export type ScoreBreakdown = {
  urgency: number
  finances: number
  clarity: number
  readiness: number
  fit: number
}

export type ScoreResult = {
  total: number
  breakdown: ScoreBreakdown
  recommendation: Recommendation
  summary: string
  nextAction: string
  effectiveShowThreshold: number
}

export type ScoreOverride = {
  id: string
  originalScore: number
  originalRecommendation: Recommendation
  overrideScore: number
  overrideRecommendation: Recommendation
  note: string
  createdAt: string
  createdByAgentId: string
}

export type LeadReview = {
  suggestedStage?: LeadStage
  reviewedStage?: LeadStage
  reviewedAt?: string
  isReviewed: boolean
  isOverride: boolean
}

export type CustomQuestionType = "single_select" | "multi_select" | "text"

export type QuestionOption = {
  label: string
  value: string
}

export type CustomQuestion = {
  id: string
  label: string
  type: CustomQuestionType
  required: boolean
  helperText?: string
  options?: QuestionOption[]
}

export type QuestionInputType =
  | "single_select"
  | "multi_select"
  | "text"
  | "email"
  | "tel"
  | "textarea"

export type QuestionDefinition = {
  key: string
  label: string
  helperText?: string
  placeholder?: string
  required: boolean
  type: QuestionInputType
  options?: QuestionOption[]
}

export type QuestionTemplate = {
  id: string
  intakeType: IntakeType
  name: string
  introHeadline: string
  introBody: string
  customQuestions: CustomQuestion[]
}

export type AgentProfile = {
  id: string
  email: string
  fullName: string
  brokerage?: string
  licenseNumber?: string
  photoUrl?: string
  logoUrl?: string
  onboardedAt?: string
}

export type AgentSettings = {
  agentId: string
  brandName: string
  brandColor: string
  accentColor: string
  showThreshold: number
  notificationPreference: NotificationPreference
  questionTemplateId: string
}

export type Lead = {
  id: string
  agentId: string
  intakeType: IntakeType
  buyerName: string
  buyerPhone?: string
  buyerEmail?: string
  token: string
  tokenExpiresAt: string
  status: LeadStatus
  pipelineStage: LeadStage
  submittedAt?: string
  score?: number
  recommendation?: Recommendation
  summary?: string
  createdAt: string
  updatedAt: string
  reviewedAt?: string
  reviewedStage?: LeadStage
  answers?: IntakeDraft
  customAnswers?: Record<string, string | string[]>
  scoreBreakdown?: ScoreBreakdown
  scoreOverride?: ScoreOverride
  review?: LeadReview
}

export type Showing = {
  id: string
  appointmentId: string
  address: string
  orderIndex: number
  notes?: string
}

export type AppointmentLeadSummary = Pick<
  Lead,
  "id" | "buyerName" | "buyerPhone" | "buyerEmail" | "pipelineStage"
>

export type Appointment = {
  id: string
  leadId: string
  date: string
  startTime: string
  status: AppointmentStatus
  notes?: string
  createdAt: string
  lead: AppointmentLeadSummary
  showings: Showing[]
}

export type Invite = {
  id: string
  agentId: string
  token: string
  status: InviteStatus
  tokenExpiresAt: string
  createdAt: string
  updatedAt: string
  openedAt?: string
  convertedAt?: string
  leadId?: string
  draft?: IntakeDraft
}

export type DashboardSummary = {
  totalLeads: number
  readyToShow: number
  appointmentBooked: number
  nurture: number
  hold: number
  averageScore: number
}

export const CONTACT_QUESTIONS: QuestionDefinition[] = [
  {
    key: "contact.fullName",
    label: "What’s your full name?",
    placeholder: "Full name",
    required: true,
    type: "text"
  },
  {
    key: "contact.phone",
    label: "What’s the best phone number to reach you?",
    placeholder: "Phone number",
    required: false,
    type: "tel"
  },
  {
    key: "contact.email",
    label: "What’s the best email to reach you?",
    placeholder: "Email address",
    required: false,
    type: "email"
  }
]

export const INTENT_QUESTION: QuestionDefinition = {
  key: "intent",
  label: "Are you buying a property or renting?",
  helperText: "Choose the path that matches your search right now.",
  required: true,
  type: "single_select",
  options: [
    { label: "Buying a property", value: "buy" },
    { label: "Renting", value: "rent" }
  ]
}

export const BUYER_REQUIRED_QUESTIONS: QuestionDefinition[] = [
  {
    key: "buyer.buyingFor",
    label: "Are you looking to buy for yourself or as an investment?",
    required: true,
    type: "single_select",
    options: [
      { label: "Myself", value: "myself" },
      { label: "Investment", value: "investment" },
      { label: "Not sure yet", value: "not_sure" }
    ]
  },
  {
    key: "buyer.timeline",
    label: "When are you hoping to move or buy?",
    required: true,
    type: "single_select",
    options: [
      { label: "ASAP", value: "asap" },
      { label: "Within 1 month", value: "within_1_month" },
      { label: "1–3 months", value: "1_3_months" },
      { label: "3–6 months", value: "3_6_months" },
      { label: "6+ months", value: "6_plus_months" },
      { label: "Just exploring", value: "exploring" }
    ]
  },
  {
    key: "buyer.budgetKnowledge",
    label: "Do you know your budget range?",
    required: true,
    type: "single_select",
    options: [
      { label: "Yes, I know it", value: "know_it" },
      { label: "I have a rough idea", value: "rough_idea" },
      { label: "Not yet", value: "not_yet" }
    ]
  },
  {
    key: "buyer.mortgageStatus",
    label: "Have you been pre-approved for a mortgage?",
    required: true,
    type: "single_select",
    options: [
      { label: "Yes", value: "pre_approved" },
      { label: "Not yet", value: "not_yet" },
      { label: "Paying cash", value: "cash" },
      { label: "Not sure what this means", value: "not_sure" }
    ]
  },
  {
    key: "buyer.neighborhoods",
    label: "Which area or neighborhoods are you interested in?",
    placeholder: "Neighborhoods, areas, or cities",
    required: true,
    type: "text"
  },
  {
    key: "buyer.propertyType",
    label: "What type of property are you looking for?",
    required: true,
    type: "single_select",
    options: [
      { label: "Condo", value: "condo" },
      { label: "Townhouse", value: "townhouse" },
      { label: "Detached", value: "detached" },
      { label: "Semi-detached", value: "semi_detached" },
      { label: "Multi-family", value: "multi_family" },
      { label: "Other", value: "other" }
    ]
  }
]

export const BUYER_OPTIONAL_QUESTIONS: QuestionDefinition[] = [
  {
    key: "buyer.bedrooms",
    label: "How many bedrooms do you want?",
    placeholder: "For example: 2+",
    required: false,
    type: "text"
  },
  {
    key: "buyer.bathrooms",
    label: "How many bathrooms do you want?",
    placeholder: "For example: 2+",
    required: false,
    type: "text"
  },
  {
    key: "buyer.mustHaves",
    label: "Any must-haves?",
    required: false,
    type: "multi_select",
    options: [
      { label: "Parking", value: "parking" },
      { label: "Backyard", value: "backyard" },
      { label: "Near transit", value: "near_transit" },
      { label: "Near school", value: "near_school" },
      { label: "Pet-friendly", value: "pet_friendly" },
      { label: "Low maintenance", value: "low_maintenance" }
    ]
  },
  {
    key: "buyer.workedWithAnotherRealtor",
    label: "Have you worked with another realtor already?",
    required: false,
    type: "single_select",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
      { label: "Just casually browsing", value: "browsing" }
    ]
  },
  {
    key: "buyer.additionalContext",
    label: "Anything else you want your realtor to know?",
    required: false,
    type: "textarea"
  }
]

export const RENTAL_REQUIRED_QUESTIONS: QuestionDefinition[] = [
  {
    key: "rental.moveTimeline",
    label: "When do you need to move?",
    required: true,
    type: "single_select",
    options: [
      { label: "ASAP", value: "asap" },
      { label: "Within 2 weeks", value: "within_2_weeks" },
      { label: "Within 1 month", value: "within_1_month" },
      { label: "1–3 months", value: "1_3_months" },
      { label: "Just exploring", value: "exploring" }
    ]
  },
  {
    key: "rental.rentRange",
    label: "What monthly rent range are you comfortable with?",
    placeholder: "For example: $2,000–$2,500/mo",
    required: true,
    type: "text"
  },
  {
    key: "rental.neighborhoods",
    label: "Which area or neighborhoods do you want?",
    placeholder: "Neighborhoods, areas, or cities",
    required: true,
    type: "text"
  },
  {
    key: "rental.placeType",
    label: "What type of place are you looking for?",
    required: true,
    type: "single_select",
    options: [
      { label: "Condo", value: "condo" },
      { label: "Apartment", value: "apartment" },
      { label: "Basement", value: "basement" },
      { label: "House", value: "house" },
      { label: "Room", value: "room" },
      { label: "Not sure", value: "not_sure" }
    ]
  },
  {
    key: "rental.bedrooms",
    label: "How many bedrooms do you need?",
    placeholder: "For example: 2",
    required: true,
    type: "text"
  },
  {
    key: "rental.hasPets",
    label: "Do you have any pets?",
    required: true,
    type: "single_select",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" }
    ]
  },
  {
    key: "rental.occupantCount",
    label: "How many people will be living there?",
    placeholder: "For example: 2",
    required: true,
    type: "text"
  }
]

export const RENTAL_OPTIONAL_QUESTIONS: QuestionDefinition[] = [
  {
    key: "rental.incomeProof",
    label: "Are you currently employed or able to provide proof of income?",
    required: false,
    type: "single_select",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
      { label: "Prefer to discuss later", value: "discuss_later" }
    ]
  },
  {
    key: "rental.preferredMoveInDate",
    label: "Do you have a preferred move-in date?",
    placeholder: "YYYY-MM-DD",
    required: false,
    type: "text"
  },
  {
    key: "rental.mustHaves",
    label: "Any must-haves?",
    required: false,
    type: "multi_select",
    options: [
      { label: "Parking", value: "parking" },
      { label: "Laundry", value: "laundry" },
      { label: "Furnished", value: "furnished" },
      { label: "Balcony", value: "balcony" },
      { label: "Near transit", value: "near_transit" },
      { label: "Pet-friendly", value: "pet_friendly" }
    ]
  },
  {
    key: "rental.rentedInCanadaBefore",
    label: "Have you rented in Canada before?",
    required: false,
    type: "single_select",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" }
    ]
  },
  {
    key: "rental.additionalContext",
    label: "Anything else you want your realtor to know?",
    required: false,
    type: "textarea"
  }
]

export const DEFAULT_SALE_TEMPLATE: QuestionTemplate = {
  id: "default-sale-template",
  intakeType: "sale",
  name: "ShowReady Buyer",
  introHeadline: "A quick step before your home search starts",
  introBody:
    "This takes about one minute and helps your agent understand your timing, budget, and search priorities.",
  customQuestions: []
}

export const DEFAULT_RENTAL_TEMPLATE: QuestionTemplate = {
  id: "default-rental-template",
  intakeType: "rental",
  name: "ShowReady Rental",
  introHeadline: "A quick step before your rental search starts",
  introBody:
    "This takes about one minute and helps your agent focus on rentals that fit your timing, budget, and move-in needs.",
  customQuestions: []
}

export const DEFAULT_TEMPLATES: Record<IntakeType, QuestionTemplate> = {
  sale: DEFAULT_SALE_TEMPLATE,
  rental: DEFAULT_RENTAL_TEMPLATE
}

export const DashboardSummarySchema = z.object({
  totalLeads: z.number().int().nonnegative(),
  readyToShow: z.number().int().nonnegative(),
  appointmentBooked: z.number().int().nonnegative(),
  nurture: z.number().int().nonnegative(),
  hold: z.number().int().nonnegative(),
  averageScore: z.number().nonnegative()
})

export const CreateInviteResponseSchema = z.object({
  token: z.string().min(1),
  shareUrl: z.string().url(),
  expiresAt: z.string().datetime()
})

export const LeadStageMutationSchema = z.object({
  pipelineStage: z.enum([
    "ready_to_show",
    "nurture",
    "hold",
    "closed_won",
    "closed_lost",
    "archived"
  ])
})

export const ReviewLeadSchema = z.object({
  leadId: z.string().min(1),
  pipelineStage: z.enum(["ready_to_show", "nurture", "hold"])
})

export const AppointmentMutationSchema = z.object({
  appointmentId: z.string().min(1).optional(),
  leadId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  notes: z.string().optional(),
  showings: z
    .array(
      z.object({
        address: z.string().min(1),
        notes: z.string().optional()
      })
    )
    .min(1)
})

export const AppointmentStatusSchema = z.object({
  appointmentId: z.string().min(1),
  status: z.enum(["scheduled", "completed", "cancelled"])
})

export const SettingsMutationSchema = z.object({
  fullName: z.string().min(1),
  brokerage: z.string().optional(),
  licenseNumber: z.string().optional(),
  notificationPreference: z.enum(["email", "email_and_push"])
})
