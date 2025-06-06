import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = 'https://screenlink-game.onrender.com';

const App = () => {
  const [startActor, setStartActor] = useState({});
  const [goalActor, setGoalActor] = useState({});
  const [chain, setChain] = useState([]);
  const [titleInput, setTitleInput] = useState('');
  const [actorInput, setActorInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [type, setType] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchNewGame = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/get-random-actors`);
        setStartActor(res.data.start);
        setGoalActor(res.data.goal);
        setChain([res.data.start]);
        setMessage('');
      } catch (err) {
        setMessage('❌ Failed to load actors');
      }
    };
    fetchNewGame();
  }, []);

  const handleSuggest = async (query, type) => {
    if (!query) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/suggest`, {
        params: { query, type }
      });
      setSuggestions(res.data.map(item => item.name || item));
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
        title
      });

      if (res.data.valid) {
        const poster = res.data.poster || '';
        const actorImage = res.data.actor_image || '';
        setChain([
          ...chain,
          { name: title, image: poster },
          { name: actor, image: actorImage }
        ]);

        if (actor.toLowerCase() === goalActor.name.toLowerCase()) {
          setMessage('🎉 You reached the goal actor!');
        } else {
          setMessage('✅ Valid connection. Keep going!');
        }

        setTitleInput('');
        setActorInput('');
        setSuggestions([]);
      } else {
        setMessage('❌ Invalid link');
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Error connecting to backend');
    }
  };

  const handleRestart = () => {
    window.location.reload();
  };

  const handleSuggestionClick = (text) => {
    if (type === 'actor') {
      setActorInput(text);
    } else {
      setTitleInput(text);
    }
    setSuggestions([]);
  };

  return (
    <div className="App">
      <h1>🎬 Welcome to ScreenLink</h1>

      {startActor.name && goalActor.name && (
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
            {entry.image && <img src={entry.image} alt={entry.name} />}
            <p>{entry.name}</p>
          </div>
        ))}
      </div>

      <div className="input-section">
        <div className="input-wrapper">
          <input
            value={titleInput}
            onChange={(e) => {
              setTitleInput(e.target.value);
              setType('title');
              handleSuggest(e.target.value, 'title');
            }}
            placeholder="🎬 Movie/Show Title"
          />
          {type === 'title' && suggestions.length > 0 && (
            <ul className="suggestion-dropdown">
              {suggestions.map((s, idx) => (
                <li key={idx} onClick={() => handleSuggestionClick(s)}>{s}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="input-wrapper">
          <input
            value={actorInput}
            onChange={(e) => {
              setActorInput(e.target.value);
              setType('actor');
              handleSuggest(e.target.value, 'actor');
            }}
            placeholder="👤 Next Actor"
          />
          {type === 'actor' && suggestions.length > 0 && (
            <ul className="suggestion-dropdown">
              {suggestions.map((s, idx) => (
                <li key={idx} onClick={() => handleSuggestionClick(s)}>{s}</li>
              ))}
            </ul>
          )}
        </div>

        <button onClick={handleSubmit}>Submit</button>
      </div>

      {message && <div className="message">{message}</div>}

      <p><strong>Steps:</strong> {Math.max(Math.floor((chain.length - 1) / 2), 0)}</p>

      <button onClick={handleRestart}>🔁 Play Again</button>
    </div>
  );
};

export default App;

