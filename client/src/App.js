import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [startActor, setStartActor] = useState(null);
  const [goalActor, setGoalActor] = useState(null);
  const [chain, setChain] = useState([]);
  const [titleInput, setTitleInput] = useState('');
  const [actorInput, setActorInput] = useState('');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isWin, setIsWin] = useState(false);

  useEffect(() => {
    const fetchActors = async () => {
      const res = await axios.get(`${BACKEND_URL}/get-random-actors`);
      setStartActor(res.data.start);
      setGoalActor(res.data.goal);
      setChain([{ name: res.data.start.name, image: res.data.start.image }]);
    };
    fetchActors();
  }, []);

  useEffect(() => {
    if (chain.length && chain[chain.length - 1].name === goalActor?.name) {
      setIsWin(true);
    }
  }, [chain, goalActor]);

  const handleSubmit = async () => {
    try {
      const actor = actorInput.trim();
      const title = titleInput.trim();
      const prevActor = chain[chain.length - 1].name;

      const res = await axios.post(`${BACKEND_URL}/validate-link`, {
        actor,
        title
      });

      if (res.data.valid) {
        const newChain = [
          ...chain,
          { name: title, image: res.data.poster || null },
          { name: actor, image: res.data.actor_image || null }
        ];
        setChain(newChain);
        setTitleInput('');
        setActorInput('');
        setSuggestions([]);
        setError('');
      } else {
        setError('❌ Invalid link');
      }
    } catch (err) {
      console.error(err);
      setError('Error connecting to backend');
    }
  };

  const handleRestart = () => window.location.reload();

  const handleAutoSuggest = async (type, value) => {
    setError('');
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await axios.get(`${BACKEND_URL}/suggest?query=${value}&type=${type}`);
      setSuggestions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuggestionClick = (name) => {
    if (actorInput) setActorInput(name);
    else setTitleInput(name);
    setSuggestions([]);
  };

  return (
    <div className="App">
      <h1>🎬 Welcome to ScreenLink</h1>

      {startActor && goalActor && (
        <div className="start-goal-container">
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

      <div className="chain-container">
        {chain.map((step, idx) => (
          <div key={idx} className="chain-item">
            {step.image && <img src={step.image} alt={step.name} />}
            <p>{step.name}</p>
          </div>
        ))}
      </div>

      <div className="input-container">
        <input
          type="text"
          placeholder="🎥 Movie/Show Title"
          value={titleInput}
          onChange={(e) => {
            setTitleInput(e.target.value);
            handleAutoSuggest('title', e.target.value);
          }}
        />
        <input
          type="text"
          placeholder="🧑 Actor Name"
          value={actorInput}
          onChange={(e) => {
            setActorInput(e.target.value);
            handleAutoSuggest('actor', e.target.value);
          }}
        />
        <button onClick={handleSubmit}>Submit</button>
      </div>

      {suggestions.length > 0 && (
        <div className="suggestion-box">
          {suggestions.map((s, i) => (
            <div key={i} onClick={() => handleSuggestionClick(s.name)}>
              {s.name}
            </div>
          ))}
        </div>
      )}

      {error && <p className="error">{error}</p>}
      {isWin && <p className="success">🏆 You reached the goal actor!</p>}

      <p className="steps">Steps: {Math.floor((chain.length - 1) / 2)}</p>
      <button className="restart-button" onClick={handleRestart}>🔁 Play Again</button>
    </div>
  );
}

export default App;

