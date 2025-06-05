import { type Quote } from "@/config/quote";
import { LockKeyhole } from "lucide-react";
import React from "react";

import * as style from "./blocker.module.css"

interface BlockerProps {
  siteName: string
  message: Quote
  streak: number
  onOpenAnyway: () => void
}

/**
 * Overlay shown when a site is blocked
 */
export function Blocker({ siteName, message, streak, onOpenAnyway }: BlockerProps) {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.close();
  };

  return (
    <div className={`${style.container}`}
      style={{
        backgroundColor: message.bgColor,
      }}
    >
      <div className={style.wrapper}>
        <div className={style.content}>
          {/* Emoji */}
          <div className={style.emoji}>{message.icon}</div>

          {/* Title */}
          <h1 className={style.title}>{message.title}</h1>

          {/* Quote */}
          <div className={style.quoteContainer}>
            <p className={style.quote}>"{message.quote}"</p>
            <p className={style.author}>- {message.author}</p>
          </div>

          {/* Stats */}
          <div className={style.stats}>
            <p className={style.siteName}>{siteName}</p>
            <p className={style.streak}>
              <span className={style.streakEmoji}>🔥</span> Block Streak: {streak}
            </p>
          </div>

          <div className={style.buttonContainer}>
            {/* Action Button */}
            <div>
              <button onClick={handleClose} className={style.closeButton}>
                {message.buttonText}
              </button>
            </div>

            <button onClick={onOpenAnyway} className={style.openAnywayButton}>
              <LockKeyhole className={style.openAnywayIcon} />
              <span className={style.openAnywayText}>Open "{siteName}" anyway</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
