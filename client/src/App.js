import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = 'https://screenlink-game.onrender.com';

function App() {
  const [startActor, setStartActor] = useState(null);
  const [goalActor, setGoalActor] = useState(null);
  const [chain, setChain] = useState([]);
  const [titleInput, setTitleInput] = useState('');
  const [actorInput, setActorInput] = useState('');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage] = useState('');
  const [type, setType] = useState(''); // 'actor' or 'title'

  useEffect(() => {
    const fetchStartAndGoal = async () => {
      const res = await axios.get(`${BACKEND_URL}/get-random-actors`);
      setStartActor(res.data.start);
      setGoalActor(res.data.goal);
      setChain([res.data.start]);
    };
    fetchStartAndGoal();
  }, []);

  const handleSuggest = async (query, type) => {
    if (!query) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/suggest`, {
        params: { query, type },
      });
      setSuggestions(res.data.map((item) => item.name || item));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    try {
      const actor = actorInput.trim();
      const title = titleInput.trim();
      const res = await axios.post(`${BACKEND_URL}/validate-link`, {
        actor: chain[chain.length - 1].name,
        title,
      });

      if (res.data.valid) {
        const poster = res.data.poster || '';
        const actorImage = res.data.actor_image || '';
        setChain([
          ...chain,
          { name: title, image: poster },
          { name: actor, image: actorImage },
        ]);
        if (actor.toLowerCase() === goalActor.name.toLowerCase()) {
          setMessage("🎉 You reached the goal actor!");
        }

        setTitleInput('');
        setActorInput('');
        setError('');
        setSuggestions([]);
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

  return (
    <div className="App">
      <h1 style={{ color: '#228B22' }}>🎬 Welcome to ScreenLink</h1>

      {startActor && goalActor && (
        <div className="start-goal-container">
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

      <div className="chain-display">
        {chain.map((entry, index) => (
          <div key={index} className="chain-step">
            <img src={entry.image} alt={entry.name} />
            <p>{entry.name}</p>
          </div>
        ))}
      </div>

      <div className="input-section">
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <input
            value={titleInput}
            onChange={(e) => {
              setTitleInput(e.target.value);
              setType('title');
              handleSuggest(e.target.value, 'title');
            }}
            placeholder="🎬 Movie/Show Title"
            style={{ marginRight: '10px', padding: '8px' }}
          />
          {type === 'title' && suggestions.length > 0 && (
            <ul className="suggestion-dropdown">
              {suggestions.map((sug, i) => (
                <li
                  key={i}
                  onClick={() => {
                    setTitleInput(sug);
                    setSuggestions([]);
                  }}
                >
                  {sug}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ position: 'relative', display: 'inline-block' }}>
          <input
            value={actorInput}
            onChange={(e) => {
              setActorInput(e.target.value);
              setType('actor');
              handleSuggest(e.target.value, 'actor');
            }}
            placeholder="🧑 Actor Name"
            style={{ marginRight: '10px', padding: '8px' }}
          />
          {type === 'actor' && suggestions.length > 0 && (
            <ul className="suggestion-dropdown">
              {suggestions.map((sug, i) => (
                <li
                  key={i}
                  onClick={() => {
                    setActorInput(sug);
                    setSuggestions([]);
                  }}
                >
                  {sug}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button onClick={handleSubmit}>Submit</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <p>
        <strong>Steps:</strong> {Math.max(Math.floor((chain.length - 1) / 2), 0)}
      </p>

      <button onClick={handleRestart}>🔁 Play Again</button>
    </div>
  );
}

export default App;

