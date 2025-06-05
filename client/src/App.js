import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://screenlink-game.onrender.com';

function App() {
  const [startActor, setStartActor] = useState(null);
  const [goalActor, setGoalActor] = useState(null);
  const [chain, setChain] = useState([]);
  const [currentInput, setCurrentInput] = useState({ actor: '', title: '' });
  const [validationMessage, setValidationMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("📡 Fetching random actors from:", `${BACKEND_URL}/get-random-actors`);
    axios.get(`${BACKEND_URL}/get-random-actors`)
      .then(res => {
        console.log("✅ Random actors loaded:", res.data);
        setStartActor(res.data.start);
        setGoalActor(res.data.goal);
        setChain([res.data.start]);
        setLoading(false);
      })
      .catch(err => {
        console.error("❌ Error loading actors:", err);
        setValidationMessage('Failed to load actors.');
        setLoading(false);
      });
  }, []);

  const handleSubmit = async () => {
    const { actor, title } = currentInput;
    if (!actor || !title) {
      setValidationMessage('❗ Please fill out both fields.');
      return;
    }

    try {
      console.log("📨 Sending to backend:", { actor, title });
      const response = await axios.post(`${BACKEND_URL}/validate-link`, { actor, title });

      if (response.data.valid) {
        console.log("✅ Valid link confirmed.");
        setChain(prev => [...prev, { name: title }, { name: actor }]);
        setValidationMessage('✅ Valid connection. Keep going!');
        setCurrentInput({ actor: '', title: '' });

        if (actor.trim().toLowerCase() === goalActor.name.trim().toLowerCase()) {
          setValidationMessage('🎉 You reached the goal actor!');
        }
      } else {
        console.log("❌ Invalid connection.");
        setValidationMessage('❌ Invalid connection. Try again.');
      }
    } catch (error) {
      console.error("💥 Error during validation:", error);
      setValidationMessage('💥 Error connecting to Flask backend.');
    }
  };

  const handlePlayAgain = () => {
    window.location.reload();
  };

  return (
    <div className="App" style={{ backgroundColor: '#0d0d0d', color: '#b2ff9e', padding: '2rem', 
fontFamily: 'sans-serif' }}>
      <h1>🎬 Connect from {startActor?.name} to {goalActor?.name}</h1>
      
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'center', 
marginBottom: '1rem' }}>
        {startActor?.image && (
          <div>
            <img src={startActor.image} alt={startActor.name} style={{ width: 100, borderRadius: 8 }} />
            <div>{startActor.name}</div>
          </div>
        )}
        🎯
        {goalActor?.image && (
          <div>
            <img src={goalActor.image} alt={goalActor.name} style={{ width: 100, borderRadius: 8 }} />
            <div>{goalActor.name}</div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <strong>Steps:</strong> {Math.max(Math.floor((chain.length - 1) / 2), 0)}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
        <input
          placeholder="🎬 Movie/Show Title"
          value={currentInput.title}
          onChange={e => setCurrentInput({ ...currentInput, title: e.target.value })}
        />
        <input
          placeholder="👤 Next Actor"
          value={currentInput.actor}
          onChange={e => setCurrentInput({ ...currentInput, actor: e.target.value })}
        />
        <button onClick={handleSubmit}>Submit</button>
      </div>

      <p style={{ color: validationMessage.includes('Error') || validationMessage.includes('Invalid') ? 
'red' : 'lightgreen' }}>
        {validationMessage}
      </p>

      <div style={{ marginTop: '1rem' }}>
        <h3>Current Chain:</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
          {chain.map((item, idx) => (
            <div key={idx} style={{ backgroundColor: '#1a1a1a', padding: '0.5rem 1rem', borderRadius: 8 
}}>
              {item.image && <img src={item.image} alt={item.name} style={{ width: 50, marginRight: 8, 
verticalAlign: 'middle' }} />}
              {item.name}
              {idx !== chain.length - 1 && ' → '}
            </div>
          ))}
        </div>
      </div>

      <button onClick={handlePlayAgain} style={{ marginTop: '2rem', padding: '0.5rem 1rem', 
backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 4 }}>
        🔁 Play Again
      </button>
    </div>
  );
}

export default App;

