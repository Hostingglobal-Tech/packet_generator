'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { OSI_LAYERS, LAYER_ORDER } from '@/data/osiLayers';
import { OSILayer } from '@/types/packet';

interface OSILayerStackProps {
  activeLayer?: OSILayer | null;
  highlightedLayers?: OSILayer[];
  encapsulatedLayers?: OSILayer[];
  showDetails?: boolean;
  direction?: 'down' | 'up';
}

export function OSILayerStack({
  activeLayer,
  highlightedLayers = [],
  encapsulatedLayers = [],
  showDetails = true,
  direction = 'down'
}: OSILayerStackProps) {
  const layers = direction === 'down' ? LAYER_ORDER : [...LAYER_ORDER].reverse();

  return (
    <div className="flex flex-col gap-1 w-full max-w-md">
      <h3 className="text-lg font-bold text-white mb-2 text-center">
        OSI 7 Layer Model
      </h3>

      <AnimatePresence>
        {layers.map((layerKey, index) => {
          const layer = OSI_LAYERS[layerKey];
          const isActive = activeLayer === layerKey;
          const isHighlighted = highlightedLayers.includes(layerKey);
          const isEncapsulated = encapsulatedLayers.includes(layerKey);

          return (
            <motion.div
              key={layerKey}
              initial={{ opacity: 0, x: direction === 'down' ? -50 : 50 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: isActive ? 1.02 : 1,
              }}
              transition={{
                delay: index * 0.1,
                duration: 0.3
              }}
              className={`
                relative rounded-lg p-3 cursor-pointer transition-all duration-300
                ${isActive ? 'ring-2 ring-white shadow-lg' : ''}
                ${isEncapsulated ? 'opacity-100' : 'opacity-60'}
              `}
              style={{
                backgroundColor: layer.color,
                boxShadow: isActive ? `0 0 20px ${layer.color}80` : 'none'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center font-bold text-white">
                    {layer.number}
                  </span>
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      {layer.name}
                    </h4>
                    {showDetails && (
                      <p className="text-xs text-white/80">
                        {layer.protocols.slice(0, 3).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {isEncapsulated && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-3 h-3 rounded-full bg-green-400"
                  />
                )}
              </div>

              {isActive && showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-2 pt-2 border-t border-white/20"
                >
                  <p className="text-xs text-white/90">{layer.description}</p>
                  {layer.headerSize > 0 && (
                    <p className="text-xs text-white/70 mt-1">
                      헤더 크기: {layer.headerSize} bytes
                    </p>
                  )}
                </motion.div>
              )}

              {/* Encapsulation arrow */}
              {isEncapsulated && index < layers.length - 1 && direction === 'down' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 text-white/50 z-10"
                >
                  ▼
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
