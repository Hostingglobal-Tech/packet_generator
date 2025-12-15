'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Monitor, Server } from 'lucide-react';

interface HandshakeStep {
  id: number;
  direction: 'client-to-server' | 'server-to-client';
  flags: string[];
  seq: number;
  ack: number;
  description: string;
  detail: string;
}

const HANDSHAKE_STEPS: HandshakeStep[] = [
  {
    id: 1,
    direction: 'client-to-server',
    flags: ['SYN'],
    seq: 1000,
    ack: 0,
    description: 'SYN - 연결 요청',
    detail: '클라이언트가 서버에게 연결을 요청합니다. 초기 시퀀스 번호(ISN)를 전송합니다.'
  },
  {
    id: 2,
    direction: 'server-to-client',
    flags: ['SYN', 'ACK'],
    seq: 2000,
    ack: 1001,
    description: 'SYN+ACK - 연결 수락',
    detail: '서버가 연결을 수락하고, 클라이언트의 SYN에 대한 ACK와 자신의 SYN을 함께 전송합니다.'
  },
  {
    id: 3,
    direction: 'client-to-server',
    flags: ['ACK'],
    seq: 1001,
    ack: 2001,
    description: 'ACK - 연결 확립',
    detail: '클라이언트가 서버의 SYN에 대한 ACK를 전송합니다. 이제 연결이 확립되었습니다.'
  }
];

const DATA_TRANSFER_STEPS: HandshakeStep[] = [
  {
    id: 4,
    direction: 'client-to-server',
    flags: ['PSH', 'ACK'],
    seq: 1001,
    ack: 2001,
    description: 'DATA - 데이터 전송',
    detail: '클라이언트가 HTTP 요청 등의 데이터를 전송합니다.'
  },
  {
    id: 5,
    direction: 'server-to-client',
    flags: ['ACK'],
    seq: 2001,
    ack: 1501,
    description: 'ACK - 데이터 수신 확인',
    detail: '서버가 데이터 수신을 확인합니다.'
  }
];

const TERMINATION_STEPS: HandshakeStep[] = [
  {
    id: 6,
    direction: 'client-to-server',
    flags: ['FIN', 'ACK'],
    seq: 1501,
    ack: 2001,
    description: 'FIN - 연결 종료 요청',
    detail: '클라이언트가 연결 종료를 요청합니다.'
  },
  {
    id: 7,
    direction: 'server-to-client',
    flags: ['ACK'],
    seq: 2001,
    ack: 1502,
    description: 'ACK - 종료 요청 확인',
    detail: '서버가 FIN을 확인합니다.'
  },
  {
    id: 8,
    direction: 'server-to-client',
    flags: ['FIN', 'ACK'],
    seq: 2001,
    ack: 1502,
    description: 'FIN - 서버 종료',
    detail: '서버도 연결 종료를 요청합니다.'
  },
  {
    id: 9,
    direction: 'client-to-server',
    flags: ['ACK'],
    seq: 1502,
    ack: 2002,
    description: 'ACK - 종료 완료',
    detail: '클라이언트가 서버의 FIN을 확인합니다. 연결이 완전히 종료됩니다.'
  }
];

type Phase = 'handshake' | 'data' | 'termination';

