import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import confetti from "canvas-confetti";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function App() {
  const [mode, setMode] = useState("free");
  const [startActor, setStartActor] = useState(null);
  const [goalActor, setGoalActor] = useState(null);
  const [chain, setChain] = useState([]);
  const [actorInput, setActorInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestType, setSuggestType] = useState("actor");
  const [gameOver, setGameOver] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState({ currentStreak: 0, bestLinkCount: null });
  const [isLoading, setIsLoading] = useState(false);
  const actorInputRef = useRef(null); // ✅ added for auto-focus

  const fetchNewGame = async (preserveStreak = true) => {
    setGameOver(false);
    setChain([]);
    setSuggestions([]);
    setTitleInput("");
    setActorInput("");
    setCopied(false);
    try {
      const res = await axios.get(`${BACKEND_URL}/generate-actors`);
      setStartActor(res.data.start);
      setGoalActor(res.data.goal);
      if (!preserveStreak) {
        setStats((prev) => ({ ...prev, currentStreak: 0 }));
      }
    } catch (error) {
      console.error("Failed to generate actors:", error);
    }
  };

  useEffect(() => {
    fetchNewGame();
    fetchLeaderboard();
  }, []);

  const handleSubmit = async () => {
    if (!titleInput || !actorInput) return;
    setIsLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/validate-link`, {
        title: titleInput,
        actor: actorInput,
        chain,
      });
      if (res.data.valid) {
        const newChain = [...chain, res.data.movie, res.data.actor];
        setChain(newChain);
        setActorInput("");
        setTitleInput("");
        setSuggestions([]);
        if (actorInputRef.current) {
          actorInputRef.current.focus(); // ✅ auto-focus actor input
        }
        if (res.data.actor.id === goalActor.id) {
          setGameOver(true);
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          if (mode === "daily") setShowModal(true);
          setStats((prev) => ({
            currentStreak: prev.currentStreak + 1,
            bestLinkCount:
              prev.bestLinkCount === null || newChain.length < prev.bestLinkCount
                ? newChain.length
                : prev.bestLinkCount,
          }));
        }
      } else {
        alert("Invalid connection!");
      }
    } catch (error) {
      console.error("Error validating link:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = async (e, type) => {
    const value = e.target.value;
    if (type === "actor") {
      setActorInput(value);
    } else {
      setTitleInput(value);
    }
    setSuggestType(type);
    if (!value) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await axios.get(`${BACKEND_URL}/suggest`, {
        params: { query: value, type },
      });
      setSuggestions(res.data);
    } catch (error) {
      console.error("Suggestion fetch failed:", error);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestType === "actor") {
      setActorInput(suggestion.name);
    } else {
      setTitleInput(suggestion.name);
    }
    setSuggestions([]);
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/leaderboard`);
      setLeaderboard(res.data);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    }
  };

  const handleNameSubmit = async () => {
    try {
      await axios.post(`${BACKEND_URL}/submit-score`, {
        name: nameInput,
        links: chain.length,
      });
      fetchLeaderboard();
      setShowModal(false);
      setNameInput("");
    } catch (error) {
      console.error("Failed to submit name:", error);
    }
  };

  return (
    <div className="App">
      <h1>ScreenLink</h1>
      <p className="description">
        Connect the <b>Start</b> actor to the <b>Goal</b> actor by entering movie titles and actors they’ve worked with — one link at a time.
      </p>

      <div className="mode-toggle">
        <button
          className={mode === "daily" ? "active" : ""}
          onClick={() => setMode("daily")}
        >
          Daily
        </button>
        <button
          className={mode === "free" ? "active" : ""}
          onClick={() => setMode("free")}
        >
          Free Play
        </button>
      </div>

      <div className="streak-bar">
        Streak: {stats.currentStreak} | Best Score: {stats.bestLinkCount ?? "—"}
      </div>

      <div className="actor-pair">
        {startActor && (
          <div className="actor-card">
            <img src={startActor.image} alt={startActor.name} />
            <p><strong>Start:</strong> {startActor.name}</p>
          </div>
        )}
        {goalActor && (
          <div className="actor-card goal">
            <img src={goalActor.image} alt={goalActor.name} />
            <p className="goal-name"><strong>Goal:</strong> {goalActor.name}</p>
          </div>
        )}
      </div>

      {mode === "free" && (
        <div className="button-row-below">
          <button className="refresh-btn" onClick={() => fetchNewGame(false)}>Refresh</button>
        </div>
      )}

      <div className="inputs-row">
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="Enter a Film/Tv Title"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit(); // ✅ fixed typo
            }}
          />
          {suggestType === "title" && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((s, idx) => (
                <div key={idx} className="suggestion" onClick={() => handleSuggestionClick(s)}>
                  {s.image && <img src={s.image} alt={s.name} />}
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="input-wrapper">
          <input
            type="text"
            ref={actorInputRef} // ✅ auto-focus
            placeholder="Enter Actor Name"
            value={actorInput}
            onChange={(e) => handleInputChange(e, "actor")}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit(); // ✅ fixed typo
            }}
          />
          {suggestType === "actor" && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((s, idx) => (
                <div key={idx} className="suggestion" onClick={() => handleSuggestionClick(s)}>
                  {s.image && <img src={s.image} alt={s.name} />}
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="submit-btn" onClick={handleSubmit}>Submit</button>
        <button className="undo-btn" onClick={() => setChain(chain.slice(0, -2))}>Undo</button>
      </div>

      {isLoading && <p className="loading-message">Fetching credits…</p>}

      <div className="chain-container">
        {chain.map((item, idx) => (
          <React.Fragment key={idx}>
            <div className={`chain-item ${item.type}`}>
              <img src={item.image} alt={item.name} />
              <p>{item.name}</p>
            </div>
            {idx !== chain.length - 1 && <div className="arrow">→</div>}
          </React.Fragment>
        ))}
      </div>

      {gameOver && (
        <>
          {mode === "daily" && showModal && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>🎉 You did it!</h3>
                <p>Enter your name to be added to today’s leaderboard:</p>
                <input
                  type="text"
                  placeholder="Your name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
                <button onClick={handleNameSubmit}>Submit</button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="leaderboard">
        <h2>🏆 Daily Leaderboard</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Links</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, idx) => (
              <tr key={idx}>
                <td>{entry.name}</td>
                <td>{entry.links}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
