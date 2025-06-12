import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import confetti from "canvas-confetti";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

function App() {
  const [mode, setMode] = useState("daily");
  const [startActor, setStartActor] = useState(null);
  const [goalActor, setGoalActor] = useState(null);
  const [chain, setChain] = useState([]);
  const [actorInput, setActorInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestType, setSuggestType] = useState("actor");
  const [gameOver, setGameOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [submittedName, setSubmittedName] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(() => Number(localStorage.getItem("streak")) || 0);
  const [bestLinkCount, setBestLinkCount] = useState(() => Number(localStorage.getItem("bestScore")) || 
null);
  const [loading, setLoading] = useState(true);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(true);
  const quotes = [
    "“Frankly, my dear, I don't give a damn.” — Gone with the Wind",
    "“I'm gonna make him an offer he can't refuse.” — The Godfather",
    "“You talkin' to me?” — Taxi Driver",
    "“May the Force be with you.” — Star Wars",
    "“Here's looking at you, kid.” — Casablanca",
    "“I see dead people.” — The Sixth Sense",
    "“Hasta la vista, baby.” — Terminator 2",
    "“You can't handle the truth!” — A Few Good Men",
    "“Why so serious?” — The Dark Knight",
    "“I'll be back.” — The Terminator",
    "“To infinity... and beyond!” — Toy Story",
    "“I'm king of the world!” — Titanic",
    "“Just keep swimming.” — Finding Nemo",
    "“Life is like a box of chocolates.” — Forrest Gump",
    "“Nobody puts Baby in a corner.” — Dirty Dancing",
    "“Houston, we have a problem.” — Apollo 13",
    "“Keep the change, ya filthy animal.” — Home Alone",
    "“That'll do, pig. That'll do.” — Babe",
    "“You is kind. You is smart. You is important.” — The Help",
    "“I am serious. And don't call me Shirley.” — Airplane!",
    "“It's alive! It's alive!” — Frankenstein",
    "“Say hello to my little friend!” — Scarface",
    "“You had me at 'hello.'” — Jerry Maguire",
    "“They're here...” — Poltergeist",
    "“I'm walking here!” — Midnight Cowboy",
    "“Toto, I've a feeling we're not in Kansas anymore.” — The Wizard of Oz",
    "“You make me want to be a better man.” — As Good as It Gets",
    "“The stuff that dreams are made of.” — The Maltese Falcon",
    "“Carpe diem. Seize the day, boys.” — Dead Poets Society",
    "“It's not who I am underneath, but what I do that defines me.” — Batman Begins"
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const chainContainerRef = useRef(null);

  useEffect(() => {
    fetchNewGame(false);
  }, [mode]);

  useEffect(() => {
    if (chain.length > 0 && chain[chain.length - 1].name === goalActor?.name) {
      setGameOver(true);
      confetti();

      const links = (chain.length - 1) / 2;
      if (!bestLinkCount || links < bestLinkCount) {
        setBestLinkCount(links);
        localStorage.setItem("bestScore", links);
      }

      if (mode === "daily") {
        if (playerName && !submittedName) submitScore();
        fetchLeaderboard();
      }
    }
  }, [chain, goalActor]);

  const fetchNewGame = async (preserveStreak = false) => {
    setLoading(true);

    const url = mode === "daily" ? "/get-daily-actors" : "/get-random-actors";
    const res = await axios.get(`${BACKEND_URL}${url}`);
    setStartActor(res.data.start);
    setGoalActor(res.data.goal);
    setChain([res.data.start]);
    setGameOver(false);
    setActorInput("");
    setTitleInput("");
    setSuggestions([]);
    setSubmittedName(false);

    if (!preserveStreak) {
      setCurrentStreak(0);
      localStorage.setItem("streak", "0");
    }

    setLoading(false);

    if (mode === "daily") fetchLeaderboard();
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/get-daily-leaderboard`);
      setLeaderboard(res.data || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setLeaderboard([]);
    }
  };

  const handleInputChange = (e, type) => {
    const value = e.target.value;
    if (type === "actor") {
      setActorInput(value);
      setSuggestType("actor");
    } else {
      setTitleInput(value);
      setSuggestType("title");
    }

    if (value.length > 1) {
      axios
        .get(`${BACKEND_URL}/suggest?query=${value}&type=${type}`)
        .then((res) => setSuggestions(res.data));
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestType === "actor") {
      setActorInput(suggestion.name);
    } else {
      setTitleInput(suggestion.name);
    }
    setSuggestions([]);
  };

  const handleSubmit = async () => {
    if (!actorInput || !titleInput) return;

    const payload = {
      actor: chain[chain.length - 1].name,
      title: titleInput,
      next_actor: actorInput,
    };

    try {
      const res = await axios.post(`${BACKEND_URL}/validate-link`, payload);
      if (res.data.valid) {
        const movieItem = {
          name: titleInput,
          type: "title",
          image: res.data.poster,
        };
        const actorItem = {
          name: actorInput,
          type: "actor",
          image: res.data.actor_image,
        };
        setChain([...chain, movieItem, actorItem]);
        setTimeout(() => {
          const container = chainContainerRef.current;
          if (container) {
            container.scrollTo({
              left: container.scrollWidth - container.clientWidth,
              behavior: 'smooth'
            });
          }
        }, 100);

        setActorInput("");
        setTitleInput("");
        setSuggestions([]);
      } else {
        alert("Invalid connection.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUndo = () => {
    if (chain.length > 1) {
      setChain(chain.slice(0, -2));
    }
  };

  const handleShare = () => {
    const links = (chain.length - 1) / 2;
    const linkUrl = "https://screenlink-game-rohan-ranes-projects.vercel.app/";
    let message = "";

    if (mode === "daily") {
      message = `🧩 I completed today's Daily Link in ${links}️⃣ links!\nHow many can you do?\n\n${linkUrl}`;
    } else {
      message = `🎬 I just connected ${chain[0]?.name} to ${chain[chain.length - 1]?.name} in ${links}️⃣ 
links!\n\n`;
      for (let i = 0; i < chain.length; i++) {
        const icon = chain[i].type === "title" ? "🍿" : "🎭";
        message += `${icon} ${chain[i].name}\n`;
      }
      message += `\nTry playing now!\n${linkUrl}`;
    }

    navigator.clipboard.writeText(message)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(() => alert("Failed to copy message."));
  };

  const handlePlayAgain = () => {
    const newStreak = currentStreak + 1;
    setCurrentStreak(newStreak);
    localStorage.setItem("streak", newStreak.toString());
    fetchNewGame(true);
  };

  const submitScore = async () => {
    const steps = (chain.length - 1) / 2;
    await axios.post(`${BACKEND_URL}/submit-daily-score`, {
      player: playerName,
      steps: steps,
    });
    setSubmittedName(true);
  };

  if (loading) {
    return (
      <div className="App">
        <h1>ScreenLink</h1>
        <p className="loading-message">Loading actors...</p>
      </div>
    );
  }
  return (
    <div className="App">
      <button className="how-to-play-float" onClick={() => setShowHowToPlay(true)}>
        ?
      </button>

      <h1>ScreenLink</h1>
      <p className="description">
        Connect the <b>Start</b> actor to the <b>Goal</b> actor by entering movie titles and actors they’ve worked with — one link at a time.
      </p>

      <div className="mode-toggle">
        <button className={mode === "daily" ? "active" : ""} onClick={() => setMode("daily")}>Daily</button>
        <button className={mode === "free" ? "active" : ""} onClick={() => setMode("free")}>Free Play</button>
      </div>
          
      <div className="streak-bar">
        <b> Streak: {currentStreak} | Best Score: {bestLinkCount ?? "—"} </b>
      </div>

      <div className="actor-pair">
        {startActor && (
          <div className="actor-card">
            <img src={startActor.image} alt={startActor.name} />
            <div className="actor-label">
              <span className="label"><strong>Start:</strong></span> 
              <span className="name">{startActor.name}</span>
            </div>
          </div>
        )}
        {goalActor && (
          <div className="actor-card goal">
            <img src={goalActor.image} alt={goalActor.name} />
            <div className="actor-label">
              <span className="label"><strong>Goal:</strong></span> 
              <span className="name">{goalActor.name}</span>
            </div>
          </div>
        )}
      </div>

      {mode === "free" && (
        <div className="button-row-below">
          {gameOver ? (
            <button className="refresh-btn" onClick={handlePlayAgain}>Play Again</button>
          ) : (
            <button className="refresh-btn" onClick={() => fetchNewGame(false)}>Refresh</button>
          )}
        </div>
      )}  
        <div className="inputs-row">
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Enter Movie Title"
              value={titleInput}
              onChange={(e) => handleInputChange(e, "title")}
            />
            {suggestType === "title" && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((s, idx) => (
                  <div key={idx} className="suggestion" onClick={() => handleSuggestionClick(s)}>
                    {s.image && <img src={s.image} alt={s.name} />}
                    <span>{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Enter Actor Name"
              value={actorInput}
              onChange={(e) => handleInputChange(e, "actor")}
            />
            {suggestType === "actor" && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((s, idx) => (
                  <div key={idx} className="suggestion" onClick={() => handleSuggestionClick(s)}>
                    {s.image && <img src={s.image} alt={s.name} />}
                    <span>{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="submit-btn" onClick={handleSubmit}>Submit</button>
          <button className="undo-btn" onClick={handleUndo}>Undo</button>
        </div>
      
      <div className="chain-scroll-wrapper">
        <div className="chain-container" ref={chainContainerRef}>
          {chain.map((item, index) => (
            <React.Fragment key={index}>
              <div className={`chain-item 
               ${item.type === "actor" ? "actor" : ""}
                ${item.type === "title" ? "title" : ""}
                ${item.name === goalActor?.name ? "goal" : ""}
              `}>
                {item.image && <img src={item.image} alt={item.name} title={item.name} />}
              </div>
              {index < chain.length - 1 && (
                <div className={`arrow ${index === chain.length - 2 ? "animate" : ""}`}>⟶</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {gameOver && (
        <div className="share-row">
          <button className="share-btn" onClick={handleShare}>Share</button>
        </div>
      )}
      {copied && <p className="copied-msg">Copied to clipboard!</p>}

      {showLeaderboardModal && gameOver && mode === "daily" && !submittedName && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>🎉 You did it!</h3>
            <p>Enter your name to be added to today's leaderboard:</p>
            <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
            <div className="modal-buttons">
              <button onClick={submitScore}>Submit</button>
              <button onClick={() => setShowLeaderboardModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {mode === "daily" && leaderboard.length > 0 && (
        <div className="leaderboard">
          <h2>🏆 Daily Leaderboard</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Links</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard
                .filter(entry => entry !== null)
                .map((entry, idx) => (
                  <tr key={idx}>
                    <td>{["🥇 1st", "🥈 2nd", "🥉 3rd", "4th", "5th"][idx]} — {entry.player}</td>
                    <td>{entry.steps}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="footer-quote">{randomQuote}</p>
      {showHowToPlay && (
        <div className="modal-overlay" onClick={() => setShowHowToPlay(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setShowHowToPlay(false)}
            >
              ❌
            </button>
            <h2>How to Play</h2>
            <p>
              Connect the <strong>Start actor</strong> to the <strong>Goal actor</strong> by entering movie/TV titles and actors they’ve worked with — one at a time.
            </p>
            <ul style={{ textAlign: "left", paddingLeft: "20px" }}>
              <li>Using the Start Actor, enter a movie or TV title they have been in </li>
              <li>Then enter an actor from that title → Submit</li>
              <li>Repeat the pattern until you reach the Goal actor!</li>
            </ul>

            <div className="sample-chain">
              <strong>Example:</strong>

              <div className="sample-chain-row">
                <span className="actor">Emma Stone</span>
                <span className="arrow">→</span>
                <span className="movie">La La Land</span>
                <span className="arrow">→</span>
              </div>

              <div className="sample-chain-row">
                <span className="actor">Ryan Gosling</span>
                <span className="arrow">→</span>
                <span className="movie">Blade Runner 2049</span>
                <span className="arrow">→</span>
              </div>

              <div className="sample-chain-row">
                <span className="actor goal">Harrison Ford</span>
              </div>
            </div>
            
            <button className="got-it-btn" onClick={() => setShowHowToPlay(false)}>Got it!</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;