import React, { useState, useEffect } from 'react';

interface ClockCharacterProps {
  message?: string | null;
  expression?: 'normal' | 'happy' | 'worried' | 'speaking';
  onClick?: () => void;
  modalOpen?: boolean;
}

const ClockCharacter: React.FC<ClockCharacterProps> = ({
  message,
  expression = 'normal',
  onClick,
  modalOpen = false,
}) => {
  const [blinkState, setBlinkState] = useState(false);
  const [bouncePhase, setBouncePhase] = useState(0);
  const [armWave, setArmWave] = useState(0);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [clockAngle, setClockAngle] = useState(0);

  // まばたき
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkState(true);
      setTimeout(() => setBlinkState(false), 150);
    }, 2500 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // バウンスアニメーション
  useEffect(() => {
    const bounceInterval = setInterval(() => {
      setBouncePhase((prev) => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(bounceInterval);
  }, []);

  // 腕を振る
  useEffect(() => {
    const armInterval = setInterval(() => {
      setArmWave((prev) => (prev + 1) % 2);
    }, 800);
    return () => clearInterval(armInterval);
  }, []);

  // 話してる時は口パク
  useEffect(() => {
    if (message) {
      const mouthInterval = setInterval(() => {
        setMouthOpen((prev) => !prev);
      }, 200);
      return () => clearInterval(mouthInterval);
    } else {
      setMouthOpen(false);
    }
  }, [message]);

  // 時計の針を動かす
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setClockAngle((prev) => (prev + 6) % 360);
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // バウンスの変位（モーダル時はより大きく動く）
  const bounceY = modalOpen ? [0, -8, 0, 4][bouncePhase] : [0, -4, 0, 2][bouncePhase];
  const bounceRotate = modalOpen ? [-3, 0, 3, 0][bouncePhase] : [-1, 0, 1, 0][bouncePhase];

  // 表情による目のサイズ（モーダル時は嬉しそう）
  const actualExpression = modalOpen ? 'happy' : expression;
  const eyeScale = actualExpression === 'happy' ? 1.1 : actualExpression === 'worried' ? 0.9 : 1;
  const eyeY = actualExpression === 'happy' ? -2 : actualExpression === 'worried' ? 2 : 0;

  return (
    <div
      onClick={modalOpen ? undefined : onClick}
      style={{
        position: 'fixed',
        left: modalOpen ? 'calc(50% + 220px)' : '10px',
        bottom: modalOpen ? '50%' : '80px',
        width: '130px',
        height: '170px',
        cursor: modalOpen ? 'default' : 'pointer',
        zIndex: 1100,
        transform: `translateY(${modalOpen ? '50%' : '0'}) translateY(${bounceY}px) rotate(${bounceRotate}deg)`,
        transition: 'all 0.4s ease',
      }}
    >
      <svg
        viewBox="0 0 100 120"
        width="130"
        height="156"
        style={{ overflow: 'visible' }}
      >
        {/* 影 */}
        <ellipse cx="50" cy="115" rx="25" ry="5" fill="rgba(0,0,0,0.15)" />

        {/* 左足 */}
        <ellipse
          cx="35"
          cy="105"
          rx="10"
          ry="8"
          fill="#5B8C5A"
          stroke="#3D6B3C"
          strokeWidth="1"
        />

        {/* 右足 */}
        <ellipse
          cx="65"
          cy="105"
          rx="10"
          ry="8"
          fill="#5B8C5A"
          stroke="#3D6B3C"
          strokeWidth="1"
        />

        {/* 左腕 */}
        <g transform={`rotate(${armWave === 0 ? -20 : -35}, 20, 60)`}>
          <ellipse cx="12" cy="60" rx="8" ry="12" fill="#5B8C5A" stroke="#3D6B3C" strokeWidth="1" />
          {/* 鉛筆 */}
          <rect x="5" y="45" width="4" height="20" fill="#F4D03F" rx="1" />
          <polygon points="7,45 5,40 9,40" fill="#FFB6C1" />
        </g>

        {/* 右腕 */}
        <g transform={`rotate(${armWave === 1 ? 20 : 35}, 80, 60)`}>
          <ellipse cx="88" cy="60" rx="8" ry="12" fill="#5B8C5A" stroke="#3D6B3C" strokeWidth="1" />
          {/* メモ帳 */}
          <rect x="82" y="50" width="12" height="15" fill="#FFF" stroke="#DDD" strokeWidth="1" rx="1" />
          <line x1="84" y1="54" x2="92" y2="54" stroke="#CCC" strokeWidth="1" />
          <line x1="84" y1="58" x2="92" y2="58" stroke="#CCC" strokeWidth="1" />
        </g>

        {/* 体（時計本体） */}
        <circle cx="50" cy="55" r="40" fill="#6ABF69" stroke="#4A9F4A" strokeWidth="3" />

        {/* 時計の外枠 */}
        <circle cx="50" cy="55" r="32" fill="#FFFEF0" stroke="#E8E8E8" strokeWidth="2" />

        {/* 時計の目盛り */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
          <line
            key={angle}
            x1={50 + 26 * Math.cos((angle - 90) * Math.PI / 180)}
            y1={55 + 26 * Math.sin((angle - 90) * Math.PI / 180)}
            x2={50 + 29 * Math.cos((angle - 90) * Math.PI / 180)}
            y2={55 + 29 * Math.sin((angle - 90) * Math.PI / 180)}
            stroke="#4A9F4A"
            strokeWidth={angle % 90 === 0 ? 2 : 1}
          />
        ))}

        {/* 短針 */}
        <line
          x1="50"
          y1="55"
          x2={50 + 15 * Math.cos((clockAngle / 12 - 90) * Math.PI / 180)}
          y2={55 + 15 * Math.sin((clockAngle / 12 - 90) * Math.PI / 180)}
          stroke="#4A9F4A"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* 長針 */}
        <line
          x1="50"
          y1="55"
          x2={50 + 22 * Math.cos((clockAngle - 90) * Math.PI / 180)}
          y2={55 + 22 * Math.sin((clockAngle - 90) * Math.PI / 180)}
          stroke="#4A9F4A"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* 中心点 */}
        <circle cx="50" cy="55" r="3" fill="#4A9F4A" />

        {/* 左目 */}
        <g transform={`translate(38, ${48 + eyeY}) scale(${eyeScale})`}>
          <ellipse
            cx="0"
            cy="0"
            rx="6"
            ry={blinkState ? 1 : 7}
            fill="#FFF"
            stroke="#333"
            strokeWidth="1"
          />
          {!blinkState && (
            <>
              <circle cx="0" cy="0" r="4" fill="#333" />
              <circle cx="1" cy="-1" r="1.5" fill="#FFF" />
            </>
          )}
        </g>

        {/* 右目 */}
        <g transform={`translate(62, ${48 + eyeY}) scale(${eyeScale})`}>
          <ellipse
            cx="0"
            cy="0"
            rx="6"
            ry={blinkState ? 1 : 7}
            fill="#FFF"
            stroke="#333"
            strokeWidth="1"
          />
          {!blinkState && (
            <>
              <circle cx="0" cy="0" r="4" fill="#333" />
              <circle cx="1" cy="-1" r="1.5" fill="#FFF" />
            </>
          )}
        </g>

        {/* 頬（赤み） */}
        {actualExpression === 'happy' && (
          <>
            <ellipse cx="30" cy="58" rx="5" ry="3" fill="#FFB6C1" opacity="0.6" />
            <ellipse cx="70" cy="58" rx="5" ry="3" fill="#FFB6C1" opacity="0.6" />
          </>
        )}

        {/* 口 */}
        {actualExpression === 'happy' ? (
          <path
            d="M 42 65 Q 50 75 58 65"
            fill="none"
            stroke="#333"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ) : actualExpression === 'worried' ? (
          <path
            d="M 42 70 Q 50 65 58 70"
            fill="none"
            stroke="#333"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ) : mouthOpen ? (
          <ellipse cx="50" cy="68" rx="5" ry="4" fill="#333" />
        ) : (
          <path
            d="M 45 67 Q 50 70 55 67"
            fill="none"
            stroke="#333"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}

        {/* 葉っぱ（頭の上） */}
        <g transform="translate(50, 12)">
          <ellipse cx="0" cy="0" rx="3" ry="8" fill="#4CAF50" transform="rotate(-20)" />
          <ellipse cx="5" cy="-2" rx="2" ry="6" fill="#66BB6A" transform="rotate(15)" />
        </g>
      </svg>

      {/* 吹き出し */}
      {message && (
        <div
          style={{
            position: 'absolute',
            bottom: '130px',
            left: '10px',
            background: '#fff',
            padding: '10px 14px',
            borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            fontSize: '0.85rem',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            animation: 'bubblePop 0.3s ease',
            color: '#333',
          }}
        >
          {message}
          {/* 吹き出しの尻尾 */}
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              left: '20px',
              width: '0',
              height: '0',
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '10px solid #fff',
            }}
          />
        </div>
      )}

      <style>
        {`
          @keyframes bubblePop {
            0% { transform: scale(0.5); opacity: 0; }
            70% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default ClockCharacter;
