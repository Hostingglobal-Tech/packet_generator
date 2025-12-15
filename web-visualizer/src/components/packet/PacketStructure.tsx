'use client';

import { motion } from 'framer-motion';
import { OSI_LAYERS } from '@/data/osiLayers';
import { Packet, OSILayer } from '@/types/packet';

interface PacketStructureProps {
  packet: Packet | null;
  showLayers?: OSILayer[];
  animated?: boolean;
}

export function PacketStructure({
  packet,
  showLayers = ['transport', 'network', 'datalink'],
  animated = true
}: PacketStructureProps) {
  if (!packet) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 text-center text-gray-400">
        패킷이 선택되지 않았습니다
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 overflow-hidden">
      <h3 className="text-lg font-bold text-white mb-4">패킷 구조</h3>

      <div className="space-y-2">
        {/* Ethernet Frame Header */}
        {showLayers.includes('datalink') && (
          <motion.div
            initial={animated ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <LayerSection
              layer="datalink"
              title="Ethernet Frame Header"
              fields={[
                { name: 'Dest MAC', value: 'FF:FF:FF:FF:FF:FF', width: 48 },
                { name: 'Src MAC', value: '00:1A:2B:3C:4D:5E', width: 48 },
                { name: 'Type', value: '0x0800', width: 16 }
              ]}
            />
          </motion.div>
        )}

        {/* IP Header */}
        {showLayers.includes('network') && (
          <motion.div
            initial={animated ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <LayerSection
              layer="network"
              title="IP Header"
              fields={[
                { name: 'Ver', value: '4', width: 4 },
                { name: 'IHL', value: '5', width: 4 },
                { name: 'ToS', value: '0x00', width: 8 },
                { name: 'Total Len', value: String(packet.size + 40), width: 16 },
                { name: 'TTL', value: String(packet.metadata.ttl), width: 8 },
                { name: 'Proto', value: packet.type === 'TCP' ? '6' : '17', width: 8 },
                { name: 'Src IP', value: packet.source.ip, width: 32 },
                { name: 'Dst IP', value: packet.destination.ip, width: 32 }
              ]}
            />
          </motion.div>
        )}

        {/* TCP/UDP Header */}
        {showLayers.includes('transport') && (
          <motion.div
            initial={animated ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <LayerSection
              layer="transport"
              title={`${packet.type} Header`}
              fields={[
                { name: 'Src Port', value: String(packet.source.port), width: 16 },
                { name: 'Dst Port', value: String(packet.destination.port), width: 16 },
                ...(packet.type === 'TCP' ? [
                  { name: 'Seq', value: String(packet.metadata.sequence), width: 32 },
                  { name: 'Flags', value: packet.flags.join(','), width: 6 },
                  { name: 'Window', value: '65535', width: 16 }
                ] : [
                  { name: 'Length', value: String(packet.size + 8), width: 16 },
                  { name: 'Checksum', value: '0x0000', width: 16 }
                ])
              ]}
            />
          </motion.div>
        )}

        {/* Payload */}
        <motion.div
          initial={animated ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-700 rounded-lg p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white">Payload Data</span>
            <span className="text-xs text-gray-400">{packet.size} bytes</span>
          </div>
          <div className="font-mono text-xs text-green-400 bg-black/30 p-2 rounded overflow-x-auto">
            {packet.payload || '(empty payload)'}
          </div>
        </motion.div>
      </div>

      {/* Packet Summary */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-gray-400">Packet ID:</div>
          <div className="text-white font-mono truncate">{packet.id}</div>
          <div className="text-gray-400">Timestamp:</div>
          <div className="text-white">{packet.timestamp}</div>
          <div className="text-gray-400">Total Size:</div>
          <div className="text-white">{packet.size + 66} bytes (with headers)</div>
        </div>
      </div>
    </div>
  );
}

interface LayerSectionProps {
  layer: OSILayer;
  title: string;
  fields: Array<{ name: string; value: string; width: number }>;
}

function LayerSection({ layer, title, fields }: LayerSectionProps) {
  const layerInfo = OSI_LAYERS[layer];

  return (
    <div
      className="rounded-lg p-3"
      style={{ backgroundColor: `${layerInfo.color}20`, borderLeft: `4px solid ${layerInfo.color}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold" style={{ color: layerInfo.color }}>
          {title}
        </span>
        <span className="text-xs text-gray-400">Layer {layerInfo.number}</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {fields.map((field, i) => (
          <div
            key={i}
            className="bg-black/20 rounded px-2 py-1 text-xs"
            style={{ minWidth: Math.max(field.width * 1.5, 40) }}
          >
            <div className="text-gray-400 text-[10px]">{field.name}</div>
            <div className="text-white font-mono truncate" title={field.value}>
              {field.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
