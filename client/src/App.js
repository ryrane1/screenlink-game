import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [startActor, setStartActor] = useState(null);
  const [goalActor, setGoalActor] = useState(null);
  const [chain, setChain] = useState([]);
  const [titleInput, setTitleInput] = useState('');
  const [actorInput, setActorInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchActors = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/get-random-actors`);
        setStartActor(res.data.start);
        setGoalActor(res.data.goal);
        setChain([{ name: res.data.start.name, image: res.data.start.image }]);
      } catch (err) {
        console.error(err);
        setError('Failed to load actors.');
      }
    };

    fetchActors();
  }, []);

  const handleSubmit = async () => {
    try {
      const actor = actorInput.trim();
      const title = titleInput.trim();
      const res = await axios.post(`${BACKEND_URL}/validate-link`, {
        actor: chain[chain.length - 1].name,
        title,
        next_actor: actor,
      });

      if (res.data.valid) {
        const poster = res.data.poster || '';
        const actorImage = res.data.actor_image || '';

        setChain([
          ...chain,
          { name: title, image: poster },
          { name: actor, image: actorImage },
        ]);
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

  const handleRestart = () => {
    window.location.reload();
  };

  const handleSuggest = async (query, type) => {
    try {
      if (!query) return setSuggestions([]);
      const res = await axios.get(`${BACKEND_URL}/suggest?query=${query}&type=${type}`);
      setSuggestions(res.data);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  return (
    <div className="App">
      <h1>🎬 Welcome to ScreenLink</h1>

      {startActor && goalActor && (
        <div className="start-goal-container">
          <div className="start-box">
            <img src={startActor.image} alt={startActor.name} />
            <strong>Start:</strong> {startActor.name}
          </div>
          <div className="goal-box">
            <img src={goalActor.image} alt={goalActor.name} />
            <strong>Goal:</strong> {goalActor.name}
          </div>
        </div>
      )}

      <div className="chain-container">
        {chain.map((entry, i) => (
          <div key={`${entry.name}-${i}`} className="chain-entry">
            {entry.image && <img src={entry.image} alt={entry.name} />}
            <div>{entry.name}</div>
          </div>
        ))}
      </div>

      <div className="input-row">
        <div className="input-with-suggestions">
          <input
            value={titleInput}
            onChange={(e) => {
              setTitleInput(e.target.value);
              handleSuggest(e.target.value, 'title');
            }}
            placeholder="🎬 Movie/Show Title"
          />
          {suggestions.length > 0 && (
            <ul className="suggestions-dropdown">
              {suggestions.map((s, i) => (
                <li key={i} onClick={() => setTitleInput(s)}>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="input-with-suggestions">
          <input
            value={actorInput}
            onChange={(e) => {
              setActorInput(e.target.value);
              handleSuggest(e.target.value, 'actor');
            }}
            placeholder="🧑 Actor Name"
          />
          {suggestions.length > 0 && (
            <ul className="suggestions-dropdown">
              {suggestions.map((s, i) => (
                <li key={i} onClick={() => setActorInput(s)}>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button onClick={handleSubmit}>Submit</button>
      </div>

      {error && <p className="error">{error}</p>}

      <p>
        <strong>Steps:</strong> {Math.floor((chain.length - 1) / 2)}
      </p>

      {chain.length > 0 && chain[chain.length - 1].name === goalActor?.name && (
        <p className="win-message">🎉 You reached the goal actor!</p>
      )}

      <button className="play-again" onClick={handleRestart}>🔁 Play Again</button>
    </div>
  );
}

export default App;

