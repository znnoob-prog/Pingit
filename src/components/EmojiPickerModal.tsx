// src/components/EmojiPickerModal.tsx
import React from 'react';
import { X, Smile } from 'lucide-react';

interface EmojiPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

const EMOJI_LIST = [
  '⚡', '🚀', '🔥', '✨', '❤️', '👍', '🎉', '☕',
  '💡', '📍', '🌊', '😎', '🙌', '💯', '🌟', '💻',
  '🎧', '🎯', '🔥', '⚡', '🥳', '🙌', '🤝', '🍀'
];

export const EmojiPickerModal: React.FC<EmojiPickerModalProps> = ({ isOpen, onClose, onSelectEmoji }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-14 left-0 z-50 p-3 rounded-2xl bg-white border border-slate-200 shadow-xl dark:bg-slate-900 dark:border-slate-800 animate-in fade-in zoom-in-95 w-64">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
          <Smile className="w-3.5 h-3.5 text-violet-500" />
          <span>Quick Emojis</span>
        </span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {EMOJI_LIST.map((emoji, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onSelectEmoji(emoji);
              onClose();
            }}
            className="p-2 rounded-xl text-lg hover:bg-violet-100 dark:hover:bg-violet-950/60 transition-colors flex items-center justify-center"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
