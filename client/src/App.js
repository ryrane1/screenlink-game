import React, { useState, useEffect } from "react";
import axios from "axios";
import Autosuggest from "react-autosuggest";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const App = () => {
  const [start, setStart] = useState(null);
  const [goal, setGoal] = useState(null);
  const [chain, setChain] = useState([]);
  const [steps, setSteps] = useState(0);
  const [actor, setActor] = useState("");
  const [title, setTitle] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [type, setType] = useState("actor");
  const [statusMessage, setStatusMessage] = useState("");

  const fetchNewGame = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/get-random-actors`);
      setStart(res.data.start);
      setGoal(res.data.goal);
      setChain([{ type: "actor", name: res.data.start.name, image: res.data.start.image }]);
      setSteps(0);
      setActor("");
      setTitle("");
      setStatusMessage("");
    } catch (err) {
      console.error("Failed to load actors.", err);
      setStatusMessage("Failed to load actors.");
    }
  };

  useEffect(() => {
    fetchNewGame();
  }, []);

  const loadSuggestions = async (value, type) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/suggest`, {
        params: { query: value, type }
      });
      setSuggestions(res.data);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  const onSuggestionsFetchRequested = ({ value }) => loadSuggestions(value, type);
  const onSuggestionsClearRequested = () => setSuggestions([]);

  const getSuggestionValue = suggestion => suggestion;
  const renderSuggestion = suggestion => <div>{suggestion}</div>;

  const validateLink = async () => {
    if (!actor || !title) return;
    try {
      const res = await axios.post(`${BACKEND_URL}/validate-link`, { actor, title });
      if (res.data.valid) {
        setChain([
          ...chain,
          { type: "title", name: title, image: `https://image.tmdb.org/t/p/w185${res.data.title_image || 
""}` },
          { type: "actor", name: actor, image: `https://image.tmdb.org/t/p/w185${res.data.actor_image || 
""}` }
        ]);
        setSteps(steps + 1);
        setActor("");
        setTitle("");
        setStatusMessage("✅ Valid connection. Keep going!");
      } else {
        setStatusMessage("❌ Invalid connection.");
      }
    } catch (err) {
      setStatusMessage("⚠️ Error validating. Try again.");
      console.error(err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    validateLink();
  };

  return (
    <div className="app">
      <h1>🎬 Connect from {start?.name || "..."} to {goal?.name || "..."}</h1>
      <div className="actor-images">
        {start && (
          <div>
            <img src={start.image} alt={start.name} />
            <p>{start.name}</p>
          </div>
        )}
        {goal && (
          <div>
            <img src={goal.image} alt={goal.name} />
            <p>{goal.name}</p>
          </div>
        )}
      </div>

      <p><strong>Steps:</strong> {steps}</p>
      <form onSubmit={handleSubmit} className="input-form">
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={onSuggestionsFetchRequested}
          onSuggestionsClearRequested={onSuggestionsClearRequested}
          getSuggestionValue={getSuggestionValue}
          renderSuggestion={renderSuggestion}
          inputProps={{
            placeholder: "🎬 Movie/Show Title",
            value: title,
            onChange: (_, { newValue }) => {
              setTitle(newValue);
              setType("title");
            }
          }}
        />
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={onSuggestionsFetchRequested}
          onSuggestionsClearRequested={onSuggestionsClearRequested}
          getSuggestionValue={getSuggestionValue}
          renderSuggestion={renderSuggestion}
          inputProps={{
            placeholder: "👤 Next Actor",
            value: actor,
            onChange: (_, { newValue }) => {
              setActor(newValue);
              setType("actor");
            }
          }}
        />
        <button type="submit">Submit</button>
      </form>

      <p className={statusMessage.includes("✅") ? "valid" : "invalid"}>{statusMessage}</p>

      <h2>Current Chain:</h2>
      <div className="chain">
        {chain.map((item, idx) => (
          <div key={idx} className="chain-item">
            {item.image && <img src={item.image} alt={item.name} />}
            <p>{item.name} →</p>
          </div>
        ))}
      </div>
      <button onClick={fetchNewGame}>🔄 Play Again</button>
    </div>
  );
};

export default App;

