export type pinPicture = { id: string; emoji: string; label: string };

export const PIN_PICTURES: pinPicture [] = [
    { id: "dog", emoji: "🐶", label: "Dog" },
  { id: "cat", emoji: "🐱", label: "Cat" },
  { id: "fox", emoji: "🦊", label: "Fox" },
  { id: "frog", emoji: "🐸", label: "Frog" },
  { id: "apple", emoji: "🍎", label: "Apple" },
  { id: "moon", emoji: "🌙", label: "Moon" },
  { id: "star", emoji: "⭐", label: "Star" },
  { id: "car", emoji: "🚗", label: "Car" },
  { id: "balloon", emoji: "🎈", label: "Balloon" },
];

export const PIN_LENGTH = 3

export function pictureById(id: string) {
    return PIN_PICTURES.find((picture) => picture.id === id);
}