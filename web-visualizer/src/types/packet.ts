// OSI 7 Layer Types
export type OSILayer = 'application' | 'presentation' | 'session' | 'transport' | 'network' | 'datalink' | 'physical';

export interface LayerInfo {
  name: string;
  number: number;
  color: string;
  description: string;
  protocols: string[];
  headerSize: number;
  headerFields: HeaderField[];
}

export interface HeaderField {
  name: string;
  bits: number;
  value?: string | number;
  description: string;
}

// Packet Types
export type PacketType = 'TCP' | 'UDP' | 'ICMP' | 'HTTP';

export interface Packet {
  id: string;
  timestamp: string;
  type: PacketType;
  source: {
    ip: string;
    port: number;
  };
  destination: {
    ip: string;
    port: number;
  };
  size: number;
  payload: string;
  flags: string[];
  metadata: {
    ttl: number;
    protocol: string;
    sequence: number;
  };
}

// Encapsulation step for animation
export interface EncapsulationStep {
  layer: OSILayer;
  layerNumber: number;
  header: string;
  data: string;
  totalSize: number;
  description: string;
}

// Animation state
export type AnimationPhase =
  | 'idle'
  | 'building'
  | 'encapsulating'
  | 'transmitting'
  | 'decapsulating'
  | 'receiving'
  | 'complete';

export interface TransmissionState {
  phase: AnimationPhase;
  currentStep: number;
  totalSteps: number;
  packet: Packet | null;
  encapsulationSteps: EncapsulationStep[];
  progress: number;
}
