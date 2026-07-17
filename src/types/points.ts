// Points/Credits system types

export type PointsPackage = 'basic' | 'professional' | 'enterprise'

export interface PointsPlan {
  id: string
  name: string
  description: string
  price: number // in rupees
  points: number
  bonusPoints?: number // extra points as bonus
  popular?: boolean
  value?: string // e.g., "Best Value", "Most Popular"
  stripePriceId?: string
  features: string[]
}

export interface PointsTransaction {
  id: string
  userId: string
  type: 'purchase' | 'usage' | 'refund' | 'bonus'
  amount: number // positive for purchase/bonus, negative for usage
  description: string
  createdAt: Date
  metadata?: Record<string, unknown>
}

export interface UserPoints {
  userId: string
  balance: number
  totalPurchased: number
  totalUsed: number
  lastUpdated: Date
}

// Point costs for different exports
export const POINT_COSTS = {
  FRONT_IMAGE: 1,
  BACK_IMAGE: 1,
  SLEEVE: 1, // per sleeve
  COLLAR: 1,
  FULL_JERSEY: 4, // front + back + left + right
  FULL_JERSEY_WITH_COLLAR: 5, // front + back + left + right + collar
} as const

// Points packages
export const POINTS_PLANS: PointsPlan[] = [
  {
    id: 'basic',
    name: 'Basic Package',
    description: 'Great for getting started with jersey design exports',
    price: 1000,
    points: 700,
    bonusPoints: 0,
    value: '₹1.43 per point',
    stripePriceId: 'price_basic_points',
    features: [
      '450 DPI exports',
      'Bulk roster import/export',
      'Standard fonts',
      'Standard support',
    ]
  },
  {
    id: 'professional',
    name: 'Professional Package',
    description: 'Best value for professional designers and studios',
    price: 2500,
    points: 2000,
    bonusPoints: 200,
    popular: true,
    value: 'Best Value - ₹1.14 per point',
    stripePriceId: 'price_professional_points',
    features: [
      '450 DPI exports',
      'Bulk roster import/export',
      'Access to premium design templates',
      'Expanded font library',
      'Priority support',
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Package',
    description: 'Custom solutions for large teams and organisations',
    price: 0, // Custom pricing
    points: 0, // Custom points
    value: 'Contact for pricing',
    stripePriceId: undefined,
    features: [
      '450 DPI exports',
      'Bulk roster import/export',
      'Access to premium design templates',
      'Expanded font library',
      'One-on-one onboarding & dedicated support',
      'Custom team/account setup',
    ]
  }
]

// Helper functions
export const getPointsPlanById = (id: string): PointsPlan | undefined => {
  return POINTS_PLANS.find(plan => plan.id === id)
}

export const calculateTotalPoints = (plan: PointsPlan): number => {
  return plan.points + (plan.bonusPoints || 0)
}

export const calculatePointsPerRupee = (plan: PointsPlan): number => {
  if (plan.price === 0) return 0
  return calculateTotalPoints(plan) / plan.price
}

export const calculateExportsPossible = (points: number): {
  frontOnly: number
  backOnly: number
  fullJersey: number
  fullJerseyWithCollar: number
} => {
  return {
    frontOnly: Math.floor(points / POINT_COSTS.FRONT_IMAGE),
    backOnly: Math.floor(points / POINT_COSTS.BACK_IMAGE),
    fullJersey: Math.floor(points / POINT_COSTS.FULL_JERSEY),
    fullJerseyWithCollar: Math.floor(points / POINT_COSTS.FULL_JERSEY_WITH_COLLAR)
  }
}

export const calculateExportCost = (exportType: 'front' | 'back' | 'sleeve' | 'collar' | 'full' | 'fullWithCollar'): number => {
  switch (exportType) {
    case 'front':
      return POINT_COSTS.FRONT_IMAGE
    case 'back':
      return POINT_COSTS.BACK_IMAGE
    case 'sleeve':
      return POINT_COSTS.SLEEVE
    case 'collar':
      return POINT_COSTS.COLLAR
    case 'full':
      return POINT_COSTS.FULL_JERSEY
    case 'fullWithCollar':
      return POINT_COSTS.FULL_JERSEY_WITH_COLLAR
    default:
      return 0
  }
}

export const formatPoints = (points: number): string => {
  return new Intl.NumberFormat('en-IN').format(points)
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount)
}

