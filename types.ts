export enum QuantumType {
  S = 's',
  P = 'p',
  D = 'd',
  F = 'f'
}

export interface OrbitalState {
  n: number; // Principal quantum number
  l: number; // Azimuthal quantum number
  m: number; // Magnetic quantum number
  name: string;
}

export interface OrbitalConclusion {
  symmetry: string;
  nodes: number | string;
  energy: string;
  maxRadius: string;
  context: string;
}

export interface OrbitalDescription {
  text: string;
  equation: string;
  conclusion?: OrbitalConclusion;
}
