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
  const chainContainerRef = useRef(null);

  useEffect(() => {
    const fetchActors = async () => {
      const res = await axios.get(`${BACKEND_URL}/get-random-actors`);
      setStartActor(res.data.start);
      setGoalActor(res.data.goal);
      setChain([{ ...res.data.start, type: "actor" }]);
    };
    fetchActors();
  }, []);

  useEffect(() => {
    if (
      chain.length > 0 &&
      goalActor &&
      chain[chain.length - 1].name === goalActor.name
    ) {
      setGameOver(true);
      confetti();
      setTimeout(() => setGameOver(false), 5000);
    }
  }, [chain, goalActor]);

  useEffect(() => {
    if (chainContainerRef.current) {
      chainContainerRef.current.scrollLeft = chainContainerRef.current.scrollWidth;
    }
  }, [chain]);

  const handleInputChange = async (value, type) => {
    if (type === "title") setTitleInput(value);
    else setActorInput(value);

    setSuggestType(type);
    if (!value) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await axios.get(`${BACKEND_URL}/suggest?type=${type}&query=${value}`);
      setSuggestions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelect = (selected) => {
    if (suggestType === "title") {
      setTitleInput(selected.name);
    } else {
      setActorInput(selected.name);
    }
    setSuggestions([]);
  };

  const handleSubmit = async () => {
    if (!titleInput || !actorInput) return;
    try {
      const res = await axios.post(`${BACKEND_URL}/validate-link`, {
        actor: chain[chain.length - 1].name,
        title: titleInput,
        next_actor: actorInput,
      });

      if (res.data.valid) {
        const titleItem = { name: titleInput, type: "title", image: res.data.poster };
        const actorItem = {
          name: actorInput,
          type: "actor",
          image: res.data.actor_image,
        };
        setChain([...chain, titleItem, actorItem]);
        setTitleInput("");
        setActorInput("");
        setSuggestions([]);
      } else {
        alert("Invalid link.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUndo = () => {
    if (chain.length > 2) {
      setChain(chain.slice(0, chain.length - 2));
    }
  };

  const resetGame = () => window.location.reload();

  return (
    <div className="App">
      <h1>🎬 <span className="highlight">ScreenLink</span></h1>
      <p className="description">
        Connect the <strong>Start</strong> actor to the <strong>Goal</strong> actor by entering movie titles and actors they’ve worked with — one link 
at a time.
      </p>

      <div className="actor-pair">
        <div className="actor-card">
          <img src={startActor?.image} alt={startActor?.name} />
          <p><strong>Start:</strong> {startActor?.name}</p>
        </div>
        <div className="actor-card">
          <img src={goalActor?.image} alt={goalActor?.name} />
          <p><strong>Goal:</strong> {goalActor?.name}</p>
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

        <button onClick={handleSubmit} className="submit-btn">Submit</button>
      </div>

      <button onClick={handleUndo} className="undo-btn">Undo</button>

      <div className="chain-scroll-wrapper">
        <div className="chain-container" ref={chainContainerRef}>
          {chain.map((entry, i) => (
            <React.Fragment key={`${entry.name}-${i}`}>
              <div className={`chain-item ${entry.type} ${i === chain.length - 1 ? "latest" : ""} ${entry.name === goalActor?.name ? "goal" : ""}`}>
                <img src={entry.image} alt={entry.name} />
                <div>{entry.name}</div>
              </div>
              {i < chain.length - 1 && <div className="arrow">➡️</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {gameOver && (
        <div className="end-credits">
          <h2>🎉 Thanks for playing!</h2>
          <button onClick={resetGame}>Play Again</button>
        </div>
      )}
    </div>
  );
}

export default App;

