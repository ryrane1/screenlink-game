import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [startActor, setStartActor] = useState(null);
  const [goalActor, setGoalActor] = useState(null);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [chain, setChain] = useState([]);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    axios.get("/random").then((res) => {
      setStartActor(res.data.start);
      setGoalActor(res.data.goal);
      setChain([res.data.start]);
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth", inline: "end" });
  }, [chain]);

  const handleChange = (e) => {
    setInput(e.target.value);
    if (e.target.value.length > 0) {
      axios
        .get(`/suggest?q=${e.target.value}`)
        .then((res) => {
          setSuggestions(res.data);
          setShowSuggestions(true);
        });
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelect = (item) => {
    setChain([...chain, item]);
    setInput("");
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSubmit = () => {
    if (!input.trim()) return;

    axios
      .post("/validate-link", {
        chain,
        input,
        goal: goalActor,
      })
      .then((res) => {
        if (res.data.valid) {
          setChain([...chain, res.data.title, res.data.actor]);
          setInput("");
          setSuggestions([]);
          setShowSuggestions(false);
          setError("");
        } else {
          setError("Invalid connection. Try again.");
        }
      });
  };

  const handleUndo = () => {
    if (chain.length > 1) {
      setChain(chain.slice(0, -2));
      setError("");
    }
  };

  const handleHint = () => {
    const current = chain[chain.length - 1];
    axios
      .post("/hint", { current, goal: goalActor })
      .then((res) => {
        const { title, actor } = res.data;
        setChain([...chain, title, actor]);
      });
  };

  return (
    <div className="App">
      <h1>🎬 Actor Link Game</h1>
      <div className="instructions">
        Connect the <strong>start actor</strong> to the <strong>goal actor</strong> through movies and co-stars.
      </div>

      {startActor && goalActor && (
        <div className="start-goal-container">
          <div className="actor-box">
            <img src={startActor.image} alt={startActor.name} />
            <div><strong>Start:</strong> {startActor.name}</div>
          </div>
          <div className="actor-box">
            <img src={goalActor.image} alt={goalActor.name} />
            <div><strong>Goal:</strong> {goalActor.name}</div>
          </div>
        </div>
      )}

      <div className="input-container">
        <div className="input-wrapper">
          <input
            type="text"
            value={input}
            onChange={handleChange}
            placeholder="Type actor or movie"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((sug, index) => (
                <div key={index} className="suggestion" onClick={() => handleSelect(sug)}>
                  <img src={sug.image} alt={sug.name} />
                  <span>{sug.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="controls">
        <button onClick={handleUndo}>↩️ Undo</button>
        <button onClick={handleHint}>💡 Hint</button>
        <button onClick={handleSubmit}>Submit</button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="chain-scroll-wrapper" ref={scrollRef}>
        <div className="chain-scroll">
          {chain.map((item, index) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;

