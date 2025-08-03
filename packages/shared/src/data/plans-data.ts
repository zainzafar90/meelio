import { PlanInterval } from "../types/subscription";

export interface PlanData {
  id: PlanInterval;
  value: PlanInterval;
  title: string;
  label: string;
  price: number;
  priceLabel: string;
  priceDisplay: string;
  description: string;
  discount?: string;
  trial?: string;
}

export const plansData: PlanData[] = [
  {
    id: PlanInterval.Monthly,
    value: PlanInterval.Monthly,
    title: "Monthly",
    label: "Monthly",
    price: 3,
    priceDisplay: "$3",
    priceLabel: "/mo",
    description: "Billed monthly — cancel anytime",
    trial: "14-day money-back guarantee",
  },
  {
    id: PlanInterval.Yearly,
    value: PlanInterval.Yearly,
    title: "Annual",
    label: "Yearly",
    price: 30,
    priceDisplay: "$30",
    priceLabel: "/yr",
    description: "Billed annually — save 20% (equivalent to $2.50/month; cancel anytime)",
    discount: "20% off",
    trial: "14-day money-back guarantee",
  },
  {
    id: PlanInterval.Lifetime,
    value: PlanInterval.Lifetime,
    title: "Lifetime",
    label: "Lifetime",
    price: 89,
    priceDisplay: "$89",
    priceLabel: "",
    description: "Lifetime access — one-time payment, no recurring fees",
  },
];
