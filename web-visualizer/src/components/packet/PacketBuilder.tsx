'use client';

import { useState } from 'react';
import { Packet, PacketType } from '@/types/packet';

interface PacketBuilderProps {
  onPacketCreated: (packet: Packet) => void;
}

export function PacketBuilder({ onPacketCreated }: PacketBuilderProps) {
  const [formData, setFormData] = useState({
    type: 'TCP' as PacketType,
    sourceIp: '192.168.1.100',
    sourcePort: 43034,
    destIp: '10.0.0.1',
    destPort: 80,
    payload: 'Hello, World!',
    flags: ['SYN'] as string[],
    ttl: 64,
  });

  const generatePacket = (): Packet => {
    const now = new Date();
    return {
      id: crypto.randomUUID(),
      timestamp: now.toISOString(),
      type: formData.type,
      source: {
        ip: formData.sourceIp,
        port: formData.sourcePort,
      },
      destination: {
        ip: formData.destIp,
        port: formData.destPort,
      },
      size: new TextEncoder().encode(formData.payload).length,
      payload: formData.payload,
      flags: formData.flags,
      metadata: {
        ttl: formData.ttl,
        protocol: 'IPv4',
        sequence: Math.floor(Math.random() * 1000000),
      },
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const packet = generatePacket();
    onPacketCreated(packet);
  };

  const toggleFlag = (flag: string) => {
    setFormData(prev => ({
      ...prev,
      flags: prev.flags.includes(flag)
        ? prev.flags.filter(f => f !== flag)
        : [...prev.flags, flag]
    }));
  };

  const tcpFlags = ['SYN', 'ACK', 'FIN', 'RST', 'PSH', 'URG'];
  const packetTypes: PacketType[] = ['TCP', 'UDP', 'ICMP', 'HTTP'];

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h3 className="text-lg font-bold text-white mb-4">패킷 생성기</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Packet Type */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">패킷 타입</label>
          <div className="flex gap-2">
            {packetTypes.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  formData.type === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Source */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Source IP</label>
            <input
              type="text"
              value={formData.sourceIp}
              onChange={e => setFormData(prev => ({ ...prev, sourceIp: e.target.value }))}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Source Port</label>
            <input
              type="number"
              value={formData.sourcePort}
              onChange={e => setFormData(prev => ({ ...prev, sourcePort: parseInt(e.target.value) }))}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Destination */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Dest IP</label>
            <input
              type="text"
              value={formData.destIp}
              onChange={e => setFormData(prev => ({ ...prev, destIp: e.target.value }))}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Dest Port</label>
            <input
              type="number"
              value={formData.destPort}
              onChange={e => setFormData(prev => ({ ...prev, destPort: parseInt(e.target.value) }))}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* TTL */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">TTL (Time To Live)</label>
          <input
            type="range"
            min="1"
            max="255"
            value={formData.ttl}
            onChange={e => setFormData(prev => ({ ...prev, ttl: parseInt(e.target.value) }))}
            className="w-full"
          />
          <div className="text-right text-sm text-gray-400">{formData.ttl}</div>
        </div>

        {/* TCP Flags */}
        {(formData.type === 'TCP') && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">TCP Flags</label>
            <div className="flex flex-wrap gap-2">
              {tcpFlags.map(flag => (
                <button
                  key={flag}
                  type="button"
                  onClick={() => toggleFlag(flag)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    formData.flags.includes(flag)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {flag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Payload */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Payload</label>
          <textarea
            value={formData.payload}
            onChange={e => setFormData(prev => ({ ...prev, payload: e.target.value }))}
            rows={3}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="Enter payload data..."
          />
          <div className="text-right text-xs text-gray-500">
            {new TextEncoder().encode(formData.payload).length} bytes
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium text-white transition-all transform hover:scale-[1.02]"
        >
          패킷 생성 및 시각화 →
        </button>
      </form>
    </div>
  );
}
