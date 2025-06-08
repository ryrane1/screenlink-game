from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import random
import os
import json
from datetime import datetime, date

app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": [
        "http://localhost:3000",
        "https://screenlink-game-rohan-ranes-projects.vercel.app"
    ]
}})

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
LEADERBOARD_FILE = "daily_leaderboard.json"

def load_leaderboard():
    if os.path.exists(LEADERBOARD_FILE):
        with open(LEADERBOARD_FILE, "r") as f:
            return json.load(f)
    return {}

def save_leaderboard(data):
    with open(LEADERBOARD_FILE, "w") as f:
        json.dump(data, f, indent=2)

actors = [
    "Samuel L. Jackson", "Scarlett Johansson", "Robert Downey Jr.", "Zoe Saldana", "Chris Pratt",
    "Tom Cruise", "Chris Hemsworth", "Vin Diesel", "Dwayne Johnson", "Bradley Cooper",
    "Chris Evans", "Tom Hanks", "Johnny Depp", "Tom Holland", "Mark Ruffalo",
    "Emma Watson", "Will Smith", "Don Cheadle", "Dave Bautista", "Jeremy Renner",
    "Harrison Ford", "Karen Gillan", "Daniel Radcliffe", "Josh Brolin", "Elizabeth Olsen",
    "Steve Carell", "Benedict Cumberbatch", "Jack Black", "Rupert Grint", "Hugh Jackman",
    "Chadwick Boseman", "Letitia Wright", "Sebastian Stan", "Leonardo DiCaprio", "Matt Damon",
    "Danai Gurira", "Tom Hiddleston", "Brad Pitt", "Bruce Willis", "Paul Bettany",
    "Eddie Murphy", "Liam Neeson", "Ryan Reynolds", "Sam Worthington", "Pom Klementieff",
    "Benedict Wong", "Ben Stiller", "Jason Statham", "Ian McKellen", "Nicolas Cage",
    "Jim Carrey", "Idris Elba", "Gwyneth Paltrow", "Mark Wahlberg", "Jennifer Lawrence",
    "Ewan McGregor", "Christian Bale", "Cameron Diaz", "Keanu Reeves", "Natalie Portman",
    "Paul Rudd", "Josh Gad", "Julia Roberts", "Brie Larson", "Sandra Bullock",
    "Martin Freeman", "Adam Sandler", "Ben Affleck", "Robert De Niro", "Ralph Fiennes",
    "Sylvester Stallone", "Lupita Nyong'o", "Owen Wilson", "Adam Driver", "Michelle Rodriguez",
    "Denzel Washington", "George Clooney", "Daniel Craig", "Orlando Bloom", "Daisy Ridley",
    "Morgan Freeman", "Robert Pattinson", "Robin Williams", "John Boyega", "Anthony Mackie",
    "Will Ferrell", "Kevin Hart", "Mel Gibson", "Simon Pegg", "Seth Rogen",
    "Arnold Schwarzenegger", "Shia LaBeouf", "Keegan-Michael Key", "Jason Momoa", "Jude Law",
    "Meryl Streep", "Anthony Hopkins", "Evangeline Lilly", "Keira Knightley", "Channing Tatum"
]

@app.route("/")
def index():
    return "✅ Flask backend is running!"

@app.route("/get-random-actors")
def get_random_actors():
    selected = random.sample(actors, 2)
    return jsonify({
        "start": get_actor_data(selected[0]),
        "goal": get_actor_data(selected[1])
    })

@app.route("/get-daily-actors")
def get_daily_actors():
    today_seed = datetime.utcnow().strftime("%Y-%m-%d")
    rng = random.Random(today_seed)
    selected = rng.sample(actors, 2)
    return jsonify({
        "start": get_actor_data(selected[0]),
        "goal": get_actor_data(selected[1])
    })

def get_actor_data(name):
    url = f"https://api.themoviedb.org/3/search/person?query={name}&api_key={TMDB_API_KEY}"
    res = requests.get(url).json()
    result = res.get("results", [{}])[0]
    image = f"https://image.tmdb.org/t/p/w185{result.get('profile_path')}" if result.get("profile_path") else None
    return {"name": name, "id": result.get("id"), "image": image}

