/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CardData, Suit, Rank, GameStatus, Turn } from './types';
import { createDeck, shuffleDeck } from './constants';
import { Card } from './components/Card';
import { Trophy, RotateCcw, Info, Heart, Diamond, Club, Spade, MousePointer2 } from 'lucide-react';

export default function App() {
  const [deck, setDeck] = useState<CardData[]>([]);
  const [playerHand, setPlayerHand] = useState<CardData[]>([]);
  const [aiHand, setAiHand] = useState<CardData[]>([]);
  const [discardPile, setDiscardPile] = useState<CardData[]>([]);
  const [currentSuit, setCurrentSuit] = useState<Suit | null>(null);
  const [turn, setTurn] = useState<Turn>('player');
  const [status, setStatus] = useState<GameStatus>('playing');
  const [showSuitSelector, setShowSuitSelector] = useState(false);
  const [message, setMessage] = useState<string>("Welcome to Crazy Eights!");
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Initialize Game
  const initGame = useCallback(() => {
    const fullDeck = shuffleDeck(createDeck());
    const pHand = fullDeck.splice(0, 8);
    const aHand = fullDeck.splice(0, 8);
    
    // Ensure the first discard is not an 8 for simplicity in starting
    let firstDiscardIndex = 0;
    while (fullDeck[firstDiscardIndex].rank === Rank.EIGHT) {
      firstDiscardIndex++;
    }
    const firstDiscard = fullDeck.splice(firstDiscardIndex, 1)[0];

    setDeck(fullDeck);
    setPlayerHand(pHand);
    setAiHand(aHand);
    setDiscardPile([firstDiscard]);
    setCurrentSuit(firstDiscard.suit);
    setTurn('player');
    setStatus('playing');
    setMessage("Your turn! Match the suit or rank.");
    setShowSuitSelector(false);
    setIsAiThinking(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const checkWin = useCallback(() => {
    if (playerHand.length === 0) {
      setStatus('player_won');
      setMessage("Congratulations! You won!");
      return true;
    }
    if (aiHand.length === 0) {
      setStatus('ai_won');
      setMessage("AI won! Better luck next time.");
      return true;
    }
    return false;
  }, [playerHand.length, aiHand.length]);

  const canPlay = (card: CardData) => {
    if (card.rank === Rank.EIGHT) return true;
    const topCard = discardPile[discardPile.length - 1];
    return card.suit === currentSuit || card.rank === topCard.rank;
  };

  const drawCard = (target: Turn) => {
    if (deck.length === 0) {
      setMessage("Deck is empty! Skipping turn.");
      setTurn(target === 'player' ? 'ai' : 'player');
      return;
    }

    const newDeck = [...deck];
    const drawnCard = newDeck.pop()!;
    setDeck(newDeck);

    if (target === 'player') {
      setPlayerHand([...playerHand, drawnCard]);
      setMessage("You drew a card.");
      // Check if the drawn card can be played
      if (!canPlay(drawnCard)) {
        setTimeout(() => setTurn('ai'), 1000);
      }
    } else {
      setAiHand([...aiHand, drawnCard]);
      setMessage("AI drew a card.");
      // AI logic will handle if it can play it
    }
  };

  const playCard = (card: CardData, target: Turn) => {
    if (target === 'player') {
      setPlayerHand(playerHand.filter(c => c.id !== card.id));
    } else {
      setAiHand(aiHand.filter(c => c.id !== card.id));
    }

    setDiscardPile([...discardPile, card]);
    setCurrentSuit(card.suit);

    if (card.rank === Rank.EIGHT) {
      if (target === 'player') {
        setShowSuitSelector(true);
        setMessage("Choose a new suit!");
      } else {
        // AI chooses a suit (most frequent in its hand)
        const suitCounts: Record<string, number> = {};
        aiHand.forEach(c => {
          suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
        });
        const bestSuit = (Object.keys(suitCounts).sort((a, b) => suitCounts[b] - suitCounts[a])[0] as Suit) || Suit.SPADES;
        setCurrentSuit(bestSuit);
        setMessage(`AI played an 8 and chose ${bestSuit}!`);
        setTimeout(() => {
          if (!checkWin()) setTurn('player');
        }, 1500);
      }
    } else {
      setMessage(`${target === 'player' ? 'You' : 'AI'} played ${card.rank} of ${card.suit}.`);
      setTimeout(() => {
        if (!checkWin()) setTurn(target === 'player' ? 'ai' : 'player');
      }, 1000);
    }
  };

  // AI Turn Logic
  useEffect(() => {
    if (turn === 'ai' && status === 'playing' && !isAiThinking) {
      setIsAiThinking(true);
      setTimeout(() => {
        const playableCards = aiHand.filter(canPlay);
        if (playableCards.length > 0) {
          // Play a random playable card (or prioritize non-8s)
          const nonEights = playableCards.filter(c => c.rank !== Rank.EIGHT);
          const cardToPlay = nonEights.length > 0 ? nonEights[0] : playableCards[0];
          playCard(cardToPlay, 'ai');
        } else {
          if (deck.length > 0) {
            drawCard('ai');
            // After drawing, AI tries to play again
            setTimeout(() => {
              const newAiHand = [...aiHand]; // This is a bit tricky due to async state
              // We'll just end turn if it can't play after drawing for simplicity
              setTurn('player');
            }, 1000);
          } else {
            setMessage("AI has no moves and deck is empty. Skipping.");
            setTurn('player');
          }
        }
        setIsAiThinking(false);
      }, 2000);
    }
  }, [turn, aiHand, status, discardPile, currentSuit, deck.length]);

  const handleSuitSelect = (suit: Suit) => {
    setCurrentSuit(suit);
    setShowSuitSelector(false);
    setMessage(`You chose ${suit}!`);
    setTimeout(() => {
      if (!checkWin()) setTurn('ai');
    }, 1000);
  };

  const topDiscard = discardPile[discardPile.length - 1];

  return (
    <div className="min-h-screen bg-[#1a1c20] text-slate-200 font-sans p-4 sm:p-8 flex flex-col items-center overflow-hidden">
      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-2xl font-black text-white italic">8</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">CRAZY EIGHTS</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50">
            <Info size={16} className="text-indigo-400" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Standard Rules</span>
          </div>
          <button 
            onClick={initGame}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      {/* Game Board */}
      <main className="flex-1 w-full max-w-6xl grid grid-rows-[auto_1fr_auto] gap-8 relative">
        
        {/* AI Area */}
        <section className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
            <div className={`w-2 h-2 rounded-full ${turn === 'ai' ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Opponent (AI)</span>
            <span className="text-xs font-mono bg-red-500/20 px-2 py-0.5 rounded text-red-300">{aiHand.length} Cards</span>
          </div>
          <div className="flex justify-center -space-x-12 sm:-space-x-16 h-40">
            <AnimatePresence>
              {aiHand.map((card, idx) => (
                <Card key={card.id} card={card} isFaceUp={false} className="shadow-2xl" />
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Center Area (Deck & Discard) */}
        <section className="flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-24 relative">
          {/* Draw Pile */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
            <div 
              onClick={() => turn === 'player' && status === 'playing' && drawCard('player')}
              className={`
                relative cursor-pointer transition-transform hover:scale-105 active:scale-95
                ${turn !== 'player' || status !== 'playing' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="absolute -bottom-1 -right-1 w-28 h-40 bg-indigo-900 rounded-xl translate-x-1 translate-y-1" />
              <div className="absolute -bottom-2 -right-2 w-28 h-40 bg-indigo-950 rounded-xl translate-x-2 translate-y-2" />
              <Card card={{} as any} isFaceUp={false} className="relative z-10" />
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <span className="bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full border border-white/10">
                  {deck.length} LEFT
                </span>
              </div>
            </div>
            <p className="text-center mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Draw Pile</p>
          </div>

          {/* Discard Pile */}
          <div className="relative">
            <div className="absolute -inset-4 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="relative">
              {discardPile.slice(-3).map((card, idx) => (
                <Card 
                  key={card.id} 
                  card={card} 
                  className={`absolute top-0 left-0 shadow-xl transition-transform`}
                  style={{ 
                    transform: `rotate(${(idx - 1) * 5}deg) translate(${idx * 2}px, ${idx * 2}px)`,
                    zIndex: idx 
                  }}
                />
              ))}
              {/* Dummy card to maintain space */}
              <div className="invisible">
                <Card card={{} as any} />
              </div>
            </div>
            
            {/* Current Suit Indicator */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full shadow-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suit:</span>
              {currentSuit === Suit.HEARTS && <Heart size={14} className="fill-red-500 text-red-500" />}
              {currentSuit === Suit.DIAMONDS && <Diamond size={14} className="fill-red-500 text-red-500" />}
              {currentSuit === Suit.CLUBS && <Club size={14} className="fill-slate-200 text-slate-200" />}
              {currentSuit === Suit.SPADES && <Spade size={14} className="fill-slate-200 text-slate-200" />}
            </div>
            
            <p className="text-center mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Discard Pile</p>
          </div>

          {/* Status Message */}
          <div className="absolute bottom-0 sm:bottom-auto sm:right-0 flex flex-col items-center sm:items-end gap-2 text-center sm:text-right">
            <div className="px-4 py-2 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-xl shadow-xl max-w-[200px]">
              <p className="text-sm font-medium text-slate-200 italic leading-tight">"{message}"</p>
            </div>
            {isAiThinking && (
              <div className="flex items-center gap-2 text-indigo-400">
                <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1 h-1 bg-current rounded-full animate-bounce" />
                <span className="text-[10px] font-bold uppercase tracking-widest">AI Thinking</span>
              </div>
            )}
          </div>
        </section>

        {/* Player Area */}
        <section className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <div className={`w-2 h-2 rounded-full ${turn === 'player' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]' : 'bg-slate-600'}`} />
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">You (Player)</span>
            <span className="text-xs font-mono bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300">{playerHand.length} Cards</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl">
            <AnimatePresence>
              {playerHand.map((card) => (
                <Card 
                  key={card.id} 
                  card={card} 
                  isPlayable={turn === 'player' && status === 'playing' && canPlay(card)}
                  onClick={() => playCard(card, 'player')}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>

      </main>

      {/* Suit Selector Modal */}
      <AnimatePresence>
        {showSuitSelector && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center"
            >
              <h2 className="text-2xl font-bold text-white mb-2 italic">CRAZY 8!</h2>
              <p className="text-slate-400 text-sm mb-8">Choose the next suit to play</p>
              
              <div className="grid grid-cols-2 gap-4">
                {[Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES].map((suit) => (
                  <button
                    key={suit}
                    onClick={() => handleSuitSelect(suit)}
                    className="flex flex-col items-center gap-3 p-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl transition-all hover:scale-105 active:scale-95 group"
                  >
                    <div className="p-3 bg-slate-900 rounded-full group-hover:bg-slate-800 transition-colors">
                      {suit === Suit.HEARTS && <Heart size={32} className="fill-red-500 text-red-500" />}
                      {suit === Suit.DIAMONDS && <Diamond size={32} className="fill-red-500 text-red-500" />}
                      {suit === Suit.CLUBS && <Club size={32} className="fill-slate-200 text-slate-200" />}
                      {suit === Suit.SPADES && <Spade size={32} className="fill-slate-200 text-slate-200" />}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-300">{suit}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {status !== 'playing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, rotate: -2 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-slate-900 border-2 border-indigo-500/30 p-12 rounded-[2rem] shadow-[0_0_50px_rgba(99,102,241,0.2)] max-w-sm w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
              
              <div className="mb-8 inline-flex p-6 bg-indigo-500/10 rounded-full text-indigo-400">
                <Trophy size={64} />
              </div>
              
              <h2 className="text-4xl font-black text-white mb-4 tracking-tight uppercase italic">
                {status === 'player_won' ? 'Victory!' : 'Defeat'}
              </h2>
              
              <p className="text-slate-400 mb-10 text-lg font-medium leading-relaxed">
                {status === 'player_won' 
                  ? "You've cleared all your cards and mastered the game!" 
                  : "The AI outplayed you this time. Ready for a rematch?"}
              </p>
              
              <button
                onClick={initGame}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
              >
                <RotateCcw size={20} />
                PLAY AGAIN
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer / Controls Info */}
      <footer className="mt-12 w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <MousePointer2 size={12} className="text-slate-700" />
            <span>Click cards to play</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500/50" />
            <span>8 is Wild</span>
          </div>
        </div>
        <p>© 2026 CRAZY EIGHTS ENGINE v1.0</p>
      </footer>
    </div>
  );
}
