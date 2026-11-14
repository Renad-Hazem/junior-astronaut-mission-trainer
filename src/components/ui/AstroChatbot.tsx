import { useCallback, useEffect, useRef, useState } from 'react'
import {
  askAstroBot,
  SPACE_BADGES,
  type BotResponse,
  type SpaceBadge,
} from '../../science/astroBotService'
import { BRAND } from './brand'

export interface ChatMessage {
  id: string
  sender: 'cadet' | 'bot'
  text: string
  responseDetails?: BotResponse
  timestamp: string
}

const BADGES_KEY = 'mars-base:collected-badges:v1'

function getStoredBadges(): string[] {
  try {
    const raw = window.localStorage.getItem(BADGES_KEY)
    return raw ? JSON.parse(raw) : ['planetary-scout']
  } catch {
    return ['planetary-scout']
  }
}

function persistBadges(badgeIds: string[]) {
  try {
    window.localStorage.setItem(BADGES_KEY, JSON.stringify(badgeIds))
  } catch {
    // Storage unavailable
  }
}

interface AstroChatbotProps {
  isOpen: boolean
  onClose: () => void
  currentMissionContext: string
  initialPrompt?: string | null
  onClearInitialPrompt?: () => void
  mode?: 'pre-mission' | 'gameplay'
}

