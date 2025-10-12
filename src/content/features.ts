export interface Feature {
  id: number;
  icon: string; // Heroicons name or asset URL
  title: string;
  description: string;
}

export const features: Feature[] = [
  {
    id: 1,
    icon: "clipboard-document-check", // Heroicons outline
    title: "Planuj treningi",
    description: "Twórz spersonalizowane plany treningowe dopasowane do Twoich celów i harmonogramu.",
  },
  {
    id: 2,
    icon: "fire", // Heroicons outline
    title: "Śledź progres",
    description: "Monitoruj swoje wyniki i obserwuj jak z każdym treningiem zbliżasz się do celu.",
  },
  {
    id: 3,
    icon: "presentation-chart-line", // Heroicons outline
    title: "Analizuj statystyki",
    description: "Wykresy i analizy pomogą Ci lepiej zrozumieć swoje postępy i zoptymalizować trening.",
  },
];
