'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Packet } from '@/types/packet';
import { ChevronRight, ChevronDown, Binary, FileText } from 'lucide-react';

interface WiresharkViewProps {
  packet: Packet | null;
}

interface TreeNode {
  id: string;
  label: string;
  value?: string;
  color: string;
  children?: TreeNode[];
  hexStart?: number;
  hexEnd?: number;
}

export function WiresharkView({ packet }: WiresharkViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(['frame', 'ethernet', 'ip', 'tcp'])
  );
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'hex' | 'both'>('both');

  if (!packet) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 text-center text-gray-400">
        패킷을 먼저 생성하세요
      </div>
    );
  }

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Build tree structure
  const buildPacketTree = (): TreeNode[] => {
    const payloadBytes = new TextEncoder().encode(packet.payload).length;
    const totalLength = 14 + 20 + 20 + payloadBytes; // Ethernet + IP + TCP + Payload

    return [
      {
        id: 'frame',
        label: 'Frame',
        value: `${totalLength} bytes on wire`,
        color: '#9CA3AF',
        hexStart: 0,
        hexEnd: totalLength,
        children: [
          { id: 'frame-len', label: 'Frame Length', value: `${totalLength} bytes`, color: '#9CA3AF' },
          { id: 'frame-cap', label: 'Capture Length', value: `${totalLength} bytes`, color: '#9CA3AF' },
          { id: 'frame-time', label: 'Arrival Time', value: packet.timestamp, color: '#9CA3AF' },
        ]
      },
      {
        id: 'ethernet',
        label: 'Ethernet II',
        value: `Src: 00:1a:2b:3c:4d:5e, Dst: ff:ff:ff:ff:ff:ff`,
        color: '#9775FA',
        hexStart: 0,
        hexEnd: 14,
        children: [
          { id: 'eth-dst', label: 'Destination', value: 'ff:ff:ff:ff:ff:ff (Broadcast)', color: '#9775FA', hexStart: 0, hexEnd: 6 },
          { id: 'eth-src', label: 'Source', value: '00:1a:2b:3c:4d:5e', color: '#9775FA', hexStart: 6, hexEnd: 12 },
          { id: 'eth-type', label: 'Type', value: 'IPv4 (0x0800)', color: '#9775FA', hexStart: 12, hexEnd: 14 },
        ]
      },
      {
        id: 'ip',
        label: 'Internet Protocol Version 4',
        value: `Src: ${packet.source.ip}, Dst: ${packet.destination.ip}`,
        color: '#4DABF7',
        hexStart: 14,
        hexEnd: 34,
        children: [
          { id: 'ip-ver', label: 'Version', value: '4', color: '#4DABF7', hexStart: 14, hexEnd: 14.5 },
          { id: 'ip-ihl', label: 'Header Length', value: '20 bytes (5)', color: '#4DABF7', hexStart: 14.5, hexEnd: 15 },
          { id: 'ip-dscp', label: 'Differentiated Services', value: '0x00', color: '#4DABF7', hexStart: 15, hexEnd: 16 },
          { id: 'ip-len', label: 'Total Length', value: `${20 + 20 + payloadBytes}`, color: '#4DABF7', hexStart: 16, hexEnd: 18 },
          { id: 'ip-id', label: 'Identification', value: '0x1234', color: '#4DABF7', hexStart: 18, hexEnd: 20 },
          { id: 'ip-flags', label: 'Flags', value: '0x40 (Don\'t Fragment)', color: '#4DABF7', hexStart: 20, hexEnd: 22 },
          { id: 'ip-ttl', label: 'Time to Live', value: String(packet.metadata.ttl), color: '#4DABF7', hexStart: 22, hexEnd: 23 },
          { id: 'ip-proto', label: 'Protocol', value: packet.type === 'TCP' ? 'TCP (6)' : 'UDP (17)', color: '#4DABF7', hexStart: 23, hexEnd: 24 },
          { id: 'ip-checksum', label: 'Header Checksum', value: '0x0000 [validation disabled]', color: '#4DABF7', hexStart: 24, hexEnd: 26 },
          { id: 'ip-src', label: 'Source Address', value: packet.source.ip, color: '#4DABF7', hexStart: 26, hexEnd: 30 },
          { id: 'ip-dst', label: 'Destination Address', value: packet.destination.ip, color: '#4DABF7', hexStart: 30, hexEnd: 34 },
        ]
      },
      {
        id: 'tcp',
        label: 'Transmission Control Protocol',
        value: `Src Port: ${packet.source.port}, Dst Port: ${packet.destination.port}, Seq: ${packet.metadata.sequence}`,
        color: '#69DB7C',
        hexStart: 34,
        hexEnd: 54,
        children: [
          { id: 'tcp-src', label: 'Source Port', value: String(packet.source.port), color: '#69DB7C', hexStart: 34, hexEnd: 36 },
          { id: 'tcp-dst', label: 'Destination Port', value: String(packet.destination.port), color: '#69DB7C', hexStart: 36, hexEnd: 38 },
          { id: 'tcp-seq', label: 'Sequence Number', value: String(packet.metadata.sequence), color: '#69DB7C', hexStart: 38, hexEnd: 42 },
          { id: 'tcp-ack', label: 'Acknowledgment Number', value: '0', color: '#69DB7C', hexStart: 42, hexEnd: 46 },
          { id: 'tcp-hlen', label: 'Header Length', value: '20 bytes (5)', color: '#69DB7C', hexStart: 46, hexEnd: 47 },
          {
            id: 'tcp-flags',
            label: 'Flags',
            value: `0x${getFlagsHex(packet.flags)} (${packet.flags.join(', ')})`,
            color: '#69DB7C',
            hexStart: 47,
            hexEnd: 48,
            children: packet.flags.map((flag, i) => ({
              id: `tcp-flag-${flag}`,
              label: `.... ${flag === 'SYN' ? '...0 0010' : flag === 'ACK' ? '...1 0000' : '.... ....'} = ${flag}`,
              value: 'Set',
              color: '#69DB7C'
            }))
          },
          { id: 'tcp-win', label: 'Window', value: '65535', color: '#69DB7C', hexStart: 48, hexEnd: 50 },
          { id: 'tcp-checksum', label: 'Checksum', value: '0x0000 [unverified]', color: '#69DB7C', hexStart: 50, hexEnd: 52 },
          { id: 'tcp-urgent', label: 'Urgent Pointer', value: '0', color: '#69DB7C', hexStart: 52, hexEnd: 54 },
        ]
      },
      {
        id: 'payload',
        label: 'Data',
        value: `${payloadBytes} bytes`,
        color: '#FF6B6B',
        hexStart: 54,
        hexEnd: 54 + payloadBytes,
        children: [
          { id: 'payload-data', label: 'Data', value: packet.payload, color: '#FF6B6B' },
        ]
      }
    ];
  };

  const getFlagsHex = (flags: string[]): string => {
    let value = 0;
    if (flags.includes('FIN')) value |= 0x01;
    if (flags.includes('SYN')) value |= 0x02;
    if (flags.includes('RST')) value |= 0x04;
    if (flags.includes('PSH')) value |= 0x08;
    if (flags.includes('ACK')) value |= 0x10;
    if (flags.includes('URG')) value |= 0x20;
    return value.toString(16).padStart(2, '0');
  };

  const generateHexDump = (): string[] => {
    const lines: string[] = [];
    const bytes: number[] = [];

    // Ethernet Header (14 bytes)
    bytes.push(0xff, 0xff, 0xff, 0xff, 0xff, 0xff); // Dst MAC
    bytes.push(0x00, 0x1a, 0x2b, 0x3c, 0x4d, 0x5e); // Src MAC
    bytes.push(0x08, 0x00); // Type: IPv4

    // IP Header (20 bytes)
    bytes.push(0x45); // Version + IHL
    bytes.push(0x00); // DSCP
    const ipLen = 20 + 20 + packet.payload.length;
    bytes.push((ipLen >> 8) & 0xff, ipLen & 0xff); // Total Length
    bytes.push(0x12, 0x34); // Identification
    bytes.push(0x40, 0x00); // Flags + Fragment Offset
    bytes.push(packet.metadata.ttl); // TTL
    bytes.push(packet.type === 'TCP' ? 0x06 : 0x11); // Protocol
    bytes.push(0x00, 0x00); // Checksum

    // Source IP
    packet.source.ip.split('.').forEach(octet => bytes.push(parseInt(octet) || 0));
    // Dest IP
    packet.destination.ip.split('.').forEach(octet => bytes.push(parseInt(octet) || 0));

    // TCP Header (20 bytes)
    bytes.push((packet.source.port >> 8) & 0xff, packet.source.port & 0xff);
    bytes.push((packet.destination.port >> 8) & 0xff, packet.destination.port & 0xff);
    const seq = packet.metadata.sequence;
    bytes.push((seq >> 24) & 0xff, (seq >> 16) & 0xff, (seq >> 8) & 0xff, seq & 0xff);
    bytes.push(0x00, 0x00, 0x00, 0x00); // Ack
    bytes.push(0x50); // Data Offset
    bytes.push(parseInt(getFlagsHex(packet.flags), 16)); // Flags
    bytes.push(0xff, 0xff); // Window
    bytes.push(0x00, 0x00); // Checksum
    bytes.push(0x00, 0x00); // Urgent Pointer

    // Payload
    const payloadBytes = new TextEncoder().encode(packet.payload);
    payloadBytes.forEach(b => bytes.push(b));

    // Format as hex dump
    for (let i = 0; i < bytes.length; i += 16) {
      const offset = i.toString(16).padStart(4, '0');
      const hexPart = bytes.slice(i, i + 16).map(b => b.toString(16).padStart(2, '0')).join(' ');
      const asciiPart = bytes.slice(i, i + 16).map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join('');
      lines.push(`${offset}  ${hexPart.padEnd(47)}  ${asciiPart}`);
    }

    return lines;
  };

  const tree = buildPacketTree();
  const hexDump = generateHexDump();

  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode === node.id;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-700/50 ${
            isSelected ? 'bg-blue-600/30' : ''
          }`}
          style={{ paddingLeft: depth * 16 + 8 }}
          onClick={() => {
            if (hasChildren) toggleNode(node.id);
            setSelectedNode(node.id);
          }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={14} className="text-gray-400 mr-1" /> : <ChevronRight size={14} className="text-gray-400 mr-1" />
          ) : (
            <span className="w-4 mr-1" />
          )}
          <span className="text-sm" style={{ color: node.color }}>{node.label}</span>
          {node.value && (
            <span className="text-gray-400 text-sm ml-2 truncate">: {node.value}</span>
          )}
        </div>
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {node.children!.map(child => renderTreeNode(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <h3 className="text-lg font-bold text-white">Packet Details (Wireshark Style)</h3>
        <div className="flex gap-1">
          {(['tree', 'hex', 'both'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {mode === 'tree' ? <FileText size={16} /> : mode === 'hex' ? <Binary size={16} /> : 'Both'}
            </button>
          ))}
        </div>
      </div>

      {/* Packet Summary Bar */}
      <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700 font-mono text-sm">
        <span className="text-gray-400">No.</span>
        <span className="text-white ml-2">1</span>
        <span className="text-gray-400 ml-4">Time</span>
        <span className="text-white ml-2">0.000000</span>
        <span className="text-gray-400 ml-4">Source</span>
        <span className="text-blue-400 ml-2">{packet.source.ip}</span>
        <span className="text-gray-400 ml-4">Destination</span>
        <span className="text-purple-400 ml-2">{packet.destination.ip}</span>
        <span className="text-gray-400 ml-4">Protocol</span>
        <span className="text-green-400 ml-2">{packet.type}</span>
        <span className="text-gray-400 ml-4">Length</span>
        <span className="text-white ml-2">{54 + packet.payload.length}</span>
      </div>

      <div className={`flex ${viewMode === 'both' ? 'flex-col lg:flex-row' : ''}`}>
        {/* Tree View */}
        {(viewMode === 'tree' || viewMode === 'both') && (
          <div className={`${viewMode === 'both' ? 'lg:w-1/2' : 'w-full'} border-r border-gray-700 max-h-96 overflow-y-auto`}>
            <div className="py-1">
              {tree.map(node => renderTreeNode(node))}
            </div>
          </div>
        )}

        {/* Hex View */}
        {(viewMode === 'hex' || viewMode === 'both') && (
          <div className={`${viewMode === 'both' ? 'lg:w-1/2' : 'w-full'} bg-black p-3 max-h-96 overflow-y-auto`}>
            <div className="font-mono text-xs">
              {hexDump.map((line, i) => (
                <div key={i} className="flex">
                  <span className="text-blue-400 w-12">{line.slice(0, 4)}</span>
                  <span className="text-green-400 flex-1">{line.slice(6, 53)}</span>
                  <span className="text-yellow-400">{line.slice(55)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#9775FA' }} />
          <span className="text-gray-400">Ethernet</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#4DABF7' }} />
          <span className="text-gray-400">IP</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#69DB7C' }} />
          <span className="text-gray-400">TCP</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#FF6B6B' }} />
          <span className="text-gray-400">Data</span>
        </span>
      </div>
    </div>
  );
}
