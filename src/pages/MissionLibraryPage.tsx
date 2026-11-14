import { useState } from "react";
import { AstroChatbot } from "../components/ui/AstroChatbot";
import { AvatarIdentity } from "../components/ui/AvatarIdentity";
import { AvatarPicker } from "../components/ui/AvatarPicker";
import { BRAND } from "../components/ui/brand";
import {
  bonusMission,
  isLevelUnlocked,
  missionLevels,
  useGameStore,
} from "../game/uiAdapter";
import { BONUS_MISSION_05 } from "../data/nasa/bonusMission05";
import { useAvatarSelection } from "./useAvatarSelection";

const missionIcons = ["🚀", "☀️", "O₂", "🛡️"];

export function MissionLibraryPage() {
  const selectLevel = useGameStore((state) => state.selectLevel);
  const completedLevelIds = useGameStore((state) => state.completedLevelIds);
  const completedBonusMissionIds = useGameStore(
    (state) => state.completedBonusMissionIds,
  );
  const { selectedAvatarId, selectAvatar } = useAvatarSelection();
  const [isChangingAvatar, setIsChangingAvatar] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  return (
    <div className="library-page page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ⌁
          </span>
          <span>
            {BRAND.siteName}<small>{BRAND.networkLabel}</small>
          </span>
        </div>
        <div className="library-topbar-actions">
          <button
            type="button"
            className="home-ai-pill-btn"
            onClick={() => setIsChatOpen(true)}
            title="Ask AstroBot anything about space before your mission"
          >
            <span>🤖 {BRAND.assistantName}</span>
            <small>Source-linked space guide</small>
          </button>
          <AvatarIdentity avatarId={selectedAvatarId} label="Mission cadet" />
        </div>
      </header>
      <section className="page-intro">
        <span className="eyebrow">CHOOSE YOUR NEXT CHALLENGE</span>
        <h1>Mission Library</h1>
        <p>
          Begin with Mission 01. Complete each training mission to unlock the
          next challenge while keeping completed missions ready to replay.
        </p>
        <div className="library-avatar-control">
          <AvatarIdentity avatarId={selectedAvatarId} />
          <button
            type="button"
            className="secondary-button"
            onClick={() => setIsChangingAvatar(true)}
          >
            Change Astronaut
          </button>
          <button
            type="button"
            className="primary-button library-ask-ai-btn"
            onClick={() => setIsChatOpen(true)}
          >
            <span>🤖 Ask AstroBot Anything</span>
            <small>Collect Space Badges!</small>
          </button>
        </div>
      </section>
      {/* <p className="progression-fixture-note" role="note">Training progress is currently provided by an in-session UI adapter until Malak’s approved progression API is integrated.</p> */}
      <section
        className="mission-grid"
        aria-label="Mission progression"
        aria-live="polite"
      >
        {missionLevels.map((level, index) => {
          const completed = completedLevelIds.includes(level.id);
          const unlocked = isLevelUnlocked(level.id, completedLevelIds);
          const previousLevel = missionLevels[index - 1];
          const stateLabel = completed
            ? "Completed · Replay available"
            : unlocked
              ? "Ready to play"
              : "Locked";
          return (
            <article
              className={`mission-card mission-card--${index + 1} ${completed ? "mission-card--completed" : ""} ${!unlocked ? "mission-card--locked" : ""}`}
              key={level.id}
            >
              <div className="mission-card__visual">
                <span className="mission-card__number">0{level.order}</span>
                <span className="mission-card__icon" aria-hidden="true">
                  {missionIcons[index]}
                </span>
                <span className="mission-card__minutes">
                  {level.estimatedMinutes[0]}–{level.estimatedMinutes[1]} MIN
                  TARGET
                </span>
                {!unlocked && (
                  <span className="mission-card__lock" aria-hidden="true">
                    ⌾
                  </span>
                )}
              </div>
              <div className="mission-card__body">
                <div className="mission-card__meta">
                  <span>LEVEL {level.order}</span>
                  <span
                    className={`difficulty difficulty--${level.difficulty.toLowerCase()}`}
                  >
                    {level.difficulty}
                  </span>
                </div>
                <span
                  className={`mission-state mission-state--${completed ? "completed" : unlocked ? "ready" : "locked"}`}
                >
                  {stateLabel}
                </span>
                <h2>{level.title}</h2>
                <p className="mission-card__story">{level.storyIntro}</p>
                <div className="learning-objective">
                  <strong>YOU’LL LEARN</strong>
                  <span>{level.objective}</span>
                </div>
                {!unlocked && (
                  <p className="mission-unlock-copy">
                    Complete Mission 0{previousLevel?.order ?? level.order - 1}{" "}
                    · {previousLevel?.title ?? "the previous mission"} to
                    unlock.
                  </p>
                )}
                <button
                  type="button"
                  className="card-button"
                  disabled={!unlocked}
                  aria-label={`${completed ? "Replay" : "Start"} ${level.title}${!unlocked ? ", locked" : ""}`}
                  onClick={() => selectLevel(level.id)}
                >
                  {!unlocked
                    ? "Mission Locked"
                    : completed
                      ? "Replay Mission"
                      : "Start Mission"}{" "}
                  <span aria-hidden="true">{!unlocked ? "⌾" : "→"}</span>
                </button>
              </div>
            </article>
          );
        })}
      </section>
      <section className="bonus-mission-section" aria-labelledby="bonus-mission-title">
        <div className="bonus-mission-section__intro">
          <span className="eyebrow">OPTIONAL NASA DATA MISSION</span>
          <h2 id="bonus-mission-title">Bonus Mission 05</h2>
          <p>
            This replay is always available for the demo and never changes the
            four-mission unlock path.
          </p>
        </div>
        <article className="mission-card mission-card--bonus">
          <div className="mission-card__visual">
            <span className="mission-card__number">05</span>
            <span className="mission-card__icon" aria-hidden="true">☀️</span>
            <span className="mission-card__minutes">
              {bonusMission.estimatedMinutes[0]}–{bonusMission.estimatedMinutes[1]} MIN TARGET
            </span>
          </div>
          <div className="mission-card__body">
            <div className="mission-card__meta">
              <span>BONUS · MAY 2024 REPLAY</span>
              <span className="difficulty difficulty--bonus">NASA EVIDENCE</span>
            </div>
            <span className={`mission-state ${completedBonusMissionIds.includes(bonusMission.id) ? "mission-state--completed" : "mission-state--ready"}`}>
              {completedBonusMissionIds.includes(bonusMission.id)
                ? "Completed · Replay available"
                : "Always available"}
            </span>
            <h2>{bonusMission.title}</h2>
            <p className="mission-card__story">{BONUS_MISSION_05.tagline}</p>
            <div className="learning-objective">
              <strong>HISTORICAL EVIDENCE</strong>
              <span>
                Compare actual measurements, model predictions, NASA statements,
                and fictional training values.
              </span>
            </div>
            <button
              type="button"
              className="card-button"
              onClick={() => selectLevel(bonusMission.id)}
            >
              {completedBonusMissionIds.includes(bonusMission.id)
                ? "Replay Bonus Mission"
                : "Start Bonus Mission"}{" "}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </article>
      </section>
      <footer className="site-footer">
        All missions use friendly, nonviolent engineering challenges. You can
        replay any mission at any time.
      </footer>
      {isChangingAvatar && (
        <AvatarPicker
          initialAvatarId={selectedAvatarId}
          onConfirm={(avatarId) => {
            selectAvatar(avatarId);
            setIsChangingAvatar(false);
          }}
          onCancel={() => setIsChangingAvatar(false)}
        />
      )}
      <AstroChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        mode="pre-mission"
        currentMissionContext={`${BRAND.siteName} Mission Library`}
      />
    </div>
  );
}
