
import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [startActor, setStartActor] = useState(null);
  const [goalActor, setGoalActor] = useState(null);
  const [chain, setChain] = useState([]);
  const [currentInput, setCurrentInput] = useState({ actor: '', title: '' });
  const [validationMessage, setValidationMessage] = useState('');
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    fetch('http://localhost:5001/get-random-actors')
      .then(res => res.json())
      .then(data => {
        setStartActor(data.start);
        setGoalActor(data.goal);
        setChain([data.start]);
        setSteps(0);
        setValidationMessage('');
      });
  }, []);

  const handleSubmit = async () => {
    const { actor, title } = currentInput;
    if (!actor || !title) {
      setValidationMessage('Please fill both actor and title.');
      return;
    }

    const res = await fetch('http://localhost:5001/validate-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor, title })
    });
    const result = await res.json();

    if (result.valid) {
      setChain([...chain, { name: title }, { name: actor }]);
      setSteps(prev => prev + 1);
      setCurrentInput({ actor: '', title: '' });

      if (actor.toLowerCase() === goalActor.name.toLowerCase()) {
        setValidationMessage('🎉 You reached the goal actor!');
      } else {
        setValidationMessage('✅ Valid link. Keep going.');
      }
    } else {
      setValidationMessage('❌ Invalid link. Try again.');
    }
  };

  const handlePlayAgain = () => {
    window.location.reload(); // Simple full reset for now
  };

  return (
    <div className="App">
      <h1>🎬 Actor Connection Game</h1>
      {startActor && goalActor ? (
        <div>
          <div>
            <h3>Start: {startActor.name}</h3>
            {startActor.image && <img src={startActor.image} alt={startActor.name} />}
          </div>
          <div>
            <h3>Goal: {goalActor.name}</h3>
            {goalActor.image && <img src={goalActor.image} alt={goalActor.name} />}
          </div>
        </div>
      ) : (
        <p>Loading actors...</p>
      )}

      <div>
        <p>
          <strong>Steps:</strong> {Math.max(Math.floor((chain.length - 1) / 2), 0)}
        </p>

        <input
          type="text"
          placeholder="Actor Name"
          value={currentInput.actor}
          onChange={e => setCurrentInput({ ...currentInput, actor: e.target.value })}
        />
        <input
          type="text"
          placeholder="Movie or TV Title"
          value={currentInput.title}
          onChange={e => setCurrentInput({ ...currentInput, title: e.target.value })}
        />
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={handlePlayAgain}>Play Again</button>

        <p>{validationMessage}</p>

        <div>
          <h4>Current Chain:</h4>
          <ul>
            {chain.map((item, index) => (
              <li key={index}>{item.name}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;

