
import { useEffect, useState } from "react";
import "./App.css";

const careers = [
  {
    title: "Full Stack Developer",
    category: "WEB DEVELOPMENT",
    icon: "💻",
    description: "Build modern websites and complete web applications.",
    skills: ["HTML & CSS", "JavaScript", "React"],
    duration: "12 weeks",
    color: "purple",
  },
  {
    title: "Data Analyst",
    category: "DATA & ANALYTICS",
    icon: "📊",
    description: "Turn data into meaningful insights and decisions.",
    skills: ["Excel", "SQL", "Python"],
    duration: "10 weeks",
    color: "blue",
  },
  {
    title: "Cybersecurity Analyst",
    category: "CYBERSECURITY",
    icon: "🛡️",
    description: "Learn to protect systems, networks, and information.",
    skills: ["Networking", "Linux", "Security"],
    duration: "14 weeks",
    color: "green",
  },
  {
    title: "AI / ML Engineer",
    category: "ARTIFICIAL INTELLIGENCE",
    icon: "🤖",
    description: "Explore machine learning and intelligent applications.",
    skills: ["Python", "Statistics", "ML"],
    duration: "16 weeks",
    color: "orange",
  },
];

const roadmaps = {
  "Full Stack Developer": [
    { title: "HTML & CSS Fundamentals", time: "Week 1–2" },
    { title: "JavaScript Essentials", time: "Week 3–5" },
    { title: "React.js Development", time: "Week 6–8" },
    { title: "Node.js and Express.js", time: "Week 9–10" },
    { title: "MongoDB Database", time: "Week 11–12" },
    { title: "Build and Deploy a Full Stack Project", time: "Week 13–16" },
  ],

  "Data Analyst": [
    { title: "Excel Fundamentals", time: "Week 1–2" },
    { title: "SQL and Database Queries", time: "Week 3–5" },
    { title: "Python for Data Analysis", time: "Week 6–8" },
    { title: "Statistics and Data Cleaning", time: "Week 9–10" },
    { title: "Power BI Data Visualization", time: "Week 11–12" },
    { title: "Build a Data Analytics Project", time: "Week 13–16" },
  ],

  "Cybersecurity Analyst": [
    { title: "Networking Fundamentals", time: "Week 1–2" },
    { title: "Linux and Operating Systems", time: "Week 3–4" },
    { title: "Cybersecurity Fundamentals", time: "Week 5–7" },
    { title: "Security Tools and Log Analysis", time: "Week 8–10" },
    { title: "Threat Detection and Risk Assessment", time: "Week 11–13" },
    { title: "Build a Cybersecurity Lab Project", time: "Week 14–16" },
  ],

  "AI / ML Engineer": [
    { title: "Python Programming", time: "Week 1–3" },
    { title: "Mathematics and Statistics Basics", time: "Week 4–5" },
    { title: "NumPy and Pandas", time: "Week 6–7" },
    { title: "Machine Learning Fundamentals", time: "Week 8–10" },
    { title: "Model Training and Evaluation", time: "Week 11–13" },
    { title: "Build an AI/ML Project", time: "Week 14–16" },
  ],
};

function App() {
  const [selectedCareer, setSelectedCareer] = useState(careers[0]);
  const [completed, setCompleted] = useState([]);
  const [showCareers, setShowCareers] = useState(false);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pathpilotUser") || "null"); }
    catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("pathpilotToken") || "");
  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  

