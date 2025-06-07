import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './App.css';
import confetti from 'canvas-confetti';

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
  const [showEndCredits, setShowEndCredits] = useState(false);

  const chainContainerRef = useRef(null);
  const inputRef = useRef(null);

  const resetGame = () => {
    window.location.reload();
  };

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

  useEffect(() => {
    if (
      goalActor &&
      chain.length > 0 &&
      chain[chain.length - 1].type === 'actor' &&
      chain[chain.length - 1].name === goalActor.name
    ) {
      setShowEndCredits(true);
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      setTimeout(() => setShowEndCredits(false), 3000);
    }
  }, [chain, goalActor]);

  useEffect(() => {
    if (chainContainerRef.current) {
      chainContainerRef.current.scrollLeft = chainContainerRef.current.scrollWidth;
    }
  }, [chain]);

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

        setChain(prev => [
          ...prev,
          { name: title, image: poster, type: 'title' },
          { name: actor, image: actorImage, type: 'actor' }
        ]);

        setTitleInput('');
        setActorInput('');
        setSuggestions([]);
        setError('');

        if (goalActor && actor === goalActor.name) {
          const resPath = await axios.get(`${BACKEND_URL}/get-shortest-path?start=${startActor.name}&goal=${goalActor.name}`);
          setShortestPath(resPath.data.path || []);
        }
      } else {
        setError('❌ Invalid link');
      }
    } catch (err) {
      console.error(err);
      setError('❌ Server error');
    }
  };

  const handleInputChange = async (value, type) => {
    if (type === 'title') {
      setTitleInput(value);
    } else {
      setActorInput(value);
    }

    setSuggestType(type);
    if (!value) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await axios.get(`${BACKEND_URL}/suggest?type=${type}&q=${value}`);
      setSuggestions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelect = (suggestion) => {
    if (suggestType === 'title') {
      setTitleInput(suggestion.name);
    } else {
      setActorInput(suggestion.name);
    }
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className="App">
      <h1>🎬 ScreenLink</h1>
      <p className="instructions">
        Connect the <strong>Start</strong> actor to the <strong>Goal</strong> actor by entering movie titles and actors they’ve worked with — one link 
at a time. You win when you reach the goal!
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

      {chain.length > 0 && (
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <div className="chain-scroll-wrapper">
            <div className="chain-container" ref={chainContainerRef}>
              {chain.map((entry, i) => (
                <React.Fragment key={`${entry.name}-${i}`}>
                  <div className={`chain-item ${entry.type}`}>
                    {entry.image && <img src={entry.image} alt={entry.name} />}
                    <div>{entry.name}</div>
                  </div>
                  {i < chain.length - 1 && <div className="arrow">➡️</div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="input-container">
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="Enter a film/tv title"
            value={titleInput}
            onChange={(e) => handleInputChange(e.target.value, "title")}
          />
          {suggestType === "title" && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((s, i) => (
                <div key={i} className="suggestion" onClick={() => handleSelect(s)}>
                  <img src={s.image} alt={s.name} />
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="input-wrapper">
          <input
            type="text"
            ref={inputRef}
            placeholder="Enter an actor"
            value={actorInput}
            onChange={(e) => handleInputChange(e.target.value, "actor")}
          />
          {suggestType === "actor" && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((s, i) => (
                <div key={i} className="suggestion" onClick={() => handleSelect(s)}>
                  <img src={s.image} alt={s.name} />
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleSubmit}>Submit</button>
      </div>

      {error && <p className="error">{error}</p>}
      <p><strong>Links:</strong> {Math.max(Math.floor((chain.length - 1) / 2), 0)}</p>

      <button className="play-again" onClick={resetGame}>🔄 Play Again</button>

      {showEndCredits && (
        <div className="end-credits">
          <h2>🎉 Thanks for playing!</h2>
          <p>Now showing the optimal path...</p>
        </div>
      )}
    </div>
  );
}

export default App;

