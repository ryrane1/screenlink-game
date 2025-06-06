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
  const [suggestType, setSuggestType] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchActors = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/get-random-actors`);
        setStartActor(res.data.start);
        setGoalActor(res.data.goal);
        setChain([{ name: res.data.start.name, image: res.data.start.image, type: 'actor' }]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchActors();
  }, []);

  const handleSubmit = async () => {
    try {
      const actor = actorInput.trim();
      const title = titleInput.trim();
      const lastActorEntry = [...chain].reverse().find(item => item.type === 'actor');
      const currentActor = lastActorEntry?.name;

      const res = await axios.post(`${BACKEND_URL}/validate-link`, {
        actor: currentActor,
        title,
        next_actor: actor
      });

      if (res.data.valid) {
        const poster = res.data.poster || '';
        const actorImage = res.data.actor_image || '';

        setChain((prev) => [
          ...prev,
          { name: title, image: poster, type: 'title' },
          { name: actor, image: actorImage, type: 'actor' }
        ]);

        setTitleInput('');
        setActorInput('');
        setSuggestions([]);
        setError('');

        if (goalActor && actor === goalActor.name) {
          alert("🎉 You reached the goal actor!");
        }
      } else {
        setError('❌ Invalid link');
      }
    } catch (err) {
      console.error(err);
      setError('❌ Server error');
    }
  };

  const handleRestart = () => {
    window.location.reload();
  };

  const handleSuggest = async (query, type) => {
    try {
      setSuggestType(type);
      if (!query) {
        setSuggestions([]);
        return;
      }

      const res = await axios.get(`${BACKEND_URL}/suggest?query=${query}&type=${type}`);
      const namesOnly = (res.data || []).map(item => item.name || item.title || '');
      setSuggestions(namesOnly.filter(Boolean));
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    }
  };

  return (
    <div className="App">
      <h1>🎬 ScreenLink</h1>

      {startActor && goalActor && (
        <div className="start-goal-container">
          <div className="actor-box">
            <img src={startActor.image} alt="Start Actor" />
            <div><strong>Start:</strong> {startActor.name}</div>
          </div>
          <div className="actor-box">
            <img src={goalActor.image} alt="Goal Actor" />
            <div><strong>Goal:</strong> {goalActor.name}</div>
          </div>
        </div>
      )}
      <div className="chain-container">
        {chain.map((entry, i) => (
          <React.Fragment key={`${entry.name}-${i}`}>
            <div
              className={`chain-item ${entry.type} ${
                goalActor && entry.name === goalActor.name && entry.type === 'actor' ? 'winner' : ''
              }`}
            >
              {entry.image && typeof entry.image === 'string' && (
                <img src={entry.image} alt={entry.name || 'Image'} />
              )}
              <div>{entry.name}</div>
            </div>
            {i < chain.length - 1 && <div className="arrow">➡️</div>}
          </React.Fragment>
        ))}
      </div>

      <div className="input-container">
        <div className="input-box">
          <input
            value={titleInput}
            onChange={(e) => {
              setTitleInput(e.target.value);
              handleSuggest(e.target.value, 'title');
            }}
            placeholder="Enter a title"
          />
          {suggestType === 'title' && suggestions.length > 0 && (
            <div className="suggestions-box">
              {suggestions.map((sug, i) => (
                <div
                  key={i}
                  className="suggestion-item"
                  onClick={() => {
                    setTitleInput(sug);
                    setSuggestions([]);
                  }}
                >
                  {sug}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="input-box">
          <input
            value={actorInput}
            onChange={(e) => {
              setActorInput(e.target.value);
              handleSuggest(e.target.value, 'actor');
            }}
            placeholder="Enter an actor"
          />
          {suggestType === 'actor' && suggestions.length > 0 && (
            <div className="suggestions-box">
              {suggestions.map((sug, i) => (
                <div
                  key={i}
                  className="suggestion-item"
                  onClick={() => {
                    setActorInput(sug);
                    setSuggestions([]);
                  }}
                >
                  {sug}
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleSubmit}>Submit</button>
      </div>

      {error && <div className="error">{error}</div>}

      <p className="steps">
        <strong>Steps:</strong> {Math.max(Math.floor((chain.length - 1) / 2), 0)}
      </p>

      <div className="play-again">
        <button onClick={handleRestart}>🔁 Play Again</button>
      </div>
    </div>
  );
}

export default App;