@app.route("/suggest")
def suggest():
    query = request.args.get("query")
    type_ = request.args.get("type")
    endpoint = "search/person" if type_ == "actor" else "search/multi"

    url = f"https://api.themoviedb.org/3/{endpoint}?query={query}&api_key={TMDB_API_KEY}"
    res = requests.get(url).json()
    results = res.get("results", [])

    suggestions = []
    for r in results:
        name = r.get("name") or r.get("title") or r.get("original_name")
        if not name:
            continue
        profile_path = r.get("profile_path") or r.get("poster_path")
        image = f"https://image.tmdb.org/t/p/w185{profile_path}" if profile_path else None
        suggestions.append({"name": name, "image": image})

    return jsonify(suggestions)

@app.route("/validate-link", methods=["POST"])
def validate_link():
    data = request.get_json()
    actor = data.get("actor")
    title = data.get("title")
    next_actor = data.get("next_actor")

    url = f"https://api.themoviedb.org/3/search/person?query={actor}&api_key={TMDB_API_KEY}"
    res = requests.get(url).json()
    actor_id = res["results"][0]["id"]

    movie_credits = requests.get(
        f"https://api.themoviedb.org/3/person/{actor_id}/movie_credits?api_key={TMDB_API_KEY}"
    ).json().get("cast", [])

    tv_credits = requests.get(
        f"https://api.themoviedb.org/3/person/{actor_id}/tv_credits?api_key={TMDB_API_KEY}"
    ).json().get("cast", [])

    cast = movie_credits + tv_credits

    for m in cast:
        content_id = m["id"]
        content_name = m.get("title") or m.get("name")
        content_type = "movie" if "title" in m else "tv"

        if content_name and title:
            if content_name.lower() not in title.lower() and title.lower() not in content_name.lower():
                continue
        else:
            continue

        if content_type == "tv":
            credits_url = f"https://api.themoviedb.org/3/tv/{content_id}/aggregate_credits?api_key={TMDB_API_KEY}"
            credits = requests.get(credits_url).json()
            cast_list = credits.get("cast", [])
            for a in cast_list:
                name = a.get("name") or a.get("original_name")
                if name and name.strip().lower() == next_actor.strip().lower():
                    actor_image = a.get("profile_path")
                    poster = m.get("poster_path")
                    return jsonify({
                        "valid": True,
                        "actor_image": f"https://image.tmdb.org/t/p/w185{actor_image}" if actor_image else None,
                        "poster": f"https://image.tmdb.org/t/p/w185{poster}" if poster else None
                    })
        else:
            credits_url = f"https://api.themoviedb.org/3/movie/{content_id}/credits?api_key={TMDB_API_KEY}"
            credits = requests.get(credits_url).json()
            cast_list = credits.get("cast", [])
            for a in cast_list:
                if a["name"].strip().lower() == next_actor.strip().lower():
                    actor_image = a.get("profile_path")
                    poster = m.get("poster_path")
                    return jsonify({
                        "valid": True,
                        "actor_image": f"https://image.tmdb.org/t/p/w185{actor_image}" if actor_image else None,
                        "poster": f"https://image.tmdb.org/t/p/w185{poster}" if poster else None
                    })

    return jsonify({"valid": False})

@app.route("/submit-daily-score", methods=["POST"])
def submit_daily_score():
    data = request.get_json()
    player = data.get("player")
    steps = data.get("steps")
    duration = data.get("duration", 0)

    if not player or steps is None:
        return jsonify({"error": "Missing fields"}), 400

    today = str(date.today())
    leaderboard = load_leaderboard()
    if today not in leaderboard:
        leaderboard[today] = []

    leaderboard[today].append({
        "player": player,
        "steps": steps,
        "duration": duration
    })

    leaderboard[today] = sorted(leaderboard[today], key=lambda x: (x["steps"], x["duration"]))[:5]
    save_leaderboard(leaderboard)
    return jsonify({"message": "Score submitted successfully"})

@app.route("/get-daily-leaderboard")
def get_daily_leaderboard():
    today = datetime.utcnow().strftime("%Y-%m-%d")
    leaderboard = load_leaderboard()
    return jsonify(leaderboard.get(today, []))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)

