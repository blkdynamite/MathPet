import { ShopItem } from "./types";

export const SHOP: ShopItem[] = [
  { id: "hat-wizard", name: "Wizard Hat", kind: "hat", price: 50, emoji: "🧙", effect: "Look magical" },
  { id: "hat-astro", name: "Astronaut Helmet", kind: "hat", price: 100, emoji: "🧑‍🚀", effect: "Space ready" },
  { id: "hat-cape", name: "Superhero Cape", kind: "hat", price: 150, emoji: "🦸", effect: "Fly around" },
  { id: "food-cupcake", name: "Cupcake", kind: "food", price: 20, emoji: "🧁", effect: "+5 XP" },
  { id: "food-pizza", name: "Pizza Slice", kind: "food", price: 40, emoji: "🍕", effect: "+15 XP" },
  { id: "food-smoothie", name: "Rainbow Smoothie", kind: "food", price: 75, emoji: "🥤", effect: "Rainbow dance" },
  { id: "bg-space", name: "Space Background", kind: "background", price: 100, emoji: "🌌", effect: "Nebula sky" },
  { id: "bg-jungle", name: "Jungle Background", kind: "background", price: 100, emoji: "🌴", effect: "Tropical vibes" },
];

export function getItem(id: string) {
  return SHOP.find((i) => i.id === id);
}
