import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;

function App() {
  const [startActor, setStartActor] = useState(null);
  const [goalActor, setGoalActor] = useState(null);
  const [chain, setChain] = useState([]);
  const [titleInput, setTitleInput] = useState('');
  const [actorInput, setActorInput] = useState('');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchRandomActors = async () => {
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

    fetchRandomActors();
  }, []);

  const fetchActorImage = async (actorName) => {
    try {
      const res = await axios.get(
        `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(
          actorName
        )}&api_key=${TMDB_API_KEY}`
      );
      const path = res.data.results?.[0]?.profile_path;
      return path ? `https://image.tmdb.org/t/p/w185${path}` : '';
    } catch (err) {
      return '';
    }
  };

  const handleSubmit = async () => {
    try {
      const actor = actorInput.trim();
      const title = titleInput.trim();
      if (!actor || !title) return;

      const actorImage = await fetchActorImage(actor);

      const res = await axios.post(`${BACKEND_URL}/validate-link`, {
        actor: chain[chain.length - 1].name,
        title,
      });

      if (res.data.valid) {
        const poster = res.data.poster || '';
        setChain([
          ...chain,
          { name: title, image: poster },
          { name: actor, image: actorImage },
        ]);
        setTitleInput('');
        setActorInput('');
        setError('');
        setSuggestions([]);

        if (
          actor.toLowerCase() === goalActor.name.toLowerCase()
        ) {
          setMessage('🎉 You reached the goal actor!');
        }
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

  const handleSuggestion = (value, type) => {
    if (type === 'actor') setActorInput(value);
    else setTitleInput(value);
    setSuggestions([]);
  };

  const handleInputChange = async (e, type) => {
    const value = e.target.value;
    if (type === 'actor') setActorInput(value);
    else setTitleInput(value);

    if (!value.trim()) return setSuggestions([]);

    try {
      const res = await axios.get(
        `${BACKEND_URL}/suggest?query=${encodeURIComponent(
          value
        )}&type=${type}`
      );
      setSuggestions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="App">
      <h1 style={{ color: 'white' }}>🎬 Welcome to ScreenLink</h1>

      {startActor && goalActor && (
        <div className="start-goal-container">
          <div className="start-box">
            <img src={startActor.image} alt={startActor.name} />
            <p>
              <strong>Start:</strong> {startActor.name}
            </p>
          </div>
          <div className="goal-box">
            <img src={goalActor.image} alt={goalActor.name} />
            <p>
              <strong>Goal:</strong> {goalActor.name}
            </p>
          </div>
        </div>
      )}

      <div className="chain-container">
        {chain.map((item, idx) => (
          <div key={idx} className="chain-card">
            {item.image && <img src={item.image} alt={item.name} />}
            <p>{item.name}</p>
          </div>
        ))}
      </div>

      <div className="input-container">
        <input
          value={titleInput}
          onChange={(e) => handleInputChange(e, 'title')}
          placeholder="🎥 Movie/Show Title"
        />
        <input
          value={actorInput}
          onChange={(e) => handleInputChange(e, 'actor')}
          placeholder="🧑 Actor Name"
        />
        <button onClick={handleSubmit}>Submit</button>
      </div>

      {suggestions.length > 0 && (
        <div className="suggestion-box">
          {suggestions.map((sug, idx) => (
            <div
              key={idx}
              onClick={() =>
                handleSuggestion(sug, actorInput ? 'actor' : 'title')
              }
            >
              {sug}
            </div>
          ))}
        </div>
      )}

      {error && <p className="error">{error}</p>}
      {message && <p className="victory">{message}</p>}

      <p className="steps">Steps: {Math.max(Math.floor((chain.length - 1) / 2), 0)}</p>

      <button className="restart-button" onClick={handleRestart}>
        🔁 Play Again
      </button>
    </div>
  );
}

export default App;

