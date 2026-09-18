export type CategoryId =
  | "ai-ml"
  | "computer-vision"
  | "llm-rag"
  | "fpga"
  | "embedded"
  | "robotics"
  | "web"
  | "hpc";

/** Visual motif used by scripts/generate-thumbnails.ts for each category. */
export type Motif =
  | "neural"
  | "segmentation"
  | "chat"
  | "circuit"
  | "pcb"
  | "path"
  | "ledger"
  | "grid";

export interface Category {
  id: CategoryId;
  label: string;
  short: string;
  blurb: string;
  /** Category tint used for badges and thumbnail accents (light mode). */
  hue: string;
  motif: Motif;
}

export const categories: Category[] = [
  {
    id: "ai-ml",
    label: "AI & Machine Learning",
    short: "AI / ML",
    blurb: "Classifiers, ensembles, recommenders and deep networks trained end to end.",
    hue: "#2F5F63",
    motif: "neural",
  },
  {
    id: "computer-vision",
    label: "Computer Vision",
    short: "Vision",
    blurb: "Segmentation, detection and classical pipelines, from notebooks to edge devices.",
    hue: "#5B4B8A",
    motif: "segmentation",
  },
  {
    id: "llm-rag",
    label: "LLMs, RAG & Agents",
    short: "LLMs",
    blurb: "Retrieval pipelines, agent orchestration and production chat backends.",
    hue: "#B8412B",
    motif: "chat",
  },
  {
    id: "fpga",
    label: "FPGA & Digital Design",
    short: "FPGA",
    blurb: "RTL in SystemVerilog: processors, accelerators and hardware state machines.",
    hue: "#1F4E79",
    motif: "circuit",
  },
  {
    id: "embedded",
    label: "Embedded & IoT",
    short: "Embedded",
    blurb: "STM32, ESP32 and AVR systems with real sensors, RTOS tasks and cloud links.",
    hue: "#7A5C1E",
    motif: "pcb",
  },
  {
    id: "robotics",
    label: "Robotics",
    short: "Robotics",
    blurb: "Small autonomous robots built on Arduino with sensor-driven control loops.",
    hue: "#4E6B2F",
    motif: "path",
  },
  {
    id: "web",
    label: "Web & Product",
    short: "Web",
    blurb: "Shipped web apps with real users, AI features and careful data handling.",
    hue: "#0D7355",
    motif: "ledger",
  },
  {
    id: "hpc",
    label: "HPC & Systems",
    short: "Systems",
    blurb: "Parallel solvers, cache simulators and data pipelines for large compute.",
    hue: "#3E4A5C",
    motif: "grid",
  },
];

export const categoryById = Object.fromEntries(
  categories.map((c) => [c.id, c]),
) as Record<CategoryId, Category>;
