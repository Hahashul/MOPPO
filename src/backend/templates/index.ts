export type Template = {
  id: string;
  label: string;
  settings: {
    units: string[];
    defaultTaxRate: number;
    itemFields: { key: string; label: string; type: "text" | "number" }[];
  };
};

const lights: Template = {
  id: "lights",
  label: "Lights & Electricals (manufacturing)",
  settings: {
    units: ["pcs", "set", "mtr", "box"],
    defaultTaxRate: 18,
    itemFields: [
      { key: "wattage", label: "Wattage", type: "text" },
      { key: "cct", label: "CCT", type: "text" },
      { key: "lumens", label: "Lumens", type: "number" },
      { key: "ipRating", label: "IP Rating", type: "text" },
      { key: "bodyColor", label: "Body Color", type: "text" },
      { key: "warrantyMonths", label: "Warranty (months)", type: "number" },
    ],
  },
};

const custom: Template = {
  id: "custom",
  label: "Custom (start blank)",
  settings: { units: ["pcs", "box", "kg"], defaultTaxRate: 0, itemFields: [] },
};

const all: Record<string, Template> = { lights, custom };

export const templateList = Object.values(all);
export const getTemplate = (id: string) => all[id] ?? custom;