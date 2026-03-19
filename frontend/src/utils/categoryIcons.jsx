import React from 'react'
import {
  Briefcase,
  Bus,
  Car,
  Coffee,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  PiggyBank,
  Receipt,
  ShoppingBag,
  Sparkles,
  TreePalm,
  TrendingUp,
  Utensils,
  Wallet,
  Wrench,
} from 'lucide-react'

const ICON_COMPONENTS = {
  briefcase: Briefcase,
  bus: Bus,
  car: Car,
  coffee: Coffee,
  gift: Gift,
  graduation: GraduationCap,
  health: HeartPulse,
  house: House,
  investment: TrendingUp,
  landmark: Landmark,
  piggybank: PiggyBank,
  receipt: Receipt,
  shopping: ShoppingBag,
  sparkles: Sparkles,
  utensils: Utensils,
  wallet: Wallet,
  wrench: Wrench,
}

export const CATEGORY_ICON_OPTIONS = [
  { key: 'utensils', label: 'Food', Icon: Utensils },
  { key: 'car', label: 'Transport', Icon: Car },
  { key: 'house', label: 'Home', Icon: House },
  { key: 'receipt', label: 'Utilities', Icon: Receipt },
  { key: 'health', label: 'Health', Icon: HeartPulse },
  { key: 'shopping', label: 'Shopping', Icon: ShoppingBag },
  { key: 'graduation', label: 'Education', Icon: GraduationCap },
  { key: 'investment', label: 'Investment', Icon: TrendingUp },
  { key: 'landmark', label: 'Bank', Icon: Landmark },
  { key: 'briefcase', label: 'Work', Icon: Briefcase },
  { key: 'gift', label: 'Gift', Icon: Gift },
  { key: 'wallet', label: 'Wallet', Icon: Wallet },
  { key: 'treepalm', label: 'Leisure', Icon: TreePalm },
  { key: 'bus', label: 'Transit', Icon: Bus },
  { key: 'coffee', label: 'Cafe', Icon: Coffee },
  { key: 'wrench', label: 'Tools', Icon: Wrench },
  { key: 'piggybank', label: 'Savings', Icon: PiggyBank },
]

export function resolveCategoryIconKey(rawIcon) {
  if (!rawIcon) return ''
  if (ICON_COMPONENTS[rawIcon]) return rawIcon
  return ''
}

export function renderCategoryIcon(rawIcon, className = 'w-5 h-5') {
  const key = resolveCategoryIconKey(rawIcon)
  const Icon = ICON_COMPONENTS[key]
  if (!Icon) return null
  return <Icon className={className} strokeWidth={2} />
}
