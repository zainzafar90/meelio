import { type Quote } from "@/config/quote";
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
          <h1 className={style.title}>
            {siteName.replace("www.", "")} blocked <div style={{
              fontSize: '14px',
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '4px',
            }}>to help you focus</div>
          </h1>

          {/* Stats */}
          <div className={style.stats}>
            <p className={style.streak}>
              <span className={style.streakEmoji}>🔥</span> Block Streak: {streak}
            </p>
          </div>

          <div className={style.buttonContainer}>
            {/* Action Button */}
              <button onClick={handleClose} className={style.closeButton}>
                Close
              </button>

            <button onClick={onOpenAnyway} className={style.openAnywayButton}>
              <span className={style.openAnywayText}>
                <span className={style.openAnywayIcon}>🔒</span>{" "}
                Open "{siteName}" anyway
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
