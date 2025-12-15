'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Packet, AnimationPhase } from '@/types/packet';
import { OSI_LAYERS } from '@/data/osiLayers';
import { Play, Pause, RotateCcw, Zap, Server, Monitor, Wifi } from 'lucide-react';

interface TransmissionVisualizationProps {
  packet: Packet;
  autoPlay?: boolean;
  speed?: number;
}

interface NetworkNode {
  id: string;
  type: 'client' | 'router' | 'server';
  label: string;
  x: number;
  y: number;
}

const NODES: NetworkNode[] = [
  { id: 'client', type: 'client', label: 'Client', x: 50, y: 200 },
  { id: 'router1', type: 'router', label: 'Router 1', x: 250, y: 200 },
  { id: 'router2', type: 'router', label: 'Router 2', x: 450, y: 200 },
  { id: 'server', type: 'server', label: 'Server', x: 650, y: 200 },
];

export function TransmissionVisualization({
  packet,
  autoPlay = false,
  speed = 1
}: TransmissionVisualizationProps) {
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [currentNode, setCurrentNode] = useState(0);
  const [packetPosition, setPacketPosition] = useState({ x: 50, y: 200 });
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [ttl, setTtl] = useState(packet.metadata.ttl);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 9)]);
  }, []);

  useEffect(() => {
    if (!isPlaying || phase === 'complete') return;

    const interval = setInterval(() => {
      if (phase === 'idle') {
        setPhase('building');
        addLog('패킷 생성 시작...');
      } else if (phase === 'building') {
        setPhase('encapsulating');
        addLog('헤더 캡슐화 진행 중...');
      } else if (phase === 'encapsulating') {
        setPhase('transmitting');
        setCurrentNode(0);
        addLog('전송 시작!');
      } else if (phase === 'transmitting') {
        if (currentNode < NODES.length - 1) {
          const nextNode = currentNode + 1;
          setCurrentNode(nextNode);
          setPacketPosition({ x: NODES[nextNode].x, y: NODES[nextNode].y });
          setTtl(prev => prev - 1);
          addLog(`${NODES[nextNode].label} 도착 (TTL: ${ttl - 1})`);

          if (nextNode === NODES.length - 1) {
            setPhase('decapsulating');
            addLog('목적지 도착! 역캡슐화 시작...');
          }
        }
      } else if (phase === 'decapsulating') {
        setPhase('receiving');
        addLog('헤더 제거 완료');
      } else if (phase === 'receiving') {
        setPhase('complete');
        setIsPlaying(false);
        addLog('✓ 전송 완료!');
      }
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [isPlaying, phase, currentNode, ttl, speed, addLog]);

  const reset = () => {
    setPhase('idle');
    setCurrentNode(0);
    setPacketPosition({ x: 50, y: 200 });
    setTtl(packet.metadata.ttl);
    setIsPlaying(false);
    setLogs([]);
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'client': return <Monitor size={24} />;
      case 'router': return <Wifi size={24} />;
      case 'server': return <Server size={24} />;
      default: return null;
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">패킷 전송 시각화</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            disabled={phase === 'complete'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={reset}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* Network Diagram */}
      <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ height: 300 }}>
        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full">
          {NODES.slice(0, -1).map((node, i) => (
            <line
              key={i}
              x1={node.x + 25}
              y1={node.y}
              x2={NODES[i + 1].x - 25}
              y2={NODES[i + 1].y}
              stroke={i < currentNode && phase !== 'idle' ? '#4ade80' : '#4b5563'}
              strokeWidth={3}
              strokeDasharray={i < currentNode && phase !== 'idle' ? '0' : '8,8'}
            />
          ))}
        </svg>

        {/* Network Nodes */}
        {NODES.map((node, i) => (
          <motion.div
            key={node.id}
            className={`absolute flex flex-col items-center transition-all duration-300`}
            style={{ left: node.x - 30, top: node.y - 60 }}
            animate={{
              scale: i === currentNode && phase === 'transmitting' ? 1.1 : 1,
            }}
          >
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                i <= currentNode && phase !== 'idle'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {getNodeIcon(node.type)}
            </div>
            <span className="mt-2 text-xs text-white font-medium">{node.label}</span>
            {node.type === 'client' && (
              <span className="text-[10px] text-gray-400">{packet.source.ip}</span>
            )}
            {node.type === 'server' && (
              <span className="text-[10px] text-gray-400">{packet.destination.ip}</span>
            )}
          </motion.div>
        ))}

        {/* Animated Packet */}
        <AnimatePresence>
          {(phase === 'transmitting' || phase === 'decapsulating') && (
            <motion.div
              className="absolute"
              initial={{ x: NODES[0].x - 15, y: NODES[0].y + 20 }}
              animate={{ x: packetPosition.x - 15, y: packetPosition.y + 20 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            >
              <div className="relative">
                <motion.div
                  className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center"
                  animate={{
                    boxShadow: [
                      '0 0 10px rgba(59, 130, 246, 0.5)',
                      '0 0 20px rgba(59, 130, 246, 0.8)',
                      '0 0 10px rgba(59, 130, 246, 0.5)'
                    ]
                  }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Zap size={16} className="text-white" />
                </motion.div>
                {/* Packet trail */}
                <motion.div
                  className="absolute top-0 left-0 w-8 h-8 bg-blue-500/20 rounded-lg"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase Indicator */}
        <div className="absolute top-4 right-4">
          <PhaseIndicator phase={phase} />
        </div>

        {/* TTL Counter */}
        <div className="absolute bottom-4 left-4 bg-black/50 rounded-lg px-3 py-2">
          <span className="text-xs text-gray-400">TTL: </span>
          <span className={`font-mono font-bold ${ttl < 32 ? 'text-orange-400' : 'text-green-400'}`}>
            {ttl}
          </span>
        </div>
      </div>

      {/* Packet Info Bar */}
      <div className="mt-4 flex gap-2 flex-wrap">
        <InfoBadge label="Type" value={packet.type} color={OSI_LAYERS.transport.color} />
        <InfoBadge label="Size" value={`${packet.size}B`} color="#6b7280" />
        <InfoBadge label="Src" value={`${packet.source.ip}:${packet.source.port}`} color="#3b82f6" />
        <InfoBadge label="Dst" value={`${packet.destination.ip}:${packet.destination.port}`} color="#8b5cf6" />
        {packet.flags.length > 0 && (
          <InfoBadge label="Flags" value={packet.flags.join(',')} color="#f59e0b" />
        )}
      </div>

      {/* Log Panel */}
      <div className="mt-4 bg-black/50 rounded-lg p-3 h-32 overflow-y-auto">
        <div className="text-xs text-gray-400 mb-2">전송 로그</div>
        <div className="space-y-1">
          {logs.length === 0 ? (
            <div className="text-xs text-gray-500">Play 버튼을 눌러 시작하세요</div>
          ) : (
            logs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-mono text-green-400"
              >
                {log}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PhaseIndicator({ phase }: { phase: AnimationPhase }) {
  const phases: { key: AnimationPhase; label: string }[] = [
    { key: 'idle', label: '대기' },
    { key: 'building', label: '생성' },
    { key: 'encapsulating', label: '캡슐화' },
    { key: 'transmitting', label: '전송' },
    { key: 'decapsulating', label: '역캡슐화' },
    { key: 'receiving', label: '수신' },
    { key: 'complete', label: '완료' },
  ];

  return (
    <div className="flex gap-1">
      {phases.map(p => (
        <div
          key={p.key}
          className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
            phase === p.key
              ? 'bg-blue-600 text-white scale-110'
              : 'bg-gray-700/50 text-gray-500'
          }`}
        >
          {p.label}
        </div>
      ))}
    </div>
  );
}

function InfoBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="px-2 py-1 rounded-lg text-xs"
      style={{ backgroundColor: `${color}20`, color }}
    >
      <span className="opacity-70">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
