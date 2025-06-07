from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import random
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

TMDB_API_KEY = os.getenv("TMDB_API_KEY")

# ✅ Replace or extend this list with your full list of 100 popular actors
actors = [
    "Timothée Chalamet", "Zendaya", "Florence Pugh", "Tom Holland",
    "Austin Butler", "Jacob Elordi", "Paul Mescal", "Sydney Sweeney",
    "Jennifer Lawrence", "Margot Robbie", "Emma Stone", "Ryan Gosling",
    "Anya Taylor-Joy", "Jenna Ortega", "Pedro Pascal", "Chris Evans",
    "Scarlett Johansson","Michael Cera", "Brie Larson", "Robert Pattinson", "Saoirse Ronan",
    "Jonathan Majors", "Hunter Schafer", "Keke Palmer", "Barry Keoghan",
    "Hailee Steinfeld", "Sadie Sink", "Glen Powell", "Miles Teller",
    "Zoë Kravitz", "Jacob Tremblay", "Josh O’Connor", "Natalie Portman",
    "Daniel Kaluuya", "Lakeith Stanfield", "Jodie Comer", "Daisy Edgar-Jones",
    "Angela Bassett", "Jessica Chastain", "Emily Blunt", "Viola Davis",
    "Tom Hanks", "Brad Pitt", "Leonardo DiCaprio", "Joaquin Phoenix",
    "Christian Bale", "Jake Gyllenhaal", "Chris Hemsworth", "Jason Momoa",
    "Paul Rudd", "Elizabeth Olsen", "Oscar Isaac", "Anthony Mackie",
    "Sebastian Stan", "Jeremy Renner", "Mark Ruffalo", "Chadwick Boseman",
    "Cillian Murphy", "Robert Downey Jr.", "Ben Affleck", "Matt Damon",
    "Adam Driver", "Tessa Thompson", "Josh Brolin", "Jeffrey Wright",
    "Zoe Saldana", "Michelle Yeoh", "Danai Gurira", "Letitia Wright",
    "Lupita Nyong’o", "Regé-Jean Page", "Idris Elba", "Dwayne Johnson",
    "John Krasinski", "Emily Ratajkowski", "Ana de Armas", "Blake Lively",
    "Ryan Reynolds", "Channing Tatum", "Jamie Foxx", "Hailee Steinfeld",
    "Steve Carell", "Bryce Dallas Howard", "Millie Bobby Brown", "Finn Wolfhard",
    "Noah Schnapp", "Caleb McLaughlin", "Gaten Matarazzo", "Maya Hawke",
    "Natalia Dyer", "Joe Keery", "Mckenna Grace", "Thomasin McKenzie",
    "Dev Patel", "Freddie Highmore", "Logan Lerman", "Nat Wolff",
    "Justice Smith", "Jharrel Jerome", "Kelvin Harrison Jr.", "Amandla Stenberg"
]


@app.route("/")
def index():
    return "✅ Flask backend is running!"

@app.route("/get-random-actors")
def get_random_actors():
    selected = random.sample(actors, 2)
    start = selected[0]
    goal = selected[1]
    return jsonify({
        "start": get_actor_data(start),
        "goal": get_actor_data(goal)
    })

@app.route("/get-daily-actors")
def get_daily_actors():
    today_seed = datetime.utcnow().strftime("%Y-%m-%d")
    rng = random.Random(today_seed)
    selected = rng.sample(actors, 2)
    start = selected[0]
    goal = selected[1]
    return jsonify({
        "start": get_actor_data(start),
        "goal": get_actor_data(goal)
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

    credits_url = f"https://api.themoviedb.org/3/person/{actor_id}/movie_credits?api_key={TMDB_API_KEY}"
    credits = requests.get(credits_url).json()
    cast = credits.get("cast", [])

    matched = [c for c in cast if c.get("title") == title or c.get("original_title") == title]

    for m in matched:
        movie_id = m["id"]
        movie_credits_url = f"https://api.themoviedb.org/3/movie/{movie_id}/credits?api_key={TMDB_API_KEY}"
        movie_credits = requests.get(movie_credits_url).json()
        cast_names = [a["name"] for a in movie_credits.get("cast", [])]

        if next_actor in cast_names:
            actor_image = next((a["profile_path"] for a in movie_credits["cast"] if a["name"] == next_actor), None)
            poster = m.get("poster_path")
            return jsonify({
                "valid": True,
                "actor_image": f"https://image.tmdb.org/t/p/w185{actor_image}" if actor_image else None,
                "poster": f"https://image.tmdb.org/t/p/w185{poster}" if poster else None
            })

    return jsonify({"valid": False})

@app.route("/get-shortest-path")
def get_shortest_path():
    start_id = request.args.get("startId")
    goal_id = request.args.get("goalId")

    if not start_id or not goal_id:
        return jsonify({"path": []})

    visited = set()
    queue = [(start_id, [])]
    while queue:
        current, path = queue.pop(0)
        if current in visited:
            continue
        visited.add(current)

        person_url = f"https://api.themoviedb.org/3/person/{current}?api_key={TMDB_API_KEY}"
        person_res = requests.get(person_url).json()
        name = person_res.get("name")
        profile = person_res.get("profile_path")
        image = f"https://image.tmdb.org/t/p/w185{profile}" if profile else None
        path = path + [{"name": name, "type": "actor", "image": image}]

        if current == goal_id:
            return jsonify({"path": path})

        credits_url = f"https://api.themoviedb.org/3/person/{current}/movie_credits?api_key={TMDB_API_KEY}"
        credits = requests.get(credits_url).json()
        cast = credits.get("cast", [])

        for c in cast[:5]:
            movie_id = c["id"]
            movie_name = c.get("title") or c.get("original_title")
            poster = c.get("poster_path")
            movie_image = f"https://image.tmdb.org/t/p/w185{poster}" if poster else None
            movie_item = {"name": movie_name, "type": "title", "image": movie_image}

            movie_credits_url = f"https://api.themoviedb.org/3/movie/{movie_id}/credits?api_key={TMDB_API_KEY}"
            movie_credits = requests.get(movie_credits_url).json()
            cast_members = movie_credits.get("cast", [])

            for cm in cast_members[:5]:
                if cm["id"] not in visited:
                    queue.append((str(cm["id"]), path + [movie_item]))

    return jsonify({"path": []})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)

