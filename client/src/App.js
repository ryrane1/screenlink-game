import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import Autosuggest from "react-autosuggest";

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
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [streak, setStreak] = useState(0);
  const [bestLinks, setBestLinks] = useState(null);
  const [gameMode, setGameMode] = useState("free");

  useEffect(() => {
    if (gameMode === "daily") {
      axios.get("/get-daily-actors").then((res) => {
        setStartActor(res.data.start);
        setGoalActor(res.data.goal);
        setChain([{ ...res.data.start, type: "actor" }]);
        setUndoStack([]);
        setHasWon(false);
        setOptimalPath([]);
        fetchOptimalPath(res.data.start.id, res.data.goal.id);
      });
    } else {
      axios.get("/get-random-actors").then((res) => {
        setStartActor(res.data.start);
        setGoalActor(res.data.goal);
        setChain([{ ...res.data.start, type: "actor" }]);
        setUndoStack([]);
        setHasWon(false);
        setOptimalPath([]);
        fetchOptimalPath(res.data.start.id, res.data.goal.id);
      });
    }
  }, [gameMode]);

  const fetchOptimalPath = (startId, goalId) => {
    axios.get(`/get-shortest-path?startId=${startId}&goalId=${goalId}`).then((res) => {
      setOptimalPath(res.data.path);
    });
  };

  const handleNewGame = () => {
    if (gameMode === "daily") return;
    setStreak(0);
    setBestLinks(null);
    setGameMode("free");
  };

  const handleModeChange = (mode) => {
    setGameMode(mode);
    setStreak(0);
    setBestLinks(null);
  };

  return (
    <div className="App">
      <h1>🎬 ScreenLink</h1>
      <p>
        Connect the Start actor to the Goal actor by entering movie titles and
        actors they’ve worked with — one link at a time.
      </p>

      <div className="tabs">
        <button onClick={() => handleModeChange("daily")} className={gameMode === "daily" ? "active-tab" : ""}>Daily Game</button>
        <button onClick={() => handleModeChange("free")} className={gameMode === "free" ? "active-tab" : ""}>Free Play</button>
      </div>

      {startActor && goalActor && (
        <div className="actor-pair">
          <div className="actor-box">
            <img src={startActor.image} alt={startActor.name} />
            <p>🎬 Start: {startActor.name}</p>
          </div>
          <div className="actor-box">
            <img src={goalActor.image} alt={goalActor.name} />
            <p>🎯 Goal: {goalActor.name}</p>
          </div>
        </div>
      )}

      {startActor && goalActor && (
        <>
          <div className="inputs-container">
            <div className="input-wrapper">
              <Autosuggest
                suggestions={actorSuggestions}
                onSuggestionsFetchRequested={({ value }) => fetchSuggestions(value, "actor")}
                onSuggestionsClearRequested={() => setActorSuggestions([])}
                getSuggestionValue={(suggestion) => suggestion.name}
                onSuggestionSelected={handleActorSelected}
                renderSuggestion={renderSuggestion}
                inputProps={{
                  placeholder: "Enter actor name",
                  value: inputActor,
                  onChange: (_, { newValue }) => setInputActor(newValue),
                }}
              />
            </div>
            <div className="input-wrapper">
              <Autosuggest
                suggestions={titleSuggestions}
                onSuggestionsFetchRequested={({ value }) => fetchSuggestions(value, "title")}
                onSuggestionsClearRequested={() => setTitleSuggestions([])}
                getSuggestionValue={(suggestion) => suggestion.name}
                onSuggestionSelected={handleTitleSelected}
                renderSuggestion={renderSuggestion}
                inputProps={{
                  placeholder: "Enter movie/TV title",
                  value: inputTitle,
                  onChange: (_, { newValue }) => setInputTitle(newValue),
                }}
              />
            </div>
            <button className="submit-btn" onClick={handleSubmit}>Submit</button>
          </div>

          <div className="chain-scroll-wrapper">
            <div className="chain-container">
              {chain.map((item, idx) => (
                <React.Fragment key={idx}>
                  <div
                    className={`chain-item ${item.type} ${
                      idx === chain.length - 1 && item.name === goalActor?.name ? "goal" : ""
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
        </>
      )}

      {gameMode === "free" && (
        <button className="new-game-button" onClick={handleNewGame}>🔄 New Game</button>
      )}
    </div>
  );
}

export default App;

