body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #021a13;
  color: white;
}

.App {
  text-align: center;
  padding: 30px 20px;
}

h1 {
  color: #33ff99;
  font-size: 2.5rem;
  margin-bottom: 30px;
}

.start-goal-container {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
  margin-bottom: 30px;
}

.actor-box {
  background-color: #063220;
  border: 2px solid #33ff99;
  border-radius: 10px;
  padding: 20px;
  width: 220px;
  box-shadow: 0 0 10px #33ff99;
}

.actor-box img {
  width: 120px;
  height: 160px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 10px;
}

.actor-box strong {
  display: block;
  margin-top: 10px;
  font-size: 1.1rem;
}

.input-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 20px 0;
}

.input-box {
  position: relative;
}

input[type="text"] {
  padding: 10px;
  border: 1px solid #33ff99;
  border-radius: 6px;
  font-size: 16px;
  width: 200px;
  background-color: #012117;
  color: white;
}

input::placeholder {
  color: #aaa;
}

button {
  padding: 10px 20px;
  background-color: #00cc66;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}

button:hover {
  background-color: #00b359;
}

.chain-container {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 30px;
  gap: 10px;
}

.chain-box {
  background-color: #063220;
  border: 1px solid #33ff99;
  border-radius: 8px;
  padding: 10px;
  width: 120px;
  text-align: center;
  color: #fff;
}

.chain-box img {
  width: 80px;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 5px;
}

.suggestions-box {
  position: absolute;
  top: 40px;
  left: 0;
  width: 100%;
  background-color: #012117;
  border: 1px solid #33ff99;
  border-radius: 4px;
  z-index: 10;
  max-height: 160px;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 255, 153, 0.2);
}

.suggestion-item {
  padding: 8px 12px;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
}

.suggestion-item:hover {
  background-color: #145c45;
}

.steps {
  margin-top: 20px;
  font-size: 1.2rem;
  font-weight: bold;
}

.play-again-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #1aff66;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  color: #000;
}

.play-again-btn:hover {
  background-color: #00e65c;
}