export function TCPHandshake() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<Phase>('handshake');
  const [showTermination, setShowTermination] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const getAllSteps = useCallback(() => {
    let steps = [...HANDSHAKE_STEPS, ...DATA_TRANSFER_STEPS];
    if (showTermination) {
      steps = [...steps, ...TERMINATION_STEPS];
    }
    return steps;
  }, [showTermination]);

  const addLog = useCallback((step: HandshakeStep) => {
    const time = new Date().toLocaleTimeString();
    const arrow = step.direction === 'client-to-server' ? '→' : '←';
    const log = `[${time}] ${arrow} [${step.flags.join('+')}] Seq=${step.seq}, Ack=${step.ack}`;
    setLogs(prev => [log, ...prev.slice(0, 19)]);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const allSteps = getAllSteps();
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= allSteps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        const nextStep = prev + 1;
        addLog(allSteps[nextStep]);

        // Update phase
        if (nextStep < 3) setPhase('handshake');
        else if (nextStep < 5) setPhase('data');
        else setPhase('termination');

        return nextStep;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isPlaying, getAllSteps, addLog]);

  const reset = () => {
    setCurrentStep(-1);
    setIsPlaying(false);
    setPhase('handshake');
    setLogs([]);
  };

  const allSteps = getAllSteps();
  const currentStepData = currentStep >= 0 ? allSteps[currentStep] : null;

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">TCP 3-Way Handshake</h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={showTermination}
              onChange={e => setShowTermination(e.target.checked)}
              className="rounded"
            />
            4-Way 종료 포함
          </label>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            disabled={currentStep >= allSteps.length - 1}
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

      {/* Phase Indicator */}
      <div className="flex gap-2 mb-4">
        {(['handshake', 'data', 'termination'] as Phase[]).map(p => (
          <span
            key={p}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              phase === p
                ? p === 'handshake' ? 'bg-green-600/20 text-green-400'
                : p === 'data' ? 'bg-blue-600/20 text-blue-400'
                : 'bg-orange-600/20 text-orange-400'
                : 'bg-gray-700 text-gray-500'
            }`}
          >
            {p === 'handshake' ? '🤝 연결 수립' : p === 'data' ? '📦 데이터 전송' : '👋 연결 종료'}
          </span>
        ))}
      </div>

      {/* Main Visualization */}
      <div className="relative bg-gray-800 rounded-lg p-4" style={{ minHeight: 400 }}>
        {/* Client & Server */}
        <div className="flex justify-between mb-8">
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-colors ${
              currentStepData?.direction === 'client-to-server' ? 'bg-blue-600' : 'bg-gray-700'
            }`}>
              <Monitor size={32} className="text-white" />
            </div>
            <span className="mt-2 text-sm font-medium text-white">Client</span>
            <span className="text-xs text-gray-400">192.168.1.100:43034</span>
          </div>

          <div className="flex-1 relative mx-8">
            {/* Connection Line */}
            <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-600" />
          </div>

          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-colors ${
              currentStepData?.direction === 'server-to-client' ? 'bg-purple-600' : 'bg-gray-700'
            }`}>
              <Server size={32} className="text-white" />
            </div>
            <span className="mt-2 text-sm font-medium text-white">Server</span>
            <span className="text-xs text-gray-400">10.0.0.1:80</span>
          </div>
        </div>

        {/* Packet Arrows */}
        <div className="space-y-3">
          {allSteps.map((step, index) => {
            const isActive = index <= currentStep;
            const isCurrent = index === currentStep;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: isActive ? 1 : 0.3 }}
                className={`flex items-center gap-2 ${
                  step.direction === 'client-to-server' ? '' : 'flex-row-reverse'
                }`}
              >
                {/* Seq/Ack Info */}
                <div className={`w-24 text-xs ${step.direction === 'client-to-server' ? 'text-right' : 'text-left'}`}>
                  <div className="text-gray-400">Seq: {step.seq}</div>
                  <div className="text-gray-400">Ack: {step.ack}</div>
                </div>

                {/* Arrow & Flags */}
                <div className="flex-1 relative">
                  <motion.div
                    className={`h-8 flex items-center ${
                      step.direction === 'client-to-server' ? '' : 'flex-row-reverse'
                    }`}
                    animate={isCurrent ? { x: [0, 10, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <div className={`flex-1 h-0.5 ${
                      isActive
                        ? step.flags.includes('SYN') && step.flags.includes('ACK') ? 'bg-yellow-500'
                        : step.flags.includes('SYN') ? 'bg-green-500'
                        : step.flags.includes('FIN') ? 'bg-red-500'
                        : step.flags.includes('PSH') ? 'bg-blue-500'
                        : 'bg-gray-500'
                        : 'bg-gray-700'
                    }`} />

                    {/* Arrow Head */}
                    <div className={`w-0 h-0 ${
                      step.direction === 'client-to-server'
                        ? 'border-l-8 border-y-4 border-y-transparent'
                        : 'border-r-8 border-y-4 border-y-transparent'
                    } ${
                      isActive
                        ? step.flags.includes('SYN') && step.flags.includes('ACK') ? 'border-l-yellow-500 border-r-yellow-500'
                        : step.flags.includes('SYN') ? 'border-l-green-500 border-r-green-500'
                        : step.flags.includes('FIN') ? 'border-l-red-500 border-r-red-500'
                        : step.flags.includes('PSH') ? 'border-l-blue-500 border-r-blue-500'
                        : 'border-l-gray-500 border-r-gray-500'
                        : 'border-l-gray-700 border-r-gray-700'
                    }`} />
                  </motion.div>

                  {/* Flags Label */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      isActive ? 'bg-gray-900 text-white' : 'bg-gray-800 text-gray-500'
                    }`}>
                      {step.flags.join('+')}
                    </span>
                  </div>
                </div>

                {/* Step Number */}
                <div className={`w-24 text-xs ${step.direction === 'client-to-server' ? 'text-left' : 'text-right'}`}>
                  <span className={`px-2 py-0.5 rounded ${
                    isCurrent ? 'bg-blue-600 text-white' : isActive ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-500'
                  }`}>
                    Step {index + 1}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Current Step Detail */}
      <AnimatePresence>
        {currentStepData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-4 bg-gray-800 rounded-lg"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded font-bold text-sm ${
                currentStepData.flags.includes('SYN') && currentStepData.flags.includes('ACK')
                  ? 'bg-yellow-600'
                  : currentStepData.flags.includes('SYN') ? 'bg-green-600'
                  : currentStepData.flags.includes('FIN') ? 'bg-red-600'
                  : 'bg-blue-600'
              }`}>
                {currentStepData.flags.join(' + ')}
              </span>
              <span className="text-white font-medium">{currentStepData.description}</span>
            </div>
            <p className="text-sm text-gray-400">{currentStepData.detail}</p>

            {/* TCP Segment Preview */}
            <div className="mt-3 p-2 bg-black/30 rounded font-mono text-xs">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-gray-500">Src Port</div>
                  <div className="text-green-400">{currentStepData.direction === 'client-to-server' ? '43034' : '80'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Dst Port</div>
                  <div className="text-green-400">{currentStepData.direction === 'client-to-server' ? '80' : '43034'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Seq</div>
                  <div className="text-yellow-400">{currentStepData.seq}</div>
                </div>
                <div>
                  <div className="text-gray-500">Ack</div>
                  <div className="text-yellow-400">{currentStepData.ack}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Packet Log */}
      <div className="mt-4 bg-black/50 rounded-lg p-3 h-32 overflow-y-auto">
        <div className="text-xs text-gray-400 mb-2">패킷 로그 (Wireshark Style)</div>
        <div className="space-y-1 font-mono">
          {logs.length === 0 ? (
            <div className="text-xs text-gray-500">Play 버튼을 눌러 시작하세요</div>
          ) : (
            logs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-xs ${
                  log.includes('SYN+ACK') ? 'text-yellow-400'
                  : log.includes('SYN') ? 'text-green-400'
                  : log.includes('FIN') ? 'text-red-400'
                  : 'text-blue-400'
                }`}
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
