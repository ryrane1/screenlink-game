

// App.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import confetti from "canvas-confetti";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function App() {
  const [mode, setMode] = useState("daily");
  const [startActor, setStartActor] = useState(null);
  const [goalActor, setGoalActor] = useState(null);
  const [chain, setChain] = useState([]);
  const [actorInput, setActorInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestType, setSuggestType] = useState("actor");
  const [gameOver, setGameOver] = useState(false);
  const [stats, setStats] = useState({ currentStreak: 0, bestLinkCount: null });
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerName, setPlayerName] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const chainContainerRef = useRef(null);

  useEffect(() => {
    fetchNewGame();
  }, [mode]);

  useEffect(() => {
    if (mode === "daily") {
      axios.get(`${BACKEND_URL}/get-daily-leaderboard`).then((res) => {
        setLeaderboard(res.data);
      });
    }
  }, [mode]);

  const fetchNewGame = async (preserveStreak = true) => {
    const endpoint = mode === "daily" ? "get-daily-actors" : "get-random-actors";
    const res = await axios.get(`${BACKEND_URL}/${endpoint}`);
    setStartActor(res.data.start);
    setGoalActor(res.data.goal);
    setChain([res.data.start]);
    setActorInput("");
    setTitleInput("");
    setSuggestions([]);
    setGameOver(false);
    setShowNamePrompt(false);
    if (!preserveStreak) {
      setStats({ ...stats, currentStreak: 0 });
    }
  };

  const handleSubmit = async () => {
    if (!actorInput || !titleInput) return;
    const currentActor = chain[chain.length - 1];
    try {
      const res = await axios.post(`${BACKEND_URL}/validate-link`, {
        actor: currentActor.name,
        title: titleInput,
        next_actor: actorInput,
      });

      if (res.data.valid) {
        const newActor = {
          name: actorInput,
          image: res.data.actor_image || null,
        };
        const newTitle = {
          name: titleInput,
          image: res.data.poster || null,
        };
        const newChain = [...chain, newTitle, newActor];
        setChain(newChain);
        setActorInput("");
        setTitleInput("");
        setSuggestions([]);

        if (newActor.name.toLowerCase() === goalActor.name.toLowerCase()) {
          setGameOver(true);
          confetti();
          const newStreak = stats.currentStreak + 1;
          const best =
            stats.bestLinkCount === null
              ? Math.floor((newChain.length - 1) / 2)
              : Math.min(stats.bestLinkCount, Math.floor((newChain.length - 1) / 2));
          setStats({ currentStreak: newStreak, bestLinkCount: best });

          if (mode === "daily") {
            setShowNamePrompt(true);
          }
        }
      } else {
        alert("Invalid link. Try again.");
      }
    } catch (err) {
      console.error("Validation error", err);
    }
  };

  const submitNameToLeaderboard = async () => {
    if (playerName.trim()) {
      await axios.post(`${BACKEND_URL}/submit-daily-score`, {
        player: playerName,
        steps: Math.floor((chain.length - 1) / 2),
        duration: 0,
      });
      confetti();
      setShowNamePrompt(false);
      const res = await axios.get(`${BACKEND_URL}/get-daily-leaderboard`);
      setLeaderboard(res.data);
    }
  };

  const handleUndo = () => {
    if (chain.length >= 3) {
      setChain(chain.slice(0, -2));
    }
  };

  const handleInputChange = async (e, type) => {
    const value = e.target.value;
    if (type === "actor") setActorInput(value);
    else setTitleInput(value);
    setSuggestType(type);
    if (value.length < 2) return;
    const res = await axios.get(`${BACKEND_URL}/suggest`, {
      params: { query: value, type },
    });
    setSuggestions(res.data);
  };

  const handleSuggestionClick = (name) => {
    if (suggestType === "actor") setActorInput(name);
    else setTitleInput(name);
    setSuggestions([]);
  };

  return (
    <div className="App">
      <h1>🎬 <span className="highlight">ScreenLink</span></h1>
      <p className="description">
        Connect the <strong>Start</strong> actor to the <strong>Goal</strong> actor by entering movie titles and actors they’ve worked with — one link at a time.
      </p>
      <div className="mode-toggle">
        <button className={mode === "daily" ? "active" : ""} onClick={() => setMode("daily")}>Daily</button>
        <button className={mode === "free" ? "active" : ""} onClick={() => setMode("free")}>Free Play</button>
      </div>
      <div className="stats-panel">
        🔥 Streak: {stats.currentStreak} | 🧠 Best Links: {stats.bestLinkCount ?? "—"}
      </div>

      {startActor && goalActor && (
        <div className="actor-pair">
          <div className="actor-card">
            <img src={startActor.image} alt={startActor.name} />
            <p><strong>Start:</strong> {startActor.name}</p>
          </div>
          <div className="actor-card">
            <img src={goalActor.image} alt={goalActor.name} />
            <p><strong>Goal:</strong> {goalActor.name}</p>
          </div>
        </div>
      )}

      <div className="inputs-container">
        <div className="input-wrapper" style={{ flex: "none", minWidth: "250px" }}>
          <input type="text" value={titleInput} placeholder="Enter a film/tv title" onChange={(e) => handleInputChange(e, "title")} />
          {suggestType === "title" && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((s, idx) => (
                <div key={idx} className="suggestion" onClick={() => handleSuggestionClick(s.name)}>
                  {s.image && <img src={s.image} alt={s.name} />}
                  {s.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="input-wrapper" style={{ flex: "none", minWidth: "250px" }}>
          <input type="text" value={actorInput} placeholder="Enter an actor" onChange={(e) => handleInputChange(e, "actor")} />
          {suggestType === "actor" && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((s, idx) => (
                <div key={idx} className="suggestion" onClick={() => handleSuggestionClick(s.name)}>
                  {s.image && <img src={s.image} alt={s.name} />}
                  {s.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="input-wrapper" style={{ flex: "none" }}>
          <button className="submit-btn" onClick={handleSubmit}>Submit</button>
        </div>
      </div>

      {showNamePrompt && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>🎉 You completed today's Daily Link!</h3>
            <p>Enter your name to be featured on the leaderboard:</p>
            <input
              type="text"
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <div className="modal-buttons">
              <button className="submit-btn" onClick={submitNameToLeaderboard}>Submit</button>
              <button className="undo-btn" onClick={() => setShowNamePrompt(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="chain-scroll-wrapper">
        <div className="chain-container">
          {chain.map((item, idx) => (
            <React.Fragment key={idx}>
              <div className={`chain-item ${item.name === goalActor?.name ? "goal" : ""} ${idx % 2 === 1 ? "movie" : ""}`}>
                {item.image && <img src={item.image} alt={item.name} />}
                <div>{item.name}</div>
              </div>
              {idx < chain.length - 1 && <span className="arrow">➜</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="button-row-below">
        <button className="undo-btn" onClick={handleUndo}>Undo</button>
        {mode === "free" && <button className="undo-btn" onClick={() => fetchNewGame(false)}>New Game</button>}
      </div>

      {mode === "daily" && (
        <div className="leaderboard">
          <h3>🏆 Daily Leaderboard</h3>
          {leaderboard.length === 0 ? (
            <p>Loading leaderboard...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Links</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{entry.player}</td>
                    <td>{entry.steps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default App;

