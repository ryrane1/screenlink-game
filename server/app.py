from flask import Flask, request, jsonify
import json
import random
from collections import deque
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

actors = [
    "Leonardo DiCaprio", "Tom Hanks", "Meryl Streep", "Denzel Washington", "Brad Pitt",
    "Natalie Portman", "Christian Bale", "Scarlett Johansson", "Robert De Niro", "Jennifer Lawrence",
    "Matt Damon", "Julia Roberts", "Johnny Depp", "Cate Blanchett", "Morgan Freeman",
    "Angelina Jolie", "Joaquin Phoenix", "Emma Stone", "Tom Cruise", "Viola Davis",
    "Anthony Hopkins", "Anne Hathaway", "Ryan Gosling", "Saoirse Ronan", "Hugh Jackman",
    "Florence Pugh", "Michael Fassbender", "Amy Adams", "Jake Gyllenhaal", "Keanu Reeves",
    "Daniel Kaluuya", "Margot Robbie", "Timothée Chalamet", "Rami Malek", "Rachel McAdams",
    "Zendaya", "Adam Driver", "Chris Evans", "Robert Downey Jr.", "Gal Gadot",
    "Daniel Radcliffe", "Emma Watson", "Ben Affleck", "Tilda Swinton", "Elizabeth Olsen",
    "Oscar Isaac", "Chadwick Boseman", "Taron Egerton", "Anya Taylor-Joy", "Paul Mescal",
    "Awkwafina", "Jamie Foxx", "Pedro Pascal", "Keke Palmer", "Jessica Chastain",
    "Dev Patel", "Michael B. Jordan", "Tom Hardy", "Cillian Murphy", "Idris Elba",
    "Bryan Cranston", "Lupita Nyong'o", "Sam Rockwell", "Rooney Mara", "Bill Skarsgård",
    "Domhnall Gleeson", "John Boyega", "Andrew Garfield", "Rosamund Pike", "Brie Larson",
    "Joseph Gordon-Levitt", "Lakeith Stanfield", "Jodie Comer", "Jeffrey Wright", "Javier Bardem",
    "Michelle Yeoh", "Hong Chau", "Diego Luna", "Steven Yeun", "Ken Watanabe",
    "Benicio Del Toro", "Noomi Rapace", "Gael García Bernal", "Kristen Stewart", "Robert Pattinson",
    "Eddie Redmayne", "Zoe Kravitz", "Emily Blunt", "Chris Hemsworth", "Chris Pratt",
    "Miles Teller", "Hailee Steinfeld", "Aaron Taylor-Johnson", "Paul Dano", "Brian Tyree Henry",
    "Daniel Craig", "Mads Mikkelsen", "Willem Dafoe", "Mahershala Ali", "Jared Leto"
]

# Load popular actor list
with open("popular_actors.json") as f:
    popular_actors = json.load(f)

# Load cast_movies.json
with open("cast_movies.json") as f:
    cast_movies = json.load(f)

# Load movie_cast.json
with open("movie_cast.json") as f:
    movie_cast = json.load(f)

@app.route("/get-random-actors")
def get_random_actors():
    start, goal = random.sample(popular_actors, 2)
    return jsonify({"start": start, "goal": goal})

@app.route("/autosuggest")
def autosuggest():
    query = request.args.get("query", "").lower()
    search_type = request.args.get("type")

    results = []
    if search_type == "actor":
        results = [
            {"name": cm["name"], "id": cm["id"], "image": cm["image"]}
            for cm in cast_movies
            if query in cm["name"].lower()
        ][:5]
    elif search_type == "title":
        results = [
            {"name": mc["name"], "id": mc["id"], "image": mc["image"]}
            for mc in movie_cast
            if query in mc["name"].lower()
        ][:5]
    return jsonify(results)

@app.route("/get-shortest-path")
def get_shortest_path():
    start_id = str(request.args.get("startId"))
    goal_id = str(request.args.get("goalId"))

    visited = set()
    queue = deque([(start_id, [], "actor")])

    while queue:
        current, path, mode = queue.popleft()
        if str(current) == str(goal_id) and mode == "actor":
            return jsonify({"path": path})

        if (current, mode) in visited:
            continue
        visited.add((current, mode))

        if mode == "actor":
            cm = next((a for a in cast_movies if str(a["id"]) == str(current)), None)
            if cm:
                for movie in cm["known_for"]:
                    queue.append(
                        (
                            movie["id"],
                            path + [{"name": movie["title"], "type": "title"}],
                            "title",
                        )
                    )
        else:
            mc = next((m for m in movie_cast if str(m["id"]) == str(current)), None)
            if mc:
                for cast_member in mc["cast"]:
                    queue.append(
                        (
                            cast_member["id"],
                            path + [{"name": cast_member["name"], "type": "actor"}],
                            "actor",
                        )
                    )

    return jsonify({"path": []})

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)

