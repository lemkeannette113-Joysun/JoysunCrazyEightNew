import React from 'react';
import { motion } from 'motion/react';
import { CardData, Suit } from '../types';
import { Heart, Diamond, Club, Spade } from 'lucide-react';

interface CardProps {
  card: CardData;
  isFaceUp?: boolean;
  onClick?: () => void;
  isPlayable?: boolean;
  className?: string;
}

const SuitIcon = ({ suit, size = 20 }: { suit: Suit; size?: number }) => {
  switch (suit) {
    case Suit.HEARTS:
      return <Heart size={size} className="fill-red-500 text-red-500" />;
    case Suit.DIAMONDS:
      return <Diamond size={size} className="fill-red-500 text-red-500" />;
    case Suit.CLUBS:
      return <Club size={size} className="fill-slate-800 text-slate-800" />;
    case Suit.SPADES:
      return <Spade size={size} className="fill-slate-800 text-slate-800" />;
  }
};

export const Card: React.FC<CardProps> = ({
  card,
  isFaceUp = true,
  onClick,
  isPlayable = false,
  className = '',
}) => {
  const isRed = card.suit === Suit.HEARTS || card.suit === Suit.DIAMONDS;

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={isPlayable ? { y: -10, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={`
        relative w-24 h-36 sm:w-28 sm:h-40 rounded-xl border-2 shadow-md flex flex-col items-center justify-between p-2 cursor-pointer transition-colors
        ${isFaceUp ? 'bg-white border-slate-200' : 'bg-indigo-600 border-indigo-800'}
        ${isPlayable ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}
        ${className}
      `}
    >
      {isFaceUp ? (
        <>
          <div className="self-start flex flex-col items-center">
            <span className={`text-lg font-bold leading-none ${isRed ? 'text-red-500' : 'text-slate-800'}`}>
              {card.rank}
            </span>
            <SuitIcon suit={card.suit} size={14} />
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <SuitIcon suit={card.suit} size={32} />
          </div>

          <div className="self-end flex flex-col items-center rotate-180">
            <span className={`text-lg font-bold leading-none ${isRed ? 'text-red-500' : 'text-slate-800'}`}>
              {card.rank}
            </span>
            <SuitIcon suit={card.suit} size={14} />
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-16 h-24 border-2 border-white/20 rounded-lg flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-white/10" />
          </div>
        </div>
      )}
    </motion.div>
  );
};
