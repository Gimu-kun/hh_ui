export interface ElementData {
  symbol: string;
  name: string;
  z: number;
  mass: number;
  valence: number[];
  type: string;
  type_label?: string;
  activity: number | null;
  groups: string[];
}

export interface CompoundData {
  formula: string;
  name: string;
  class: string;
  class_label?: string;
  ontology?: string[];
  composition?: Record<string, number>;
  state: string;
  state_label?: string;
  soluble: string;
  soluble_label?: string;
  charge: number;
  molar_mass?: number;
}

export interface ReactionData {
  id: string;
  reactants: string[];
  products: string[];
  coefficients: number[];
  condition?: string;
  condition_label?: string;
  condition_symbol?: string;
  type: string;
  type_label?: string;
  condition_raw?: string;
  source?: string;
}

export interface RuleData {
  id: string;
  if_text: string;
  then_text: string;
  group?: string;
  type?: string;
  priority?: number;
  match?: Record<string, any>;
}

export interface ConditionData {
  code: string;
  name: string;
  symbol?: string;
  complexity: number;
  description?: string;
}

export interface HeuristicData {
  id: string;
  name: string;
  kind: string;
  weight?: number;
  penalties?: Record<string, number>;
  rules?: string[];
}

export interface FormulaData {
  id: string;
  expression: string;
  description: string;
  value?: number | null;
}

export interface ReagentData {
  formula: string;
  group?: string;
  note?: string;
}

export interface TemplateData {
  id: string;
  problem: string;
  description?: string;
  content: string;
}

export interface BalanceSolution {
  problem: 'balance';
  input: string;
  reactants: string[];
  products: string[];
  coefficients: number[];
  balanced: string;
  steps: string[];
  explanation: string;
}

export interface ChainReactionStep {
  index: number;
  reaction_id: string;
  from: string;
  to: string;
  equation: string;
  condition: string | null;
  condition_label: string;
  type?: string;
  type_label?: string;
  auxiliaries: string[];
  byproducts: string[];
  rule_id?: string | null;
  rule_text?: string;
}

export interface ChainSolution {
  problem: 'chain';
  found: boolean;
  start: string;
  target: string;
  reactions: ChainReactionStep[];
  answer: string;
  steps: string[];
  explanation: string;
}

export interface QuantityKnown {
  formula: string;
  kind: 'mass' | 'volume' | 'mole';
  value: number;
  moles?: number;
  molar_mass?: number;
}

export interface QuantityFind {
  formula: string;
  kind: 'mass' | 'volume' | 'mole';
  value: number;
  unit: string;
  display: string;
  moles?: number;
  molar_mass?: number;
}

export interface QuantitySolution {
  problem: 'quantity';
  input: string;
  balanced: string;
  known: QuantityKnown;
  find: QuantityFind;
  steps: string[];
  explanation: string;
}

export interface MetaData {
  model: string;
  counts: {
    elements: number;
    compounds: number;
    reactions: number;
    rules: number;
    conditions: number;
    heuristics: number;
    formulas: number;
    reagents: number;
    templates: number;
  };
  activity_series: string[];
}

export type AppView =
  | 'balance'
  | 'chain'
  | 'quantity'
  | 'substance'
  | 'periodic'
  | 'activity'
  | 'crud';

export type CrudResource =
  | 'elements'
  | 'compounds'
  | 'reactions'
  | 'rules'
  | 'conditions'
  | 'heuristics'
  | 'formulas'
  | 'reagents'
  | 'templates';