export function AstroChatbot({
  isOpen,
  onClose,
  currentMissionContext,
  initialPrompt,
  onClearInitialPrompt,
  mode = 'pre-mission',
}: AstroChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'bot',
      text:
        mode === 'pre-mission'
          ? `🌟 Welcome to ${BRAND.assistantName}, Cadet! Ask about planets, rockets, black holes, telescopes, or life in space. Answers use a source-linked knowledge library, with an offline fallback.`
          : `Greetings Cadet! I am ${BRAND.assistantName}, your source-linked mission science guide. Ask a space question or request a hint while you explore ${BRAND.siteName} on Mars.`,
      timestamp: 'NOW',
    },
  ])

  const [inputText, setInputText] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [collectedBadges, setCollectedBadges] = useState<string[]>(getStoredBadges)
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<SpaceBadge | null>(null)
  const [showBadgeDeck, setShowBadgeDeck] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = useCallback(
    async (questionToSend?: string) => {
      const text = (questionToSend ?? inputText).trim()
      if (!text || isThinking) return

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'cadet',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, userMsg])
      setInputText('')
      setIsThinking(true)

      try {
        const botResponse = await askAstroBot(text, currentMissionContext)

        // Check for new space badge unlock
        if (botResponse.unlockedBadgeId) {
          const badgeId = botResponse.unlockedBadgeId
          setCollectedBadges((prev) => {
            if (!prev.includes(badgeId)) {
              const updated = [...prev, badgeId]
              persistBadges(updated)
              const badgeObj = SPACE_BADGES.find((b) => b.id === badgeId)
              if (badgeObj) setNewlyUnlockedBadge(badgeObj)
              return updated
            }
            return prev
          })
        }

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botResponse.answer,
          responseDetails: botResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages((prev) => [...prev, botMsg])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-err-${Date.now()}`,
            sender: 'bot',
            text:
              'AstroBot experienced radio interference with Aster Base telemetry. Try asking again!',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ])
      } finally {
        setIsThinking(false)
      }
    },
    [inputText, isThinking, currentMissionContext]
  )

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
      scrollToBottom()
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isThinking])

  // Handle triggered prompts from gameplay
  useEffect(() => {
    if (isOpen && initialPrompt) {
      const timer = setTimeout(() => {
        handleSend(initialPrompt)
        onClearInitialPrompt?.()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen, initialPrompt, handleSend, onClearInitialPrompt])

  if (!isOpen) return null

  return (
    <div className="astro-chatbot-overlay" role="presentation">
      <section
        className="astro-chatbot-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="astro-chat-title"
      >
        {/* Header */}
        <header className="astro-chatbot-header">
          <div className="astro-chatbot-brand">
            <span className="astro-chatbot-avatar">🤖</span>
            <div>
              <div className="astro-chatbot-title-row">
                <h2 id="astro-chat-title">
                  {BRAND.assistantName}
                </h2>
                <span className="astro-status-badge">SOURCE-LINKED GUIDE</span>
              </div>
              <small className="astro-chatbot-sub">
                {mode === 'pre-mission'
                  ? `Space learning companion for ${BRAND.descriptor}`
                  : `Telemetry Context: ${currentMissionContext}`}
              </small>
            </div>
          </div>
          <button
            type="button"
            className="astro-chatbot-close"
            onClick={onClose}
            aria-label="Close AstroBot dialog"
          >
            ×
          </button>
        </header>

        {/* Space Cadet Knowledge Badges Bar */}
        <div className="astro-badges-bar">
          <div className="astro-badges-summary">
            <span className="astro-badges-icon">🏆</span>
            <strong>Space Knowledge Badges:</strong>
            <span className="astro-badges-count">
              {collectedBadges.length} / {SPACE_BADGES.length} Collected
            </span>
          </div>
          <button
            type="button"
            className="astro-badge-toggle-btn"
            onClick={() => setShowBadgeDeck(!showBadgeDeck)}
          >
            {showBadgeDeck ? 'Hide Badges' : 'View Badge Showcase'}
          </button>
        </div>

        {/* Badge Showcase Drawer */}
        {showBadgeDeck && (
          <div className="astro-badge-deck" role="region" aria-label="Collected space badges">
            <div className="astro-badge-grid">
              {SPACE_BADGES.map((badge) => {
                const isUnlocked = collectedBadges.includes(badge.id)
                return (
                  <div
                    key={badge.id}
                    className={`astro-badge-card ${isUnlocked ? 'astro-badge-card--unlocked' : ''}`}
                    onClick={() => {
                      if (!isUnlocked) {
                        handleSend(`Tell me about ${badge.name} and ${badge.category}`)
                      }
                    }}
                    title={isUnlocked ? badge.description : `Click to ask AstroBot about ${badge.name}!`}
                  >
                    <span className="astro-badge-avatar">{badge.icon}</span>
                    <div className="astro-badge-info">
                      <strong>{badge.name}</strong>
                      <small>{isUnlocked ? '✓ Collected' : 'Tap to unlock'}</small>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Newly Unlocked Badge Toast */}
        {newlyUnlockedBadge && (
          <div className="astro-unlocked-toast">
            <span>🎉 NEW KNOWLEDGE BADGE UNLOCKED!</span>
            <strong>
              {newlyUnlockedBadge.icon} {newlyUnlockedBadge.name}
            </strong>
            <button
              type="button"
              className="toast-dismiss-btn"
              onClick={() => setNewlyUnlockedBadge(null)}
            >
              ✓
            </button>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className="astro-quick-chips">
          {mode === 'pre-mission' ? (
            <>
              <button
                type="button"
                className="astro-chip"
                onClick={() => handleSend('What is a black hole and what happens if you fall in?')}
              >
                🌌 Black Holes
              </button>
              <button
                type="button"
                className="astro-chip"
                onClick={() => handleSend('How do rockets launch into space and reach escape velocity?')}
              >
                🚀 How Rockets Work
              </button>
              <button
                type="button"
                className="astro-chip"
                onClick={() => handleSend('How do astronauts eat, sleep, and exercise in microgravity?')}
              >
                🧑‍🚀 Astronaut Life
              </button>
              <button
                type="button"
                className="astro-chip"
                onClick={() => handleSend('What are the most extreme planets in our Solar System?')}
              >
                🪐 Extreme Planets
              </button>
              <button
                type="button"
                className="astro-chip"
                onClick={() => handleSend('What has the James Webb Space Telescope discovered?')}
              >
                🔭 James Webb Telescope
              </button>
              <button
                type="button"
                className="astro-chip"
                onClick={() => handleSend('What are solar flares and coronal mass ejections?')}
              >
                ☀️ Solar Storms
              </button>
              <button
                type="button"
                className="astro-chip"
                onClick={() => handleSend('Could life exist on moons like Europa or Mars?')}
              >
                🧬 Alien Life & Moons
              </button>
              <button
                type="button"
                className="astro-chip"
                onClick={() => handleSend('How do humans make oxygen and clean water on Mars?')}
              >
                🛡️ Mars Life Support
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="astro-chip"
                onClick={() =>
                  handleSend(
                    `Give me a tactical engineering hint for our current mission objective: ${currentMissionContext}`
                  )
                }
              >
                💡 Mission Hint
              </button>
              <button
                type="button"
                className="astro-chip"
                onClick={() => handleSend('What do saved NASA solar activity snapshots show?')}
              >
                ☀️ Saved Solar Activity
              </button>
              <button
                type="button"
                className="astro-chip"
                onClick={() => handleSend('How does NASA MOXIE make breathable oxygen on Mars?')}
              >
                💨 Oxygen on Mars
              </button>
              <button
                type="button"
                className="astro-chip"
                onClick={() => handleSend('How do astronauts protect against cosmic radiation?')}
              >
                🛡️ Radiation Shielding
              </button>
              <button
                type="button"
                className="astro-chip"
                onClick={() => handleSend('How does Martian hydroponics grow food without soil?')}
              >
                🌱 Martian Greenhouse
              </button>
            </>
          )}
        </div>

        {/* Message Stream */}
        <div className="astro-chatbot-messages" tabIndex={0}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`astro-message-row ${
                msg.sender === 'cadet' ? 'astro-message-row--cadet' : 'astro-message-row--bot'
              }`}
            >
              <div className="astro-message-bubble">
                <div className="astro-message-meta">
                  <strong>{msg.sender === 'cadet' ? 'Cadet Explorer' : 'AstroBot'}</strong>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="astro-message-text">{msg.text}</p>

                {/* Bot citations and science terms */}
                {msg.responseDetails && (
                  <div className="astro-message-extra">
                    {msg.responseDetails.jargon.length > 0 && (
                      <div className="astro-jargon-box">
                        <span className="astro-extra-title">🪐 SCIENCE TERMS</span>
                        <div className="astro-jargon-tags">
                          {msg.responseDetails.jargon.map((item, i) => (
                            <span key={i} className="astro-jargon-pill">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.responseDetails.sources.length > 0 && (
                      <div className="astro-sources-box">
                        <span className="astro-extra-title">
                          📚 SOURCES PROVIDED
                        </span>
                        <div className="astro-sources-list">
                          {msg.responseDetails.sources.map((src, i) => (
                            <a
                              key={i}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="astro-source-link"
                            >
                              <span>{src.title}</span>
                              <small>{src.dataset || 'NASA Science Data'}</small>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="astro-message-row astro-message-row--bot">
              <div className="astro-message-bubble astro-thinking-bubble">
                <span className="astro-pulse" /> {BRAND.assistantName} is searching the source library...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          className="astro-chatbot-input-bar"
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
        >
          <input
            ref={inputRef}
            type="text"
            className="astro-chat-input"
            placeholder={
              mode === 'pre-mission'
                ? 'Ask anything! e.g., How far is Mars? What is a supernova?'
                : 'Ask AstroBot about systems, science, or mission hints...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isThinking}
          />
          <button
            type="submit"
            className="primary-button astro-chat-submit"
            disabled={!inputText.trim() || isThinking}
          >
            Ask <span aria-hidden="true">→</span>
          </button>
        </form>
      </section>
    </div>
  )
}
