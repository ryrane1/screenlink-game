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
  const [shortestPath, setShortestPath] = useState([]);
  const [error, setError] = useState('');
  const resetGame = () => {
  window.location.reload();};

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
          const resPath = await axios.get(`${BACKEND_URL}/get-shortest-path?start=${startActor.name}&goal=${goalActor.name}`);
          setShortestPath(resPath.data.path || []);
          return;
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

      if (type === 'actor') {
        const seen = new Set();
        const uniqueActors = [];
        for (const actor of res.data || []) {
          if (!seen.has(actor.name)) {
            seen.add(actor.name);
            uniqueActors.push(actor);
          }
        }
        setSuggestions(uniqueActors);
      } else {
        setSuggestions(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    }
  };

  return (
    <div className="App">
      {goalActor &&
        chain.length > 0 &&
        chain[chain.length - 1].type === 'actor' &&
        chain[chain.length - 1].name === goalActor.name && (
          <div className="end-credits">
            <h2>🎬 Thanks for playing ScreenLink!</h2>
            <button onClick={resetGame}>Play Again</button>
          </div>
      )}

      <h1>🎬 ScreenLink</h1>
      <p className="instructions">
        Connect the <strong>Start</strong> actor to the <strong>Goal</strong> actor by entering
        movie titles and actors they’ve worked with — one link at a time. You win when you reach the goal!
      </p>

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
            placeholder="Enter a film/tv title"
          />
          {suggestType === 'title' && suggestions.length > 0 && (
            <div className="suggestions-box">
              {suggestions.slice(0, 5).map((item, i) => (
                <div
                  key={i}
                  className="suggestion-item"
                  onClick={() => {
                    setTitleInput(item.name || item.title || '');
                    setSuggestions([]);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  )}
                  <span>{item.name || item.title}</span>
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
              {suggestions.slice(0, 5).map((item, i) => (
                <div
                  key={i}
                  className="suggestion-item"
                  onClick={() => {
                    setActorInput(item.name);
                    setSuggestions([]);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  )}
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleSubmit}>Submit</button>
      </div>

      {error && <div className="error">{error}</div>}

      <p className="steps">
        <strong>Links:</strong> {Math.max(Math.floor((chain.length - 1) / 2), 0)}
      </p>

      {shortestPath.length > 0 && (
        <>
          <h3>🎯 Optimal Path:</h3>
          <div className="chain-container">
            {shortestPath.map((entry, i) => (
              <React.Fragment key={`${entry.name}-${i}`}>
                <div className={`chain-item ${entry.type}`}>
                  <div>{entry.name}</div>
                </div>
                {i < shortestPath.length - 1 && <div className="arrow">➡️</div>}
              </React.Fragment>
            ))}
          </div>
        </>
      )}

      <div className="play-again">
        <button onClick={handleRestart}>🔁 Play Again</button>
      </div>
    </div>
  );
}

export default App;

