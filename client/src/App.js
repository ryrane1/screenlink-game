import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const App = () => {
  const [startActor, setStartActor] = useState({});
  const [goalActor, setGoalActor] = useState({});
  const [chain, setChain] = useState([]);
  const [titleInput, setTitleInput] = useState('');
  const [actorInput, setActorInput] = useState('');
  const [steps, setSteps] = useState(0);
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [type, setType] = useState('actor');

  useEffect(() => {
    fetchNewGame();
  }, []);

  const fetchNewGame = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/get-random-actors`);
      setStartActor(res.data.start);
      setGoalActor(res.data.goal);
      setChain([res.data.start]);
      setSteps(0);
      setMessage('');
      setTitleInput('');
      setActorInput('');
    } catch (error) {
      console.error('Failed to load actors.');
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/validate-link`, {
        actor: actorInput,
        title: titleInput
      });

      if (res.data.valid) {
        setMessage('✅ Valid connection. Keep going!');
        const poster = res.data.poster || null;
        setChain([...chain, { name: titleInput, image: poster }, { name: actorInput, image: 
getActorImage(actorInput) }]);
        setSteps(steps + 1);

        if (actorInput.trim().toLowerCase() === goalActor.name.trim().toLowerCase()) {
          setMessage('🎉 You reached the goal actor!');
        }

        setTitleInput('');
        setActorInput('');
      } else {
        setMessage('❌ Invalid connection. Try again!');
      }
    } catch (error) {
      console.error('Validation error:', error);
      setMessage('⚠️ Error validating. Is the Flask server running?');
    }
  };

  const getActorImage = (name) => {
    const match = chain.find((item) => item.name === name);
    return match?.image || null;
  };

  const handleSuggest = async (query, type) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/suggest?query=${query}&type=${type}`);
      setSuggestions(res.data);
    } catch (err) {
      console.error('Suggestion error:', err);
    }
  };

  return (
    <div style={{ backgroundColor: '#111', color: '#b6fcb6', minHeight: '100vh', padding: '2rem', 
textAlign: 'center' }}>
      <h1>🎬 Connect from {startActor.name} to {goalActor.name}</h1>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
        {[startActor, goalActor].map((actor, idx) => (
          <div key={idx}>
            <img src={actor.image} alt={actor.name} style={{ width: '100px', borderRadius: '8px' }} />
            <h3>{actor.name}</h3>
          </div>
        ))}
      </div>
      <p><strong>Steps:</strong> {steps}</p>
      <input
        value={titleInput}
        onChange={(e) => {
          setTitleInput(e.target.value);
          handleSuggest(e.target.value, 'title');
        }}
        placeholder="🎬 Movie/Show Title"
        style={{ marginRight: '10px', padding: '8px' }}
      />
      <input
        value={actorInput}
        onChange={(e) => {
          setActorInput(e.target.value);
          handleSuggest(e.target.value, 'actor');
        }}
        placeholder="👤 Next Actor"
        style={{ marginRight: '10px', padding: '8px' }}
      />
      <button onClick={handleSubmit} style={{ padding: '8px 12px', background: '#4CAF50', color: 'white', 
border: 'none', borderRadius: '5px' }}>
        Submit
      </button>
      <div style={{ marginTop: '1rem', color: message.startsWith('✅') || message.startsWith('🎉') ? 
'lightgreen' : 'tomato' }}>
        {message}
      </div>
      <h3 style={{ marginTop: '2rem' }}>Current Chain:</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
        {chain.map((item, index) => (
          <div key={index} style={{ background: '#1a1a1a', padding: '10px', borderRadius: '8px', 
minWidth: '160px' }}>
            {item.image && <img src={item.image} alt={item.name} style={{ width: '60px', height: '85px', 
borderRadius: '5px', objectFit: 'cover', marginBottom: '5px' }} />}
            <div>{item.name} →</div>
          </div>
        ))}
      </div>
      <button onClick={fetchNewGame} style={{ marginTop: '2rem', backgroundColor: '#4CAF50', color: 
'white', padding: '10px 15px', borderRadius: '5px', border: 'none' }}>
        🔁 Play Again
      </button>
    </div>
  );
};

export default App;

