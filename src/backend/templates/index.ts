import type { CustomFieldEntity, CustomFieldType } from "@prisma/client";

export type TemplateField = {
  entity: CustomFieldEntity;
  key: string;
  label: string;
  type: CustomFieldType;
  options?: string[];
  showInList?: boolean;
};

export type Template = {
  id: string;
  label: string;
  settings: {
    units: string[];
    defaultTaxRate: number;
  };
  customFields: TemplateField[];
};

const lights: Template = {
  id: "lights",
  label: "Lights & Electricals (manufacturing)",
  settings: {
    units: ["pcs", "set", "mtr", "box"],
    defaultTaxRate: 18,
  },
  customFields: [
    { entity: "ITEM", key: "wattage", label: "Wattage (W)", type: "NUMBER", showInList: true },
    {
      entity: "ITEM",
      key: "cct",
      label: "CCT",
      type: "SELECT",
      options: ["2700K", "3000K", "4000K", "5000K", "6500K"],
      showInList: true,
    },
    { entity: "ITEM", key: "lumens", label: "Lumens", type: "NUMBER" },
    {
      entity: "ITEM",
      key: "ip_rating",
      label: "IP Rating",
      type: "SELECT",
      options: ["IP20", "IP44", "IP54", "IP65", "IP66", "IP67"],
    },
    { entity: "ITEM", key: "body_color", label: "Body Color", type: "TEXT" },
    { entity: "ITEM", key: "warranty_months", label: "Warranty (months)", type: "NUMBER" },
    { entity: "CONTACT", key: "territory", label: "Territory", type: "TEXT", showInList: true },
    { entity: "CONTACT", key: "sales_manager", label: "Sales Manager", type: "TEXT" },
  ],
};

const custom: Template = {
  id: "custom",
  label: "Custom (start blank)",
  settings: { units: ["pcs", "box", "kg"], defaultTaxRate: 0 },
  customFields: [],
};

const all: Record<string, Template> = { lights, custom };

export const templateList = Object.values(all);
export const getTemplate = (id: string) => all[id] ?? custom;