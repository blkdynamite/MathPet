import { ShopItem } from "./types";

// `effect` describes what buying the item actually does in this build. The
// old strings claimed XP that never existed and background scenes the game
// doesn't render; a kid saving 100 coins for a no-op is a trust bug.
export const SHOP: ShopItem[] = [
  { id: "hat-wizard", name: "Wizard Hat", kind: "hat", price: 50, emoji: "🧙", effect: "Style points" },
  { id: "hat-astro", name: "Astronaut Helmet", kind: "hat", price: 100, emoji: "🧑‍🚀", effect: "Space ready" },
  { id: "hat-cape", name: "Superhero Cape", kind: "hat", price: 150, emoji: "🦸", effect: "Fly around" },
  { id: "food-cupcake", name: "Cupcake", kind: "food", price: 20, emoji: "🧁", effect: "Feeds Sparky" },
  { id: "food-pizza", name: "Pizza Slice", kind: "food", price: 40, emoji: "🍕", effect: "Feeds Sparky" },
  { id: "food-smoothie", name: "Rainbow Smoothie", kind: "food", price: 75, emoji: "🥤", effect: "Rainbow feed" },
  { id: "bg-space", name: "Space Background", kind: "background", price: 100, emoji: "🌌", effect: "Coming soon" },
  { id: "bg-jungle", name: "Jungle Background", kind: "background", price: 100, emoji: "🌴", effect: "Coming soon" },
];

export function getItem(id: string) {
  return SHOP.find((i) => i.id === id);
}
