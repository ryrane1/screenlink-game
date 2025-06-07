import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [startActor, setStartActor] = useState(null);
  const [goalActor, setGoalActor] = useState(null);
  const [chain, setChain] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");
  const chainEndRef = useRef(null);

  useEffect(() => {
    axios.get("/random").then((res) => {
      setStartActor(res.data.start);
      setGoalActor(res.data.goal);
      setChain([res.data.start]);
    });
  }, []);

  useEffect(() => {
    chainEndRef.current?.scrollIntoView({ behavior: "smooth", inline: "end" });
  }, [chain]);

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.length > 0) {
      axios
        .get(`/suggest?q=${encodeURIComponent(value)}`)
        .then((res) => setSuggestions(res.data))
        .catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.name);
    setSuggestions([]);
  };

  const handleSubmit = () => {
    if (inputValue.trim() === "") return;
    const last = chain[chain.length - 1];
    axios
      .post("/validate-link", {
        from: last.name,
        fromType: last.type,
        input: inputValue,
      })
      .then((res) => {
        const { valid, title, actor } = res.data;
        if (valid) {
          setChain([...chain, title, actor]);
          setInputValue("");
          setError("");
        } else {
          setError("Invalid link. Try again!");
        }
      });
  };

  const handleUndo = () => {
    if (chain.length > 1) {
      setChain(chain.slice(0, chain.length - 2));
    }
  };

  return (
    <div className="App">
      <h1>🎬 Actor Connection Game</h1>
      <div className="instructions">
        Connect <strong>{startActor?.name}</strong> to <strong>{goalActor?.name}</strong> by alternating actors and movies!
      </div>

      <div className="start-goal-container">
        <div className="actor-box">
          <img src={startActor?.image} alt={startActor?.name} />
          <div>{startActor?.name}</div>
        </div>
        <div className="arrow">🎯</div>
        <div className="actor-box">
          <img src={goalActor?.image} alt={goalActor?.name} />
          <div>{goalActor?.name}</div>
        </div>
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            placeholder="Enter next actor or movie"
          />
          {suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((s, index) => (
                <div
                  key={index}
                  className="suggestion"
                  onClick={() => handleSuggestionClick(s)}
                >
                  <img src={s.image} alt={s.name} />
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="controls">
          <button onClick={handleUndo}>↩️ Undo</button>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="chain-scroll-wrapper">
        <div className="chain-scroll">
          <div className="chain-container">
            {chain.map((item, index) => {
              if (!item || typeof item !== "object" || !item.name) return null;
              return (
                <React.Fragment key={index}>
                  <div
                    className={`chain-item ${item.type === "title" ? "title" : "actor"} ${
                      index === chain.length - 1 ? "latest" : ""
                    }`}
                  >
                    <img src={item.image} alt={item.name} />
                    <div>{item.name}</div>
                  </div>
                  {index < chain.length - 1 && <div className="arrow">➡️</div>}
                </React.Fragment>
              );
            })}
            <div ref={chainEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

