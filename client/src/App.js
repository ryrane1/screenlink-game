// 👇 Paste this into App.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import confetti from "canvas-confetti";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function App() {
  const [mode, setMode] = useState("free");
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
  const [bestLinkCount, setBestLinkCount] = useState(() => Number(localStorage.getItem("bestScore")) || null);

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

    if (mode === "daily") fetchLeaderboard();
  };

  const fetchLeaderboard = async () => {
    const res = await axios.get(`${BACKEND_URL}/get-daily-leaderboard`);
    setLeaderboard(res.data);
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
      message = `🎬 I just connected ${chain[0]?.name} to ${chain[chain.length - 1]?.name} in ${links}️⃣ links!\n\n`;
      for (let i = 0; i < chain.length; i++) {
        const icon = chain[i].type === "title" ? "🎞️" : "🧍";
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
    fetchLeaderboard();
  };

  return (
    <div className="App">
      {/* Existing UI... */}
      
      {mode === "daily" && gameOver && submittedName && (
        <div className="leaderboard">
          <h2>🏆 Daily Leaderboard</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Links</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => (
                <tr key={idx}>
                  <td>{["1st", "2nd", "3rd", "4th", "5th"][idx]}</td>
                  <td>{entry.player}</td>
                  <td>{entry.steps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;

