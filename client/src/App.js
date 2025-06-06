import React, { useState, useEffect, useRef } from 'react';
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
  const scrollRef = useRef(null);

  const scrollChain = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -300 : 300,
        behavior: 'smooth'
      });
    }
  };

  const resetGame = () => {
    window.location.reload();
  };

  useEffect(() => {
    const fetchActors = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/get-random-actors`);
        setStartActor(res.data.start);
        setGoalActor(res.data.goal);
        setChain([
          { name: res.data.start.name, image: res.data.start.image, type: 'actor' }
        ]);
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
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        setShowEndCredits(false);
      }, 7000);
    }
  }, [chain, goalActor]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [chain]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const query = suggestType === 'title' ? titleInput : actorInput;
      if (!query) return;
      try {
        const res = await axios.get(`${BACKEND_URL}/suggestions?query=${query}&type=${suggestType}`);
        setSuggestions(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [titleInput, actorInput, suggestType]);

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
          const resPath = await axios.get(
            `${BACKEND_URL}/get-shortest-path?start=${startActor.name}&goal=${goalActor.name}`
          );
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

  return (
    <div className="App">
      <h1>🎬 ScreenLink</h1>
      <p className="instructions">
        Connect the <strong>Start</strong> actor to the <strong>Goal</strong> actor by entering movie titles and actors they’ve worked with — one link 
at a time. You win when you reach the goal!
      </p>

      {showEndCredits && (
        <div className="end-credits">
          <div className="end-credits-content">
            <h2>🎬 Thanks for playing ScreenLink!</h2>
            <p>See below for the optimal path.</p>
          </div>
        </div>
      )}

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
        <>
          <div className="scroll-buttons">
            <button onClick={() => scrollChain('left')}>⬅️</button>
            <button onClick={() => scrollChain('right')}>➡️</button>
          </div>

          <div className="chain-scroll-wrapper" ref={scrollRef}>
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
          </div>

          <div className="input-container">
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="Enter a film/tv title"
                value={titleInput}
                onChange={(e) => {
                  setTitleInput(e.target.value);
                  setSuggestType('title');
                }}
              />
              {suggestions.length > 0 && suggestType === 'title' && (
                <div className="suggestions-dropdown">
                  {suggestions.map((s, i) => (
                    <div key={i} className="suggestion" onClick={() => {
                      setTitleInput(s.name);
                      setSuggestions([]);
                    }}>
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
                placeholder="Enter an actor"
                value={actorInput}
                onChange={(e) => {
                  setActorInput(e.target.value);
                  setSuggestType('actor');
                }}
              />
              {suggestions.length > 0 && suggestType === 'actor' && (
                <div className="suggestions-dropdown">
                  {suggestions.map((s, i) => (
                    <div key={i} className="suggestion" onClick={() => {
                      setActorInput(s.name);
                      setSuggestions([]);
                    }}>
                      <img src={s.image} alt={s.name} />
                      <span>{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleSubmit}>Submit</button>
          </div>
        </>
      )}

      {error && <div className="error">❌ {error}</div>}

      <p><strong>Links:</strong> {Math.max(Math.floor((chain.length - 1) / 2), 0)}</p>

      <div className="play-again">
        <button onClick={resetGame}>🔄 Play Again</button>
      </div>
    </div>
  );
}

export default App;

