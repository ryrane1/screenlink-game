from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import random
import os
import datetime

app = Flask(__name__)
CORS(app)

TMDB_API_KEY = os.getenv("TMDB_API_KEY")

actors = [
    "Leonardo DiCaprio", "Brad Pitt", "Tom Hanks", "Robert Downey Jr.",
    "Chris Hemsworth", "Scarlett Johansson", "Jennifer Lawrence", "Denzel Washington",
    "Margot Robbie", "Timothée Chalamet", "Florence Pugh", "Ana de Armas",
    "Zendaya", "Tom Holland", "Emma Stone", "Ryan Gosling",
    "Christian Bale", "Cillian Murphy", "Matt Damon", "Ben Affleck",
    "Gal Gadot", "Emily Blunt", "Natalie Portman", "Robert Pattinson",
    "Saoirse Ronan", "Jake Gyllenhaal", "Michael B. Jordan", "Daniel Kaluuya",
    "Viola Davis", "Jamie Foxx", "Oscar Isaac", "Jessica Chastain",
    "Paul Mescal", "Pedro Pascal", "Austin Butler", "Anya Taylor-Joy",
    "Idris Elba", "Taron Egerton", "John Boyega", "Chris Evans",
    "Miles Teller", "Rachel Zegler", "Millie Bobby Brown", "Jenna Ortega",
    "Bryan Cranston", "Aaron Paul", "Tom Cruise", "Keanu Reeves",
    "Winona Ryder", "Kate Winslet", "Emily Watson", "Carey Mulligan",
    "Rosamund Pike", "Rami Malek", "Andrew Garfield", "Joseph Gordon-Levitt",
    "Zoe Saldaña", "Ethan Hawke", "Jeffrey Wright", "Lakeith Stanfield",
    "Awkwafina", "Simu Liu", "Michelle Yeoh", "Hong Chau",
    "Brendan Fraser", "Barry Keoghan", "Jodie Comer", "Michael Fassbender",
    "Greta Lee", "Steven Yeun", "Joaquin Phoenix", "Christian Slater",
    "Hayley Atwell", "Reese Witherspoon", "Amy Adams", "Chadwick Boseman",
    "Benedict Cumberbatch", "Elisabeth Moss", "Josh Brolin", "Glen Powell",
    "Dakota Johnson", "Jason Momoa", "Jeremy Renner", "Hugh Jackman",
    "Anne Hathaway", "Matthew McConaughey", "Bryce Dallas Howard", "Chris Pine",
    "Paul Rudd", "Daniel Craig", "Lupita Nyong'o", "Helen Mirren",
    "Morgan Freeman", "Anthony Hopkins", "Meryl Streep", "Kate Hudson",
    "Naomi Watts", "Tilda Swinton", "Forest Whitaker", "Don Cheadle"
]

@app.route("/")
def index():
    return "✅ Flask backend is running!"

@app.route("/get-random-actors")
def get_random_actors():
    selected = random.sample(actors, 2)
    start = selected[0]
    goal = selected[1]

    def get_actor_data(name):
        url = f"https://api.themoviedb.org/3/search/person?query={name}&api_key={TMDB_API_KEY}"
        res = requests.get(url).json()
        result = res.get("results", [{}])[0]
        image = f"https://image.tmdb.org/t/p/w185{result.get('profile_path')}" if result.get("profile_path") else None
        return {"name": name, "id": result.get("id"), "image": image}

    start_data = get_actor_data(start)
    goal_data = get_actor_data(goal)

    return jsonify({"start": start_data, "goal": goal_data})

@app.route("/get-daily-actors")
def get_daily_actors():
    today = datetime.date.today().isoformat()
    random.seed(today)
    selected = random.sample(actors, 2)
    start = selected[0]
    goal = selected[1]

    def get_actor_data(name):
        url = f"https://api.themoviedb.org/3/search/person?query={name}&api_key={TMDB_API_KEY}"
        res = requests.get(url).json()
        result = res.get("results", [{}])[0]
        image = f"https://image.tmdb.org/t/p/w185{result.get('profile_path')}" if result.get("profile_path") else None
        return {"name": name, "id": result.get("id"), "image": image}

    start_data = get_actor_data(start)
    goal_data = get_actor_data(goal)

    return jsonify({"start": start_data, "goal": goal_data})

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
    app.run(host="0.0.0.0", port=10000)

