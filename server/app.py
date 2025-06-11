from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import random
import os
import json
import base64
from datetime import datetime, date
import pytz
import firebase_admin
from firebase_admin import credentials, db

app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": [
        "http://localhost:3000",
        "https://screenlink-game-rohan-ranes-projects.vercel.app"
    ]
}})

TMDB_API_KEY = os.getenv("TMDB_API_KEY")

# 🔐 Load Firebase credentials from environment variable
key_b64 = os.getenv("FIREBASE_KEY_B64")
key_json = json.loads(base64.b64decode(key_b64))
cred = credentials.Certificate(key_json)
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://screen-link-2025-default-rtdb.firebaseio.com/'  # <-- replace this
})

actors = [  # (unchanged actor list)
    "Scarlett Johansson", "Robert Downey Jr.", "Zoe Saldaña", "Chris Pratt",
    "Tom Cruise", "Chris Hemsworth", "Vin Diesel", "Dwayne Johnson", "Bradley Cooper",
    "Chris Evans", "Tom Hanks", "Johnny Depp", "Tom Holland", "Mark Ruffalo",
    "Emma Watson", "Will Smith", "Don Cheadle", "Dave Bautista", "Jeremy Renner",
    "Harrison Ford", "Daniel Radcliffe", "Rachel Sennott", "Elizabeth Olsen",
    "Steve Carell", "Benedict Cumberbatch", "Jack Black", "Dove Cameron", "Hugh Jackman",
    "Chadwick Boseman", "Amanda Seyfried", "Sebastian Stan", "Leonardo DiCaprio", "Matt Damon",
    "Sofia Carson", "Tom Hiddleston", "Brad Pitt", "Paul Bettany", "Angelina Jolie",
    "Eddie Murphy", "Ryan Reynolds", "Kristen Bell", "Ted Danson", "Mckenna Grace",
    "Nicole Kidman", "Ben Stiller", "Jason Statham", "Nicolas Cage", "Aubrey Plaza",
    "Jim Carrey", "Idris Elba", "Gwyneth Paltrow", "Mark Wahlberg", "Jennifer Lawrence",
    "Rachel McAdams", "Christian Bale", "Cameron Diaz", "Keanu Reeves", "Natalie Portman",
    "Paul Rudd", "Josh Gad", "Julia Roberts", "Brie Larson", "Sandra Bullock",
    "Martin Freeman", "Adam Sandler", "Ben Affleck", "Helena Bonham Carter", "Ralph Fiennes",
    "Sylvester Stallone", "Lupita Nyong'o", "Owen Wilson", "Adam Driver", "Michelle Rodriguez",
    "Denzel Washington", "George Clooney", "Daniel Craig", "Orlando Bloom", "Daisy Ridley",
    "Morgan Freeman", "Robert Pattinson", "Robin Williams", "Jesse Eisenberg", "Anthony Mackie",
    "Will Ferrell", "Kevin Hart", "Mel Gibson", "Steven Yeun", "Seth Rogen",
    "Anna Kendrick", "Shia LaBeouf", "Margot Robbie", "Jason Momoa", "Emma Stone",
    "Meryl Streep", "Blake Lively", "Reece Witherspoon", "Channing Tatum"
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
    pacific = pytz.timezone('US/Pacific')
    today_seed = datetime.now(pacific).strftime("%Y-%m-%d")
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

@app.route("/get-easy-options", methods=["POST"])
def get_easy_options():
    data = request.get_json()
    current_actor = data.get("current_actor")
    goal_actor = data.get("goal_actor")

    if not current_actor or not goal_actor:
        return jsonify([])

    def get_actor_id(name):
        url = f"https://api.themoviedb.org/3/search/person?query={name}&api_key={TMDB_API_KEY}"
        res = requests.get(url).json().get("results", [])
        return res[0]["id"] if res else None

    def get_credits(actor_id):
        movies = requests.get(
            f"https://api.themoviedb.org/3/person/{actor_id}/movie_credits?api_key={TMDB_API_KEY}"
        ).json().get("cast", [])
        tv = requests.get(
            f"https://api.themoviedb.org/3/person/{actor_id}/tv_credits?api_key={TMDB_API_KEY}"
        ).json().get("cast", [])

        filtered = []
        for credit in movies + tv:
            title = credit.get("title") or credit.get("name", "")
            if not title:
                continue
            
            content_type = "movie" if "title" in credit else "tv"
            details_url = f"https://api.themoviedb.org/3/{content_type}/{credit['id']}?api_key={TMDB_API_KEY}"
            details = requests.get(details_url).json()

            genres = [g["name"].lower() for g in details.get("genres", [])]
            if any(bad in genres for bad in ["talk", "news", "reality", "variety"]):
                continue
            filtered.append(credit)

        return sorted(filtered, key=lambda x: x.get("popularity", 0), reverse=True)


    def get_costars(credit):
        content_id = credit["id"]
        content_type = "movie" if "title" in credit else "tv"
        credit_url = (
            f"https://api.themoviedb.org/3/{content_type}/{content_id}/credits?api_key={TMDB_API_KEY}"
        )
        cast = requests.get(credit_url).json().get("cast", [])
        return [a.get("name") for a in cast if a.get("name")]

    # IDs
    current_id = get_actor_id(current_actor)
    goal_id = get_actor_id(goal_actor)
    if not current_id or not goal_id:
        return jsonify([])

    current_credits = get_credits(current_id)
    goal_credits = get_credits(goal_id)

    # Get goal's known co-stars
    goal_costars = set()
    for credit in goal_credits[:15]:  # limit for performance
        for name in get_costars(credit):
            goal_costars.add(name)

    suggestions = []
    added_names = set()
    guaranteed_goal_link = None

    for credit in current_credits:
        if len(suggestions) >= 5:
            break

        title = credit.get("title") or credit.get("name")
        if not title or title in added_names:
            continue

        # Add the movie/show title
        suggestions.append({"name": title, "type": "title"})
        added_names.add(title)

        # Get co-stars from this credit
        cast = get_costars(credit)
        for name in cast:
            if name == current_actor or name in added_names:
                continue
            actor_entry = {"name": name, "type": "actor"}
            added_names.add(name)

            if name in goal_costars and not guaranteed_goal_link:
                guaranteed_goal_link = actor_entry  # save this to force into list
            else:
                suggestions.append(actor_entry)
            break  # just one co-star per title for brevity

    # Insert guaranteed helpful actor if available
    if guaranteed_goal_link and guaranteed_goal_link not in suggestions:
        suggestions.insert(0, guaranteed_goal_link)

    return jsonify(suggestions[:5])

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

    today = datetime.now(pytz.timezone('US/Pacific')).strftime("%Y-%m-%d")
    ref = db.reference(f"leaderboards/{today}")
    current = ref.get() or []

    current.append({"player": player, "steps": steps, "duration": duration})
    current = sorted(current, key=lambda x: (x["steps"], x["duration"]))[:5]
    ref.set(current)

    return jsonify({"message": "Score submitted to Firebase ✅"})

@app.route("/get-daily-leaderboard")
def get_daily_leaderboard():
    today = datetime.now(pytz.timezone('US/Pacific')).strftime("%Y-%m-%d")
    ref = db.reference(f"leaderboards/{today}")
    return jsonify(ref.get() or [])

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)

