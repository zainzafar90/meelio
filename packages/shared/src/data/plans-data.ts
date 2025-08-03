import { PlanInterval } from "../types/subscription";

export interface PlanData {
  id: PlanInterval;
  value: PlanInterval;
  title: string;
  label: string;
  price: number;
  priceLabel: string;
  priceLabelDescription: string;
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
    priceLabelDescription:"Billed monthly",
    description: "Cancel anytime",
    trial: "",
  },
  {
    id: PlanInterval.Yearly,
    value: PlanInterval.Yearly,
    title: "Annual",
    label: "Yearly",
    price: 30,
    priceDisplay: "$30",
    priceLabel: "/yr",
    priceLabelDescription:"Equivalent to $2.50/month",
    description: "Cancel anytime",
    discount: "20% off",
    trial: "",
  },
  {
    id: PlanInterval.Lifetime,
    value: PlanInterval.Lifetime,
    title: "Lifetime",
    label: "Lifetime",
    price: 89,
    priceDisplay: "$89",
    priceLabel: "",
    priceLabelDescription:"One-time payment",
    description: "No recurring fees",
    trial: "",
  },
];
