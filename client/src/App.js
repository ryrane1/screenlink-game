import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import confetti from "canvas-confetti";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function App() {
  const [startActor, setStartActor] = useState(null);
  const [goalActor, setGoalActor] = useState(null);
  const [chain, setChain] = useState([]);
  const [actorInput, setActorInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestType, setSuggestType] = useState("actor");
  const [gameOver, setGameOver] = useState(false);
  const [stats, setStats] = useState({ currentStreak: 0, bestLinkCount: null });
  const [optimalPath, setOptimalPath] = useState([]);
  const chainContainerRef = useRef(null);

  const fetchNewGame = async (preserveStreak = true) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/new-game`);
      setStartActor(res.data.start);
      setGoalActor(res.data.goal);
      setChain([res.data.start]);
      setGameOver(false);
      setOptimalPath(res.data.optimalPath);
      if (!preserveStreak) {
        setStats((prev) => ({ ...prev, currentStreak: 0 }));
      }
    } catch (err) {
      console.error("Failed to fetch new game:", err);
    }
  };

  useEffect(() => {
    fetchNewGame();
  }, []);

  const handleInputChange = (value, type) => {
    if (type === "actor") setActorInput(value);
    else setTitleInput(value);

    setSuggestType(type);
    if (!value) {
      setSuggestions([]);
      return;
    }

    axios
      .get(`${BACKEND_URL}/suggest?type=${type}&query=${value}`)
      .then((res) => {
        setSuggestions(res.data);
      })
      .catch((err) => console.error("Suggestion error:", err));
  };

  const handleSelect = (s) => {
    if (suggestType === "actor") {
      setActorInput(s.name);
    } else {
      setTitleInput(s.name);
    }
    setSuggestions([]);
  };

  const handleSubmit = () => {
    if (!actorInput || !titleInput) return;

    axios
      .post(`${BACKEND_URL}/validate-link`, {
        actor: actorInput,
        title: titleInput,
        chain,
      })
      .then((res) => {
        const newChain = [...chain, res.data.movie, res.data.actor];
        setChain(newChain);
        setTitleInput("");
        setActorInput("");

        if (res.data.actor.id === goalActor.id) {
          confetti();
          setGameOver(true);
          const linkCount = Math.floor((newChain.length - 1) / 2);
          const better =
            stats.bestLinkCount === null || linkCount < stats.bestLinkCount;
          setStats((prev) => ({
            currentStreak: prev.currentStreak + 1,
            bestLinkCount: better ? linkCount : prev.bestLinkCount,
          }));
        }
      })
      .catch((err) => {
        console.error("Validation error:", err);
      });
  };

  const handleUndo = () => {
    if (chain.length >= 3) {
      setChain(chain.slice(0, -2));
    }
  };

  return (
    <div className="App">
      <h1>🎬 <span className="highlight">ScreenLink</span></h1>
      <p className="description">
        Connect the <strong>Start</strong> actor to the <strong>Goal</strong> actor by entering movie titles and actors they’ve worked with — one link at a 
time.
      </p>

      <div className="stats-panel">
        <p>🔥 Streak: {stats.currentStreak} | 🧠 Best Links: {stats.bestLinkCount ?? "—"}</p>
      </div>

      <div className="actor-pair">
        <div className="actor-card">
          {startActor && (
            <>
              <img src={startActor.image} alt={startActor.name} />
              <p><strong>Start:</strong> {startActor.name}</p>
            </>
          )}
        </div>
        <div className="actor-card">
          {goalActor && (
            <>
              <img src={goalActor.image} alt={goalActor.name} />
              <p><strong>Goal:</strong> {goalActor.name}</p>
            </>
          )}
        </div>
      </div>

      <div className="inputs-container">
        <div className="input-wrapper">
          <input
            value={titleInput}
            onChange={(e) => handleInputChange(e.target.value, "title")}
            placeholder="Enter a film/tv title"
          />
          {suggestType === "title" && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((s, i) => (
                <div key={i} className="suggestion" onClick={() => handleSelect(s)}>
                  <img src={s.image} alt={s.name} />
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="input-wrapper">
          <input
            value={actorInput}
            onChange={(e) => handleInputChange(e.target.value, "actor")}
            placeholder="Enter an actor"
          />
          {suggestType === "actor" && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((s, i) => (
                <div key={i} className="suggestion" onClick={() => handleSelect(s)}>
                  <img src={s.image} alt={s.name} />
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button onClick={handleSubmit}>Submit</button>
      <button onClick={handleUndo}>Undo</button>
      <button onClick={() => fetchNewGame(false)}>New Game</button>
    </div>
  );
}

export default App;

