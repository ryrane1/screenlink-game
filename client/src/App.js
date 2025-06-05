import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Autosuggest from 'react-autosuggest';
import debounce from 'lodash.debounce';
import './styles.css';

const TMDB_API_KEY = '2239da01901a945dbdd733bd2f845582'; // Optional if you proxy requests

function App() {
  const [start, setStart] = useState({ name: '', image: '' });
  const [goal, setGoal] = useState({ name: '', image: '' });
  const [chain, setChain] = useState([]);
  const [inputTitle, setInputTitle] = useState('');
  const [inputActor, setInputActor] = useState('');
  const [status, setStatus] = useState('');
  const [gameOver, setGameOver] = useState(false);

  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [actorSuggestions, setActorSuggestions] = useState([]);

  const fetchNewGame = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE}/get-random-actors`);
    
      console.log("API response:", res.data); // ✅ This logs the full backend response
      console.log("Start actor:", res.data.start); // ✅ This confirms start actor object
      console.log("Goal actor:", res.data.goal);   // ✅ This confirms goal actor object

      setStart(res.data.start);
      setGoal(res.data.goal);
      setChain([{ actor: res.data.start.name, image: res.data.start.image }]);
      setInputTitle('');
      setInputActor('');
      setStatus('');
      setGameOver(false);
    } catch (error) {
      console.error("❌ fetchNewGame error:", error);
    }
  };


  useEffect(() => {
    fetchNewGame();
  }, []);

  const debouncedFetchTitles = debounce(async (value) => {
    if (!value.trim()) return;
    const res = await axios.get(
      `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${value}`
    );
    const results = res.data.results.map((item) => ({
      name: item.title || item.name
    }));
    setTitleSuggestions(results);
  }, 300);

  const debouncedFetchActors = debounce(async (value) => {
    if (!value.trim()) return;
    const res = await axios.get(
      `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${value}`
    );
    const results = res.data.results.map((item) => ({
      name: item.name
    }));
    setActorSuggestions(results);
  }, 300);

  const fetchActorImage = async (name) => {
    const res = await axios.get(
      `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${name}`
    );
    const person = res.data.results?.[0];
    return person?.profile_path
      ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
      : null;
  };

  const fetchPoster = async (title) => {
    const res = await axios.get(
      `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${title}`
    );
    const media = res.data.results?.[0];
    return media?.poster_path
      ? `https://image.tmdb.org/t/p/w185${media.poster_path}`
      : null;
  };

  const handleSubmit = async () => {
    if (!inputTitle || !inputActor) {
      setStatus('❗ Please enter both a title and actor.');
      return;
    }

    try {
      const res = await axios.post('/validate-link', {
        actor: inputActor,
        title: inputTitle
      });

      if (res.data.valid) {
        const actorImg = await fetchActorImage(inputActor);
        const posterImg = await fetchPoster(inputTitle);

        const newChain = [
          ...chain,
          { title: inputTitle, poster: posterImg },
          { actor: inputActor, image: actorImg }
        ];

        setChain(newChain);
        setStatus('');
      const normalize = str =>
        str.toLowerCase().trim().replace(/’/g, "'").replace(/[\W_]+/g, '');

      if (normalize(inputActor) === normalize(goal.name)) {
        setStatus('🎉 You reached the goal actor!');
        setGameOver(true);
      }

      } else {
        setStatus('❌ Invalid connection. Try again.');
      }

      setInputTitle('');
      setInputActor('');
    } catch (error) {
      console.error(error);
      setStatus('💥 Error validating. Is the Flask server running?');
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial', maxWidth: '900px', margin: 'auto' }}>
      <h2 style={{ color: '#90ee90' }}>
        🎬 Connect from <strong>{start?.name || '...'}</strong> to <strong>{goal?.name || '...'}</strong>
      </h2>

      <div style={{ display: 'flex', gap: '40px', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center' }}>
        {start?.image && (
          <img src={start.image} alt={start.name || 'Start Actor'} style={{ height: '100px', borderRadius: '8px' }} />
        )}
          <div>{start.name}</div>
        </div>
        <span style={{ fontSize: '24px' }}>🎯</span>
        <div style={{ textAlign: 'center' }}>
        {goal?.image && (
          <img src={goal.image} alt={goal.name || 'Goal Actor'} style={{ height: '100px', borderRadius: '8px' }} />
        )}
          <div>{goal.name}</div>
        </div>
      </div>

      <div style={{ marginBottom: '20px', fontSize: '18px' }}>
        {chain.map((item, i) => (
          <span key={i} className="actor-block">
            {item.actor && item.image && (
              <img src={item.image} alt={item.actor} style={{ height: '80px', borderRadius: 
'8px' }} />
            )}
            {item.title && item.poster && (
              <img src={item.poster} alt={item.title} style={{ height: '80px', borderRadius: 
'8px' }} />
            )}
            {item.actor ? `👤 ${item.actor}` : `🎥 ${item.title}`} {' → '}
          </span>
        ))}
      </div>

      {!gameOver && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <Autosuggest
            suggestions={titleSuggestions}
            onSuggestionsFetchRequested={({ value }) => debouncedFetchTitles(value)}
            onSuggestionsClearRequested={() => setTitleSuggestions([])}
            getSuggestionValue={(s) => s.name}
            renderSuggestion={(s) => <span>{s.name}</span>}
            inputProps={{
              placeholder: '🎥 Movie/Show Title',
              value: inputTitle,
              onChange: (_, { newValue }) => setInputTitle(newValue)
            }}
          />

          <Autosuggest
            suggestions={actorSuggestions}
            onSuggestionsFetchRequested={({ value }) => debouncedFetchActors(value)}
            onSuggestionsClearRequested={() => setActorSuggestions([])}
            getSuggestionValue={(s) => s.name}
            renderSuggestion={(s) => <span>{s.name}</span>}
            inputProps={{
              placeholder: '👤 Next Actor',
              value: inputActor,
              onChange: (_, { newValue }) => setInputActor(newValue)
            }}
          />

          <button onClick={handleSubmit}>Submit</button>
        </div>
      )}

      <p style={{ color: status.startsWith('🎉') ? 'limegreen' : 'tomato', fontWeight: 'bold' 
}}>
        {status}
      </p>

      <p><strong>Steps:</strong> {Math.floor((chain.length - 1) / 2)}</p>

      <button onClick={fetchNewGame} style={{ marginTop: '20px' }}>
        🔁 Play Again
      </button>

      {gameOver && (
        <div style={{
          marginTop: '30px',
          backgroundColor: '#1a3d1a',
          padding: '20px',
          borderRadius: '12px',
          color: '#caffca',
          fontSize: '18px'
        }}>
          ✅ Game Summary: You connected <strong>{start.name}</strong> to 
<strong>{goal.name}</strong> in <strong>{Math.max(Math.floor((chain.length - 1) / 2), 0)}</strong> steps!
        </div>
      )}
    </div>
  );
}

export default App;


