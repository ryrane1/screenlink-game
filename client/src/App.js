import React, { useState, useEffect } from 'react';
import Autosuggest from 'react-autosuggest';
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
  const [suggestType, setSuggestType] = useState('actor');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function fetchActors() {
      try {
        const res = await axios.get(`${BACKEND_URL}/get-random-actors`);
        setStartActor(res.data.start);
        setGoalActor(res.data.goal);
        setChain([{ name: res.data.start.name, image: res.data.start.image }]);
      } catch (err) {
        console.error(err);
        setError('Failed to load actors.');
      }
    }
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
        setSuggestions([]);
        setError('');

        if (goalActor && actor.toLowerCase() === goalActor.name.toLowerCase()) {
          setSuccess('🎉 You reached the goal actor!');
        } else {
          setSuccess('✅ Valid connection. Keep going!');
        }
      } else {
        setError('❌ Invalid link');
        setSuccess('');
      }
    } catch (err) {
      console.error(err);
      setError('Error connecting to backend');
      setSuccess('');
    }
  };

  const handleRestart = () => {
    window.location.reload();
  };

  const onSuggestionsFetchRequested = async ({ value }) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/suggest?query=${value}&type=${suggestType}`);
      setSuggestions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const getSuggestionValue = (suggestion) => suggestion;

  const renderSuggestion = (suggestion) => <div>{suggestion}</div>;

  const inputPropsTitle = {
    placeholder: '🎬 Movie/Show Title',
    value: titleInput,
    onChange: (_, { newValue }) => {
      setTitleInput(newValue);
      setSuggestType('title');
    },
  };

  const inputPropsActor = {
    placeholder: '🧑 Actor Name',
    value: actorInput,
    onChange: (_, { newValue }) => {
      setActorInput(newValue);
      setSuggestType('actor');
    },
  };

  return (
    <div className="App">
      <h1>🎬 Welcome to ScreenLink</h1>

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

      <div className="chain-container">
        {chain.map((item, index) => (
          <div key={`${item.name}-${index}`} className="chain-item">
            <img src={item.image} alt={item.name} />
            <p>{item.name}</p>
          </div>
        ))}
      </div>

      <div className="input-container">
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={onSuggestionsFetchRequested}
          onSuggestionsClearRequested={onSuggestionsClearRequested}
          getSuggestionValue={getSuggestionValue}
          renderSuggestion={renderSuggestion}
          inputProps={inputPropsTitle}
        />
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={onSuggestionsFetchRequested}
          onSuggestionsClearRequested={onSuggestionsClearRequested}
          getSuggestionValue={getSuggestionValue}
          renderSuggestion={renderSuggestion}
          inputProps={inputPropsActor}
        />
        <button onClick={handleSubmit}>Submit</button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="steps"><strong>Steps:</strong> {Math.max(Math.floor((chain.length - 1) / 2), 
0)}</div>

      <div className="play-again">
        <button onClick={handleRestart}>🔁 Play Again</button>
      </div>
    </div>
  );
}

export default App;

