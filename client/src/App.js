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
  const [showModal, setShowModal] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState({ currentStreak: 0, bestLinkCount: null });
  const chainContainerRef = useRef(null);

  useEffect(() => {
    fetchNewGame();
  }, [mode]);

  useEffect(() => {
    if (gameOver && mode === "daily") {
      setTimeout(() => setShowModal(true), 300);
    }
  }, [gameOver]);

  useEffect(() => {
    if (mode === "daily") fetchLeaderboard();
  }, [mode]);

  const fetchNewGame = async (preserveStreak = true) => {
    const route = mode === "daily" ? "/get-daily-actors" : "/random-start-goal";
    try {
      const res = await axios.get(`${BACKEND_URL}${route}`);
      setStartActor(res.data.start);
      setGoalActor(res.data.goal);
      setChain([res.data.start]);
      setActorInput("");
      setTitleInput("");
      setGameOver(false);
      setShowModal(false);
      if (!preserveStreak) setStats((s) => ({ ...s, currentStreak: 0 }));
    } catch (err) {
      console.error("Error fetching new game:", err);
    }
  };

  const handleSubmit = async () => {
    if (!titleInput || !actorInput || gameOver) return;
    try {
      const res = await axios.post(`${BACKEND_URL}/validate-link`, {
        currentActor: chain[chain.length - 1],
        movieTitle: titleInput,
        nextActor: actorInput,
      });
      if (res.data.valid) {
        const newChain = [...chain, res.data.movie, res.data.nextActor];
        setChain(newChain);
        setActorInput("");
        setTitleInput("");

        if (res.data.nextActor.name === goalActor.name) {
          setGameOver(true);
          confetti();
          setStats((s) => ({
            currentStreak: s.currentStreak + 1,
            bestLinkCount:
              s.bestLinkCount === null || newChain.length < s.bestLinkCount
                ? newChain.length
                : s.bestLinkCount,
          }));
        }
      }
    } catch (err) {
      console.error("Error validating link:", err);
    }
  };

  const handleUndo = () => {
    if (chain.length > 1 && !gameOver) {
      setChain(chain.slice(0, chain.length - 2));
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/daily-leaderboard`);
      setLeaderboard(res.data.slice(0, 3));
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  };

  const submitNameToLeaderboard = async () => {
    try {
      await axios.post(`${BACKEND_URL}/submit-daily-score`, {
        name: playerName,
        steps: Math.floor((chain.length - 1) / 2),
      });
      fetchLeaderboard();
      setShowModal(false);
    } catch (err) {
      console.error("Error submitting name:", err);
    }
  };

  const fetchSuggestions = async (query, type) => {
    if (!query) return setSuggestions([]);
    try {
      const res = await axios.get(`${BACKEND_URL}/suggest?type=${type}&query=${query}`);
      setSuggestions(res.data);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  return (
    <div className="App">
      <h1>🎬 <span className="highlight">ScreenLink</span></h1>
      <p className="description">
        Connect the <strong>Start</strong> actor to the <strong>Goal</strong> actor by entering movie titles and actors they’ve worked with — one link at a time.
      </p>

      <div className="mode-toggle">
        <button className={mode === "daily" ? "active" : ""} onClick={() => setMode("daily")}>📅 Daily</button>
        <button className={mode === "free" ? "active" : ""} onClick={() => setMode("free")}>🎲 Free Play</button>
      </div>

      <div className="stats-panel">
        🔥 Streak: {stats.currentStreak} | 🧠 Best Links: {stats.bestLinkCount ?? "—"}
      </div>

      <div className="actor-pair">
        {startActor && (
          <div className="actor-card">
            <img src={startActor.image} alt={startActor.name} />
            <strong>Start:</strong> {startActor.name}
          </div>
        )}
        {goalActor && (
          <div className="actor-card">
            <img src={goalActor.image} alt={goalActor.name} />
            <strong>Goal:</strong> {goalActor.name}
          </div>
        )}
      </div>

      <div className="inputs-container">
        <input
          value={titleInput}
          onChange={(e) => {
            setTitleInput(e.target.value);
            setSuggestType("movie");
            fetchSuggestions(e.target.value, "movie");
          }}
          placeholder="Enter a film/tv title"
        />
        <input
          value={actorInput}
          onChange={(e) => {
            setActorInput(e.target.value);
            setSuggestType("actor");
            fetchSuggestions(e.target.value, "actor");
          }}
          placeholder="Enter an actor"
        />
      </div>

      <div className="button-group">
        <button className="submit-btn" onClick={handleSubmit}>Submit</button>
        <button className="undo-btn" onClick={handleUndo}>Undo</button>
        {mode === "free" && (
          <button className="undo-btn" onClick={() => fetchNewGame(false)}>New Game</button>
        )}
      </div>

      <div className="chain-scroll-wrapper">
        <div className="chain-container" ref={chainContainerRef}>
          {chain.map((item, index) => (
            <React.Fragment key={index}>
              <div
                className={`chain-item ${item.type === "movie" ? "movie" : ""} ${index === chain.length - 1 && gameOver ? "goal" : ""}`}
              >
                <img src={item.image} alt={item.name} />
                {item.name}
              </div>
              {index < chain.length - 1 && <div className="arrow">➜</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {mode === "daily" && (
        <div className="leaderboard">
          <h3>🏆 Daily Leaderboard</h3>
          <table>
            <thead>
              <tr>
                <th>Rank</th><th>Player</th><th>Links</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length > 0 ? leaderboard.map((entry, i) => (
                <tr key={i}>
                  <td>{i + 1}</td><td>{entry.name}</td><td>{entry.steps}</td>
                </tr>
              )) : (
                <tr><td colSpan="3">Loading leaderboard...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>🎉 You completed today’s Daily Link!</h3>
            <p>Enter your name to be featured on the leaderboard:</p>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
            />
            <div className="modal-buttons">
              <button onClick={submitNameToLeaderboard} className="submit-btn">Submit</button>
              <button onClick={() => setShowModal(false)} className="undo-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

