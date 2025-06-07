// App.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import Autosuggest from "react-autosuggest";
import "./App.css";

function App() {
  const [startActor, setStartActor] = useState(null);
  const [goalActor, setGoalActor] = useState(null);
  const [chain, setChain] = useState([]);
  const [inputActor, setInputActor] = useState("");
  const [inputTitle, setInputTitle] = useState("");
  const [actorSuggestions, setActorSuggestions] = useState([]);
  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [optimalPath, setOptimalPath] = useState([]);
  const [hasWon, setHasWon] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestLinks, setBestLinks] = useState(null);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    axios.get("/get-random-actors").then((res) => {
      setStartActor(res.data.start);
      setGoalActor(res.data.goal);
      setChain([{ ...res.data.start, type: "actor" }]);
      setUndoStack([]);
      setHasWon(false);
      setShowShare(false);
      fetchOptimalPath(res.data.start.id, res.data.goal.id);
    });
  };

  const fetchOptimalPath = (startId, goalId) => {
    axios
      .get(`/get-shortest-path?startId=${startId}&goalId=${goalId}`)
      .then((res) => {
        setOptimalPath(res.data.path);
      });
  };

  const fetchSuggestions = async (value, type) => {
    const res = await axios.get(`/autosuggest?type=${type}&query=${value}`);
    if (type === "actor") {
      setActorSuggestions(res.data);
    } else {
      setTitleSuggestions(res.data);
    }
  };

  const handleActorSelected = (_, { suggestion }) => {
    setInputActor("");
    const newChain = [...chain, { ...suggestion, type: "actor" }];
    setUndoStack([...undoStack, [...chain]]);
    setChain(newChain);
    if (suggestion.name === goalActor.name) {
      setHasWon(true);
      const stepCount = (newChain.length - 1) / 2;
      setStreak((s) => s + 1);
      if (bestLinks === null || stepCount < bestLinks) {
        setBestLinks(stepCount);
      }
    }
  };

  const handleTitleSelected = (_, { suggestion }) => {
    setInputTitle("");
    const newChain = [...chain, { ...suggestion, type: "title" }];
    setUndoStack([...undoStack, [...chain]]);
    setChain(newChain);
  };

  const handleSubmit = () => {
    if (inputActor) {
      const match = actorSuggestions.find(s => s.name.toLowerCase() === inputActor.toLowerCase());
      if (match) handleActorSelected(null, { suggestion: match });
      setInputActor("");
    } else if (inputTitle) {
      const match = titleSuggestions.find(s => s.name.toLowerCase() === inputTitle.toLowerCase());
      if (match) handleTitleSelected(null, { suggestion: match });
      setInputTitle("");
    }
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const prev = undoStack.pop();
      setChain(prev);
      setUndoStack([...undoStack]);
    }
  };

  const generateShareText = () => {
    const steps = Math.floor((chain.length - 1) / 2);
    let output = `🎬 I just connected ${startActor.name} to ${goalActor.name} in ${steps}️⃣ steps!\n\n`;
    for (let item of chain) {
      output += item.type === "actor" ? `🧍 ${item.name}\n` : `🎞️ ${item.name}\n`;
    }
    output += "\nThink you can beat my path? 🔗 screenlink.game";
    return output;
  };

  return (
    <div className="App">
      <h1>🎬 ScreenLink</h1>
      <p>
        Connect the <strong>Start</strong> actor to the <strong>Goal</strong>{" "}
        actor by entering movie titles and actors they’ve worked with — one link
        at a time.
      </p>
      <div className="score-panel">
        🔥 Streak: {streak} {bestLinks !== null && <>🏆 Best Links: {bestLinks}</>}
      </div>

      {startActor && goalActor && (
        <div className="actor-pair">
          <div className="actor-box">
            <img src={startActor.image} alt={startActor.name} />
            <p><strong>Start:</strong> {startActor.name}</p>
          </div>
          <div className="actor-box">
            <img src={goalActor.image} alt={goalActor.name} />
            <p><strong>Goal:</strong> {goalActor.name}</p>
          </div>
        </div>
      )}

      <div className="chain-scroll-wrapper">
        <div className="chain-container">
          {chain.map((item, idx) => (
            <React.Fragment key={idx}>
              <div
                className={`chain-item ${item.type} ${
                  idx === chain.length - 1 && item.name === goalActor.name ? "goal" : ""
                }`}
              >
                {item.image && <img src={item.image} alt={item.name} />}
                <div>{item.name}</div>
              </div>
              {idx !== chain.length - 1 && <span className="arrow">➡️</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {!hasWon && (
        <div className="inputs-container">
          <Autosuggest
            suggestions={titleSuggestions}
            onSuggestionsFetchRequested={({ value }) => fetchSuggestions(value, "title")}
            onSuggestionsClearRequested={() => setTitleSuggestions([])}
            getSuggestionValue={(s) => s.name}
            onSuggestionSelected={handleTitleSelected}
            renderSuggestion={(s) => (
              <div className="suggestion-item">
                {s.image && <img src={s.image} alt={s.name} />} {s.name}
              </div>
            )}
            inputProps={{
              placeholder: "Enter a film/tv title",
              value: inputTitle,
              onChange: (_, { newValue }) => setInputTitle(newValue),
            }}
          />
          <Autosuggest
            suggestions={actorSuggestions}
            onSuggestionsFetchRequested={({ value }) => fetchSuggestions(value, "actor")}
            onSuggestionsClearRequested={() => setActorSuggestions([])}
            getSuggestionValue={(s) => s.name}
            onSuggestionSelected={handleActorSelected}
            renderSuggestion={(s) => (
              <div className="suggestion-item">
                {s.image && <img src={s.image} alt={s.name} />} {s.name}
              </div>
            )}
            inputProps={{
              placeholder: "Enter an actor",
              value: inputActor,
              onChange: (_, { newValue }) => setInputActor(newValue),
            }}
          />
          <button className="submit-btn" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      )}

      <div className="game-controls">
        <button onClick={handleUndo}>Undo</button>
        <button onClick={startNewGame}>🔄 New Game</button>
      </div>

      {hasWon && (
        <>
          <h2>🔍 Optimal Path</h2>
          <div className="optimal-path">
            {optimalPath.map((item, idx) => (
              <React.Fragment key={idx}>
                <span className={`pill ${item.type}`}>{item.name}</span>
                {idx < optimalPath.length - 1 && <span className="arrow">➡️</span>}
              </React.Fragment>
            ))}
          </div>
          <h2>🎉 Thanks for playing!</h2>
          <button onClick={() => setShowShare(true)}>📤 Share</button>
        </>
      )}

      {showShare && (
        <div className="share-popup">
          <textarea
            readOnly
            value={generateShareText()}
            onClick={(e) => e.target.select()}
          />
          <button onClick={() => setShowShare(false)}>Close</button>
        </div>
      )}
    </div>
  );
}

export default App;

