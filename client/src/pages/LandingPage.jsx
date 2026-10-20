import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import BoardPreview from "../components/landing/BoardPreview";
import Icon from "../components/layout/Icon";

const FEATURES = [
  { emoji: "🧲", title: "Pin anything, anywhere", text: "A huge cork board that's all yours. Double-click to stick a note, drag it wherever it makes sense." },
  { emoji: "🖼️", title: "Photos, videos & files", text: "Notes aren't just text. Drop in images, videos, voice notes or PDFs — or paste a screenshot." },
  { emoji: "🌍", title: "Publish the good ones", text: "Everything is private until you choose. One click sends a note to the public board for everyone." },
  { emoji: "💬", title: "Opinions & likes", text: "People can like public notes, leave their opinion, or pin their own note right next to yours." },
  { emoji: "🤝", title: "Friends & private chat", text: "Find people by username, add them as friends and chat one-to-one with photos, in real time." },
  { emoji: "⚡", title: "Live, everywhere", text: "See notes move, comments land and messages arrive instantly — on every device you're signed in on." },
];

const STEPS = [
  { title: "Create your account", text: "Takes ten seconds. Just a username, email and password." },
  { title: "Fill your board", text: "Thoughts, plans, photos, clips — pin them on your private board." },
  { title: "Share & connect", text: "Publish what you're proud of, collect opinions, make friends, chat." },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="landing">
      {/* ---------- Nav ---------- */}
      <header className="landing-nav">
        <Link to="/" className="logo">
          <span className="logo__pin" aria-hidden="true" />
          <span className="logo__text">Pinboard</span>
        </Link>
        <nav className="landing-nav__links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
        </nav>
        <div className="landing-nav__actions">
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode">
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>
          <Link to="/login" className="btn btn--ghost btn--sm">Log in</Link>
          <Link to="/register" className="btn btn--primary btn--sm">Sign up free</Link>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="hero__copy">
          <span className="eyebrow"><Icon name="sparkle" size={14} /> Your ideas, on a wall that talks back</span>
          <h1 className="hero__title">
            Pin your ideas.<br />
            <span className="hero__underline">Share the good ones.</span>
          </h1>
          <p className="hero__text">
            Pinboard is a real-time cork board for your notes, photos and videos. Keep a private board for yourself,
            publish your best notes to the public board, and chat with friends — all in one place.
          </p>
          <div className="hero__cta">
            <Link to="/register" className="btn btn--primary btn--lg">Create your board →</Link>
            <Link to="/login" className="btn btn--ghost btn--lg">I already have an account</Link>
          </div>
          <p className="hero__note">Free · No credit card · Sign in required to use the boards</p>
        </div>
        <BoardPreview />
      </section>

      {/* ---------- Features ---------- */}
      <section className="section" id="features">
        <div className="section__head">
          <span className="eyebrow">Features</span>
          <h2>Everything a good bulletin board should do</h2>
          <p>…plus a few things a real cork board never could.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <article key={f.title} className="feature" style={{ "--r": `${(i % 3) - 1}deg` }}>
              <span className="feature__emoji">{f.emoji}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="section section--tint" id="how">
        <div className="section__head">
          <span className="eyebrow">How it works</span>
          <h2>Up and pinning in three steps</h2>
        </div>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="step">
              <span className="step__num">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Final call to action ---------- */}
      <section className="cta-band">
        <div className="cta-band__card">
          <span className="pnote__pin" aria-hidden="true" />
          <h2>Your board is waiting.</h2>
          <p>Sign up to start pinning — it's free.</p>
          <div className="hero__cta">
            <Link to="/register" className="btn btn--primary btn--lg">Sign up</Link>
            <Link to="/login" className="btn btn--ghost btn--lg">Log in</Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <span>📌 Pinboard</span>
        <span className="muted">Built with MongoDB · Express · React · Node</span>
      </footer>
    </div>
  );
}
