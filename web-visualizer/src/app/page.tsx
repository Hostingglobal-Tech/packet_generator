'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Packet } from '@/types/packet';
import {
  PacketBuilder,
  PacketStructure,
  OSILayerStack,
  EncapsulationAnimation,
  TransmissionVisualization,
  TCPHandshake,
  WiresharkView
} from '@/components/packet';
import { Network, Layers, Box, Send, Info, Handshake, Binary } from 'lucide-react';

type ViewMode = 'builder' | 'structure' | 'wireshark' | 'encapsulation' | 'transmission' | 'handshake' | 'osi';

export default function Home() {
  const [currentPacket, setCurrentPacket] = useState<Packet | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('builder');

  const views: { key: ViewMode; label: string; icon: React.ReactNode; requiresPacket: boolean }[] = [
    { key: 'builder', label: '패킷 생성', icon: <Box size={18} />, requiresPacket: false },
    { key: 'structure', label: '패킷 구조', icon: <Layers size={18} />, requiresPacket: true },
    { key: 'wireshark', label: 'Wireshark', icon: <Binary size={18} />, requiresPacket: true },
    { key: 'encapsulation', label: '캡슐화', icon: <Network size={18} />, requiresPacket: true },
    { key: 'transmission', label: '전송', icon: <Send size={18} />, requiresPacket: true },
    { key: 'handshake', label: 'TCP Handshake', icon: <Handshake size={18} />, requiresPacket: false },
    { key: 'osi', label: 'OSI 모델', icon: <Info size={18} />, requiresPacket: false },
  ];

  const handlePacketCreated = (packet: Packet) => {
    setCurrentPacket(packet);
    setViewMode('wireshark');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-black/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Network size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Packet Visualizer</h1>
                <p className="text-xs text-gray-400">네트워크 패킷 구조 및 통신 시각화</p>
              </div>
            </div>

            {currentPacket && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">현재 패킷:</span>
                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded font-mono">
                  {currentPacket.type} | {currentPacket.source.ip}:{currentPacket.source.port}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-black/20 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 py-2 overflow-x-auto">
            {views.map(view => (
              <button
                key={view.key}
                onClick={() => setViewMode(view.key)}
                disabled={view.requiresPacket && !currentPacket}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  viewMode === view.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                {view.icon}
                {view.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {viewMode === 'builder' && (
            <div className="max-w-2xl mx-auto">
              <PacketBuilder onPacketCreated={handlePacketCreated} />
            </div>
          )}

          {viewMode === 'structure' && currentPacket && (
            <div className="max-w-3xl mx-auto">
              <PacketStructure packet={currentPacket} />
            </div>
          )}

          {viewMode === 'wireshark' && currentPacket && (
            <div className="max-w-5xl mx-auto">
              <WiresharkView packet={currentPacket} />
            </div>
          )}

          {viewMode === 'encapsulation' && currentPacket && (
            <div className="max-w-2xl mx-auto">
              <EncapsulationAnimation packet={currentPacket} />
            </div>
          )}

          {viewMode === 'transmission' && currentPacket && (
            <div className="max-w-4xl mx-auto">
              <TransmissionVisualization packet={currentPacket} />
            </div>
          )}

          {viewMode === 'handshake' && (
            <div className="max-w-4xl mx-auto">
              <TCPHandshake />
            </div>
          )}

          {viewMode === 'osi' && (
            <div className="max-w-lg mx-auto">
              <OSILayerStack
                showDetails={true}
                encapsulatedLayers={['application', 'presentation', 'session', 'transport', 'network', 'datalink', 'physical']}
              />
            </div>
          )}
        </motion.div>

        {/* Quick Info Panel */}
        {!currentPacket && views.find(v => v.key === viewMode)?.requiresPacket && (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Box size={32} className="text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">패킷을 먼저 생성하세요</h2>
            <p className="text-gray-400 mb-4">
              시각화를 시작하려면 &ldquo;패킷 생성&rdquo; 탭에서 패킷을 만드세요
            </p>
            <button
              onClick={() => setViewMode('builder')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition"
            >
              패킷 생성하기
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-black/30 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Packet Generator Visualizer</span>
            <div className="flex items-center gap-4">
              <span>TCP/IP Stack Visualization</span>
              <span>OSI 7 Layer Model</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
