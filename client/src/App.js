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
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [copied, setCopied] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const fetchNewGame = async () => {
    const res = await axios.get(
      `${BACKEND_URL}/${mode === "daily" ? "get-daily-actors" : "get-random-actors"}`
    );
    setStartActor(res.data.start);
    setGoalActor(res.data.goal);
    setChain([res.data.start]);
    setGameOver(false);
    setShowNamePrompt(false);
    setActorInput("");
    setTitleInput("");
    setCopied(false);
    if (mode === "daily") {
      const lbRes = await axios.get(`${BACKEND_URL}/get-daily-leaderboard`);
      setLeaderboard(lbRes.data);
    }
  };

  useEffect(() => {
    fetchNewGame();
  }, [mode]);

  const handleInputChange = (e, type) => {
    const value = e.target.value;
    if (type === "actor") setActorInput(value);
    else setTitleInput(value);
    setSuggestType(type);
    if (value.length > 1) {
      axios
        .get(`${BACKEND_URL}/suggest?query=${value}&type=${type}`)
        .then((res) => setSuggestions(res.data));
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (name) => {
    if (suggestType === "actor") setActorInput(name);
    else setTitleInput(name);
    setSuggestions([]);
  };

  const handleSubmit = async () => {
    const res = await axios.post(`${BACKEND_URL}/validate-link`, {
      actor: chain[chain.length - 1].name,
      title: titleInput,
      next_actor: actorInput,
    });

    if (res.data.valid) {
      const newChain = [...chain];
      newChain.push({ name: titleInput, type: "title", image: res.data.poster });
      newChain.push({ name: actorInput, type: "actor", image: res.data.actor_image });
      setChain(newChain);
      setActorInput("");
      setTitleInput("");

      if (actorInput === goalActor.name) {
        setGameOver(true);
        confetti();
        if (mode === "daily") setShowNamePrompt(true);
      }
    } else {
      alert("Invalid link. Try again.");
    }
  };

  const handleUndo = () => {
    if (chain.length >= 3) {
      setChain(chain.slice(0, chain.length - 2));
    }
  };

  const handleNameSubmit = () => {
    const steps = Math.floor((chain.length - 1) / 2);
    axios.post(`${BACKEND_URL}/submit-daily-score`, {
      name: playerName,
      steps,
      duration: 0,
    }).then(() => {
      setShowNamePrompt(false);
      fetchNewGame();
    });
  };

  const handleShare = () => {
    const steps = Math.floor((chain.length - 1) / 2);
    const link = "https://screenlink-game-rohan-ranes-projects.vercel.app/";
    let message = "";

    if (mode === "daily") {
      message = `🧩 I completed today's Daily Link in ${steps}️⃣ steps!\nHow many can you do?\n\n${link}`;
    } else {
      const start = chain[0]?.name || "";
      const end = chain[chain.length - 1]?.name || "";
      const movie = chain.length >= 3 ? chain[1]?.name || "" : "";
      message =
        `🎬 I just connected ${start} to ${end} in ${steps}️⃣ steps!\n\n` +
        `🎭 ${start}\n` +
        `🍿 ${movie}\n` +
        `🎭 ${end}\n\n` +
        `Try playing now!\n${link}`;
    }

    navigator.clipboard.writeText(message)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(() => alert("Failed to copy message."));
  };

  return (
    <div className="App">
      <h1>🎥 ScreenLink</h1>
      <p className="description">
        Connect the <span className="highlight">Start</span> actor to the <span className="highlight">Goal</span> actor by entering movie titles and actors they’ve worked with — 
one link at a time.
      </p>

      <div className="mode-toggle">
        <button onClick={() => setMode("daily")} className={mode === "daily" ? "active" : ""}>
          🔁 Daily
        </button>
        <button onClick={() => setMode("free")} className={mode === "free" ? "active" : ""}>
          🎲 Free Play
        </button>
      </div>

      <div className="actor-pair">
        <div className="actor-card">
          <img src={startActor?.image} alt={startActor?.name} />
          <strong>🎬 {startActor?.name}</strong>
        </div>
        <div className="actor-card">
          <img src={goalActor?.image} alt={goalActor?.name} />
          <strong>🎯 {goalActor?.name}</strong>
        </div>
      </div>

      <div className="inputs-container">
        <div className="input-wrapper">
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

        <div className="input-wrapper">
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

        <button className="submit-btn" onClick={handleSubmit}>Submit</button>
      </div>

      <div className="button-row-below">
        <button className="undo-btn" onClick={handleUndo}>Undo</button>
        <button className="new-game-btn" onClick={fetchNewGame}>New Game</button>
      </div>

      <div className="chain-container">
        {chain.map((item, idx) => (
          <React.Fragment key={idx}>
            <div className={`chain-item ${item.type === "title" ? "movie" : ""} ${item.name === goalActor?.name ? "goal" : ""}`}>
              {item.image && <img src={item.image} alt={item.name} />}
              <div>{item.name}</div>
            </div>
            {idx < chain.length - 1 && <div className="arrow">→</div>}
          </React.Fragment>
        ))}
      </div>

      {gameOver && !showNamePrompt && (
        <div className="share-row">
          <div style={{ textAlign: "center" }}>
            <button className="share-btn" onClick={handleShare}>Share</button>
            {copied && <div className="copied-msg">✅ Copied to clipboard!</div>}
            {mode === "free" && (
              <div style={{ marginTop: "10px" }}>
                <button className="new-game-btn" onClick={fetchNewGame}>🔁 Play Again</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showNamePrompt && (
        <div className="name-prompt">
          <p>You won! Enter your name for the leaderboard:</p>
          <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
          <button onClick={handleNameSubmit}>Submit</button>
        </div>
      )}

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

