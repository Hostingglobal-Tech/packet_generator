'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OSI_LAYERS, LAYER_ORDER } from '@/data/osiLayers';
import { Packet, OSILayer } from '@/types/packet';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';

interface EncapsulationAnimationProps {
  packet: Packet;
  autoPlay?: boolean;
  speed?: number;
  onComplete?: () => void;
}

const ENCAPSULATION_LAYERS: OSILayer[] = ['application', 'transport', 'network', 'datalink', 'physical'];

export function EncapsulationAnimation({
  packet,
  autoPlay = false,
  speed = 1,
  onComplete
}: EncapsulationAnimationProps) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [direction, setDirection] = useState<'encapsulate' | 'decapsulate'>('encapsulate');

  useEffect(() => {
    if (!isPlaying) return;

    const maxStep = ENCAPSULATION_LAYERS.length - 1;
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (direction === 'encapsulate') {
          if (prev >= maxStep) {
            setDirection('decapsulate');
            return maxStep;
          }
          return prev + 1;
        } else {
          if (prev <= 0) {
            setIsPlaying(false);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        }
      });
    }, 1500 / speed);

    return () => clearInterval(interval);
  }, [isPlaying, direction, speed, onComplete]);

  const reset = () => {
    setCurrentStep(-1);
    setDirection('encapsulate');
    setIsPlaying(false);
  };

  const getLayerData = (layerKey: OSILayer, step: number) => {
    const layer = OSI_LAYERS[layerKey];
    const idx = ENCAPSULATION_LAYERS.indexOf(layerKey);

    switch (layerKey) {
      case 'application':
        return { header: '', data: packet.payload, size: packet.size };
      case 'transport':
        return {
          header: `TCP[${packet.source.port}→${packet.destination.port}]`,
          data: packet.payload,
          size: packet.size + 20
        };
      case 'network':
        return {
          header: `IP[${packet.source.ip}→${packet.destination.ip}]`,
          data: `TCP[...] + Data`,
          size: packet.size + 40
        };
      case 'datalink':
        return {
          header: `ETH[MAC→MAC]`,
          data: `IP[...] + TCP[...] + Data`,
          size: packet.size + 58
        };
      case 'physical':
        return {
          header: `BITS[Preamble+SFD]`,
          data: `Frame as binary`,
          size: (packet.size + 66) * 8
        };
      default:
        return { header: '', data: '', size: 0 };
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">패킷 캡슐화/역캡슐화</h3>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={reset}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={() => setCurrentStep(ENCAPSULATION_LAYERS.length - 1)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            <FastForward size={18} />
          </button>
        </div>
      </div>

      {/* Direction Indicator */}
      <div className="text-center mb-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          direction === 'encapsulate'
            ? 'bg-green-600/20 text-green-400'
            : 'bg-orange-600/20 text-orange-400'
        }`}>
          {direction === 'encapsulate' ? '⬇ 캡슐화 (Encapsulation)' : '⬆ 역캡슐화 (Decapsulation)'}
        </span>
      </div>

      {/* Sender / Receiver Labels */}
      <div className="flex justify-between mb-2 text-sm">
        <span className="text-blue-400 font-medium">📤 송신측 (Sender)</span>
        <span className="text-purple-400 font-medium">📥 수신측 (Receiver)</span>
      </div>

      {/* Layer Stack */}
      <div className="relative">
        {ENCAPSULATION_LAYERS.map((layerKey, index) => {
          const layer = OSI_LAYERS[layerKey];
          const layerData = getLayerData(layerKey, currentStep);
          const isActive = index <= currentStep;
          const isCurrent = index === currentStep;

          return (
            <motion.div
              key={layerKey}
              className="mb-2"
              initial={{ opacity: 0.3 }}
              animate={{
                opacity: isActive ? 1 : 0.3,
                scale: isCurrent ? 1.02 : 1
              }}
              transition={{ duration: 0.3 }}
            >
              <div
                className={`rounded-lg overflow-hidden transition-all duration-300 ${
                  isCurrent ? 'ring-2 ring-white shadow-lg' : ''
                }`}
                style={{
                  backgroundColor: isActive ? layer.color : '#374151',
                }}
              >
                {/* Layer Header */}
                <div className="px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center font-bold text-white text-sm">
                      {layer.number}
                    </span>
                    <span className="font-medium text-white">{layer.name}</span>
                  </div>
                  {isActive && (
                    <span className="text-xs text-white/80">
                      +{layer.headerSize} bytes
                    </span>
                  )}
                </div>

                {/* Encapsulated Data */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-3"
                    >
                      <div className="bg-black/20 rounded-lg p-2 flex items-center gap-2 overflow-hidden">
                        {layerData.header && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-2 py-1 bg-white/20 rounded text-xs font-mono text-white shrink-0"
                          >
                            {layerData.header}
                          </motion.span>
                        )}
                        <span className="text-xs text-white/70 truncate">
                          {layerData.data}
                        </span>
                        <span className="ml-auto text-xs text-white/50 shrink-0">
                          {layerData.size} {layerKey === 'physical' ? 'bits' : 'bytes'}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Arrow between layers */}
              {index < ENCAPSULATION_LAYERS.length - 1 && isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center py-1 text-white/30"
                >
                  {direction === 'encapsulate' ? '▼' : '▲'}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>진행도</span>
          <span>{Math.max(0, currentStep + 1)} / {ENCAPSULATION_LAYERS.length}</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            animate={{
              width: `${((currentStep + 1) / ENCAPSULATION_LAYERS.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}