useEffect(() => {
  let cancelled = false;

  async function loadRoadmap() {
    if (!token || !user) {
      setCompleted([]);
      return;
    }

    try {
      const response = await fetch(
        `https://pathpilot-backend-s2ob.onrender.com/api/roadmap/${encodeURIComponent(
          selectedCareer.title
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load roadmap");
      }

      const data = await response.json();

      if (!cancelled) {
        setCompleted(
          Array.isArray(data.completedMilestones)
            ? data.completedMilestones
            : []
        );
      }
    } catch (error) {
      if (!cancelled) {
        console.error("Error loading roadmap:", error);
      }
    }
  }

  loadRoadmap();

  return () => {
    cancelled = true;
  };
}, [selectedCareer.title, token, user]);



  const currentRoadmap = roadmaps[selectedCareer.title] || [];

const progress =
    currentRoadmap.length > 0
      ? Math.round((completed.length / currentRoadmap.length) * 100)
      : 0;

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthMessage("");
    try {
      const response = await fetch(`https://pathpilot-backend-s2ob.onrender.com/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: authName, email: authEmail, password: authPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to continue");
      localStorage.setItem("pathpilotToken", data.token);
      localStorage.setItem("pathpilotUser", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setAuthPassword("");
      setAuthMessage("");
    } catch (error) {
      setAuthMessage(error.message || "Could not connect to the server. Make sure the backend is running.");
    } finally {
      setAuthBusy(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("pathpilotToken");
    localStorage.removeItem("pathpilotUser");
    setToken("");
    setUser(null);
    setCompleted([]);
    setAuthName("");
    setAuthEmail("");
    setAuthPassword("");
    setAuthMode("login");
    setAuthMessage("You have logged out successfully.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseCareer(career) {
    setSelectedCareer(career);
    setCompleted([]);
    setShowCareers(false);
    document.getElementById("roadmap")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  
async function toggleMilestone(index) {
  if (!token || !user) return;
  const updatedCompleted = completed.includes(index)
    ? completed.filter((item) => item !== index)
    : [...completed, index];
  setCompleted(updatedCompleted);
  try {
    const response = await fetch("https://pathpilot-backend-s2ob.onrender.com/api/roadmap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        careerTitle: selectedCareer.title,
        completedMilestones: updatedCompleted,
      }),
    });
    if (!response.ok) throw new Error("Failed to save progress");
    console.log("Roadmap progress saved successfully!");
  } catch (error) {
    console.error("Error saving roadmap:", error);
  }
}

  if (!user || !token) {
    return (
      <div className="auth-page">
        <div className="auth-brand"><span className="brand-icon">✦</span> Path<span> Pilot</span></div>
        <section className="auth-card">
          <div className="auth-kicker">YOUR FUTURE, YOUR PLAN</div>
          <h1>{authMode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p>{authMode === "login" ? "Log in to continue your career journey." : "Register to save your personal learning progress."}</p>
          <form onSubmit={handleAuthSubmit}>
            {authMode === "register" && <label>Full name<input value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Enter your name" required minLength={2} autoComplete="name" /></label>}
            <label>Email address<input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value.trim())} placeholder="you@example.com" required autoComplete="email" /></label>
            <label>Password<input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} autoComplete={authMode === "login" ? "current-password" : "new-password"} /></label>
            <button className="primary-button auth-submit" type="submit" disabled={authBusy}>{authBusy ? "Please wait…" : authMode === "login" ? "Log in" : "Create account"}</button>
          </form>
          {authMessage && <p className="auth-message" role="alert">{authMessage}</p>}
          <p className="auth-switch">{authMode === "login" ? "New to PathPilot?" : "Already have an account?"} <button type="button" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthMessage(""); }}>{authMode === "login" ? "Register" : "Log in"}</button></p>
          <small className="auth-security">Your roadmap progress is saved to your account.</small>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">✦</span>
          <span>Path<span className="brand-accent">Pilot</span></span>
        </a>

        <nav className="nav-links">
          <a className="nav-active" href="#home">Home</a>
          <a href="#careers">Explore Careers</a>
          <a href="#roadmap">My Roadmap</a>
        </nav>

        <div className="account-controls">
          <a className="profile-button" href="#profile">My Planner <span>↗</span></a>
          <button className="logout-button" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <main>
        <section className="hero section-width" id="home">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              YOUR FUTURE, YOUR PLAN
            </div>

            <h1>
              Your career.
              <br />
              <span>Your next chapter.</span>
            </h1>

            <p className="hero-description">
              Turn your ambitions into action. Discover your career
              path, build essential skills, and celebrate every
              milestone along the way.
            </p>

            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={() =>
                  document.getElementById("careers")?.scrollIntoView({
                    behavior: "smooth",
                  })
                }
              >
                Explore career paths <span>→</span>
              </button>

              <a className="text-button" href="#roadmap">
                View my roadmap ↗
              </a>
            </div>

            <div className="hero-note">
              <span className="note-icon">✦</span>
              Small steps today. Big possibilities tomorrow.
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-orbit orbit-one"></div>
            <div className="visual-orbit orbit-two"></div>

            <div className="visual-card visual-top">
              <span className="visual-card-icon">🎯</span>
              <div>
                <strong>Goals that matter</strong>
                <small>One step at a time</small>
              </div>
              <span className="mini-check">✓</span>
            </div>

            <div className="visual-center">
              <div className="center-sparkle">✦</div>
              <div className="center-icon">🧭</div>
              <span>YOUR PATH</span>
              <strong>Starts here.</strong>
            </div>

            <div className="visual-card visual-bottom">
              <div className="progress-ring">↗</div>
              <div>
                <strong>Progress, not pressure</strong>
                <small>Your journey, your pace</small>
              </div>
            </div>

            <span className="floating-star star-one">✦</span>
            <span className="floating-star star-two">✧</span>
            <span className="floating-star star-three">✦</span>
          </div>
        </section>

        <section className="profile-strip section-width" id="profile">
          <div className="profile-avatar">{(user.name || user.email || "U").charAt(0).toUpperCase()}</div>
          <div className="profile-details"><span className="section-kicker">YOUR PROFILE</span><strong>{user.name}</strong><span>{user.email}</span></div>
          <button className="outline-button" onClick={handleLogout}>Log out</button>
        </section>

        <section className="stats section-width">
          <div className="stat-item">
            <span className="stat-icon lavender">◎</span>
            <div>
              <strong>4</strong>
              <span>Career pathways</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon mint">✓</span>
            <div>
              <strong>{completed.length} / {currentRoadmap.length}</strong>
              <span>Milestones completed</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon peach">↗</span>
            <div>
              <strong>{progress}%</strong>
              <span>Roadmap progress</span>
            </div>
          </div>
        </section>

        <section className="career-section section-width" id="careers">
          <div className="section-heading">
            <div>
              <span className="section-kicker">FIND YOUR DIRECTION</span>
              <h2>Explore career paths<span>.</span></h2>
              <p>Find a path that matches your interests and ambitions.</p>
            </div>

            <button
              className="outline-button"
              onClick={() => setShowCareers(!showCareers)}
            >
              {showCareers ? "Show less ↑" : "Explore all careers →"}
            </button>
          </div>

          <div className="career-grid">
            {careers
              .filter((career, index) => showCareers || index < 3)
              .map((career) => (
                <article className="career-card" key={career.title}>
                  <div className="career-card-top">
                    <span className={`career-icon ${career.color}`}>
                      {career.icon}
                    </span>
                    <span className="career-arrow">↗</span>
                  </div>

                  <span className="career-category">
                    {career.category}
                  </span>
                  <h3>{career.title}</h3>
                  <p className="career-description">
                    {career.description}
                  </p>

                  <div className="skill-list">
                    {career.skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>

                  <div className="career-card-footer">
                    <span>◷ {career.duration}</span>
                    <button onClick={() => chooseCareer(career)}>
                      View roadmap →
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </section>

        <section className="roadmap-section section-width" id="roadmap">
          <div className="roadmap-panel">
            <div className="roadmap-main">
              <span className="section-kicker">YOUR LEARNING JOURNEY</span>
              <h2>Make progress, <span>one step at a time.</span></h2>
              <p>
                Your learning plan for{" "}
                <strong>{selectedCareer.title}</strong>. Mark each milestone
                complete as you progress through your learning journey.
              </p>

              <div className="progress-heading">
                <span>Overall progress</span>
                <strong>{progress}%</strong>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="Roadmap progress"
              >
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className="milestone-list">
                {currentRoadmap.map((item, index) => {
                  const isDone = completed.includes(index);

                  return (
                    <div
                      className={`milestone ${isDone ? "milestone-done" : ""}`}
                      key={item.title}
                    >
                      <button
                        className="milestone-check"
                        onClick={() => toggleMilestone(index)}
                        aria-label={
                          isDone
                            ? `Mark ${item.title} incomplete`
                            : `Mark ${item.title} complete`
                        }
                      >
                        {isDone ? "✓" : index + 1}
                      </button>

                      <div className="milestone-info">
                        <strong>{item.title}</strong>
                        <span>{item.time}</span>
                      </div>

                      <span className="milestone-status">
                        {isDone ? "Completed" : "To do"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="demo-note">
                Your progress is saved automatically when the database is connected.
              </p>
            </div>

            <aside className="roadmap-aside">
              <div className="aside-decoration">✳</div>
              <span className="aside-label">A LITTLE REMINDER</span>
              <h3>You don't have to figure it all out today.</h3>
              <p>
                Focus on your next milestone. Every new skill brings
                you closer to the future you're building.
              </p>
              <div className="aside-line"></div>
              <span className="aside-footer">KEEP LEARNING. KEEP GROWING. ✦</span>
            </aside>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">✦</span>
          <span>Path<span className="brand-accent">Pilot</span></span>
        </a>
        <p>Plan with purpose. Grow with confidence.</p>
        <span>Career Roadmap Planner · 2026</span>
      </footer>
    </div>
  );
}

export default App;
