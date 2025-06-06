import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [chain, setChain] = useState([]);
  const [titleInput, setTitleInput] = useState('');
  const [actorInput, setActorInput] = useState('');
  const [startActor, setStartActor] = useState(null);
  const [goalActor, setGoalActor] = useState(null);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [win, setWin] = useState(false);

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
      });

      if (res.data.valid) {
        const poster = res.data.poster || '';
        const actorImage = res.data.actor_image || '';

        const newChain = [
          ...chain,
          { name: title, image: poster },
          { name: actor, image: actorImage },
        ];

        setChain(newChain);
        setTitleInput('');
        setActorInput('');
        setError('');
        setSuggestions([]);

        if (actor.toLowerCase() === goalActor.name.toLowerCase()) {
          setWin(true);
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

  const fetchSuggestions = async (query, type) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/suggest`, {
        params: { query, type },
      });
      setSuggestions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="App">
      <h1 style={{ color: '#28B22B' }}>🎬 Welcome to ScreenLink</h1>

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
        {chain.map((item, index) => (
          <div key={index} className="chain-item">
            <img src={item.image} alt={item.name} />
            <div>{item.name}</div>
          </div>
        ))}
      </div>

      <div className="input-container">
        <input
          type="text"
          value={titleInput}
          onChange={(e) => {
            setTitleInput(e.target.value);
            fetchSuggestions(e.target.value, 'title');
          }}
          placeholder="🎬 Movie/Show Title"
        />
        <input
          type="text"
          value={actorInput}
          onChange={(e) => {
            setActorInput(e.target.value);
            fetchSuggestions(e.target.value, 'actor');
          }}
          placeholder="🧑 Actor Name"
        />
        <button onClick={handleSubmit}>Submit</button>
      </div>

      {error && <div className="error">{error}</div>}

      {win && (
        <div className="win-message">
          🎉 You reached the goal actor!
        </div>
      )}

      <p className="step-counter">Steps: {Math.floor((chain.length - 1) / 2)}</p>

      <button className="restart-button" onClick={handleRestart}>
        🔁 Play Again
      </button>
    </div>
  );
}

export default App;

