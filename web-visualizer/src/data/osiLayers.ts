import { LayerInfo, OSILayer } from '@/types/packet';

export const OSI_LAYERS: Record<OSILayer, LayerInfo> = {
  application: {
    name: 'Application Layer',
    number: 7,
    color: '#FF6B6B',
    description: '사용자와 직접 상호작용하는 응용 프로그램 계층',
    protocols: ['HTTP', 'FTP', 'SMTP', 'DNS', 'SSH'],
    headerSize: 0,
    headerFields: [
      { name: 'HTTP Method', bits: 0, description: 'GET, POST, PUT, DELETE 등' },
      { name: 'URI', bits: 0, description: '요청 경로' },
      { name: 'Headers', bits: 0, description: 'Content-Type, Accept 등' },
    ]
  },
  presentation: {
    name: 'Presentation Layer',
    number: 6,
    color: '#FFA94D',
    description: '데이터 형식 변환, 암호화, 압축 담당',
    protocols: ['SSL/TLS', 'JPEG', 'MPEG', 'ASCII'],
    headerSize: 0,
    headerFields: [
      { name: 'Encryption', bits: 0, description: '암호화 정보' },
      { name: 'Compression', bits: 0, description: '압축 알고리즘' },
    ]
  },
  session: {
    name: 'Session Layer',
    number: 5,
    color: '#FFD93D',
    description: '통신 세션 설정, 유지, 종료 관리',
    protocols: ['NetBIOS', 'RPC', 'PPTP'],
    headerSize: 0,
    headerFields: [
      { name: 'Session ID', bits: 32, description: '세션 식별자' },
      { name: 'Sync Points', bits: 0, description: '동기화 지점' },
    ]
  },
  transport: {
    name: 'Transport Layer',
    number: 4,
    color: '#69DB7C',
    description: '종단 간 신뢰성 있는 데이터 전송',
    protocols: ['TCP', 'UDP'],
    headerSize: 20,
    headerFields: [
      { name: 'Source Port', bits: 16, value: 0, description: '출발지 포트 번호' },
      { name: 'Dest Port', bits: 16, value: 0, description: '목적지 포트 번호' },
      { name: 'Sequence', bits: 32, value: 0, description: '시퀀스 번호' },
      { name: 'Ack Number', bits: 32, value: 0, description: '확인 응답 번호' },
      { name: 'Flags', bits: 6, value: 0, description: 'SYN, ACK, FIN 등' },
      { name: 'Window', bits: 16, value: 65535, description: '윈도우 크기' },
      { name: 'Checksum', bits: 16, value: 0, description: '체크섬' },
    ]
  },
  network: {
    name: 'Network Layer',
    number: 3,
    color: '#4DABF7',
    description: '논리적 주소 지정 및 라우팅',
    protocols: ['IP', 'ICMP', 'IGMP', 'IPsec'],
    headerSize: 20,
    headerFields: [
      { name: 'Version', bits: 4, value: 4, description: 'IP 버전 (4 or 6)' },
      { name: 'IHL', bits: 4, value: 5, description: '헤더 길이' },
      { name: 'ToS', bits: 8, value: 0, description: '서비스 유형' },
      { name: 'Total Length', bits: 16, value: 0, description: '전체 길이' },
      { name: 'Identification', bits: 16, value: 0, description: '패킷 식별자' },
      { name: 'Flags', bits: 3, value: 0, description: '단편화 플래그' },
      { name: 'TTL', bits: 8, value: 64, description: 'Time To Live' },
      { name: 'Protocol', bits: 8, value: 6, description: '상위 프로토콜' },
      { name: 'Source IP', bits: 32, value: '0.0.0.0', description: '출발지 IP' },
      { name: 'Dest IP', bits: 32, value: '0.0.0.0', description: '목적지 IP' },
    ]
  },
  datalink: {
    name: 'Data Link Layer',
    number: 2,
    color: '#9775FA',
    description: '프레임 단위 전송, MAC 주소, 오류 검출',
    protocols: ['Ethernet', 'PPP', 'Wi-Fi', 'ARP'],
    headerSize: 18,
    headerFields: [
      { name: 'Dest MAC', bits: 48, value: 'FF:FF:FF:FF:FF:FF', description: '목적지 MAC 주소' },
      { name: 'Source MAC', bits: 48, value: '00:00:00:00:00:00', description: '출발지 MAC 주소' },
      { name: 'EtherType', bits: 16, value: '0x0800', description: '상위 프로토콜 타입' },
      { name: 'FCS', bits: 32, value: 0, description: '프레임 체크 시퀀스' },
    ]
  },
  physical: {
    name: 'Physical Layer',
    number: 1,
    color: '#F783AC',
    description: '비트 스트림 전송, 전기/광학 신호',
    protocols: ['Ethernet PHY', 'USB', 'Bluetooth', 'DSL'],
    headerSize: 8,
    headerFields: [
      { name: 'Preamble', bits: 56, description: '동기화 패턴 (10101010...)' },
      { name: 'SFD', bits: 8, description: 'Start Frame Delimiter' },
    ]
  }
};

export const LAYER_ORDER: OSILayer[] = [
  'application',
  'presentation',
  'session',
  'transport',
  'network',
  'datalink',
  'physical'
];

export const getLayerByNumber = (num: number): LayerInfo | undefined => {
  const layer = LAYER_ORDER.find(l => OSI_LAYERS[l].number === num);
  return layer ? OSI_LAYERS[layer] : undefined;
};
