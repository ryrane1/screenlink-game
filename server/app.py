from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import requests
import os

app = Flask(__name__)
CORS(app)

TMDB_API_KEY = os.getenv('TMDB_API_KEY')

ACTORS = [
    # Women
    "Zendaya", "Florence Pugh", "Emma Stone", "Margot Robbie", "Jennifer Lawrence",
    "Scarlett Johansson", "Anya Taylor-Joy", "Millie Bobby Brown", "Natalie Portman",
    "Saoirse Ronan", "Ana de Armas", "Sydney Sweeney", "Lupita Nyong'o", "Zendaya",
    "Jenna Ortega", "Emily Blunt", "Rachel Zegler", "Viola Davis", "Kristen Stewart",
    "Elizabeth Olsen", "Gal Gadot", "Tessa Thompson", "Jessica Chastain", "Michelle Yeoh",
    "Kate Winslet", "Emma Watson", "Hailee Steinfeld", "Ayo Edebiri", "Meryl Streep",
    "Reese Witherspoon", "Amy Adams", "Awkwafina", "Lily James", "Sophie Turner",
    "Maya Hawke", "Kaitlyn Dever", "Dakota Johnson", "Hunter Schafer", "Natalie Dyer",

    # Men
    "Timothée Chalamet", "Pedro Pascal", "Cillian Murphy", "Austin Butler", "Ryan Gosling",
    "Paul Mescal", "Tom Holland", "Robert Pattinson", "Adam Driver", "Leonardo DiCaprio",
    "Dwayne Johnson", "Chris Hemsworth", "Chris Evans", "Ryan Reynolds", "Chadwick Boseman",
    "Keanu Reeves", "Jason Momoa", "Oscar Isaac", "Andrew Garfield", "Tom Hiddleston",
    "Ben Affleck", "Jake Gyllenhaal", "Donald Glover", "Joseph Quinn", "Jamie Dornan",
    "Josh O'Connor", "Daniel Kaluuya", "Jeremy Allen White", "Noah Centineo", "Michael B. Jordan",
    "Daniel Radcliffe", "John Boyega", "Finn Wolfhard", "Gaten Matarazzo", "Joe Keery",
    "Sebastian Stan", "Henry Cavill", "Anthony Mackie", "Paul Rudd", "Matt Damon",

    # TV & Streaming stars
    "Steve Carell", "John Krasinski", "Penn Badgley", "Idris Elba", "David Harbour",
    "Natasha Lyonne", "Pedro Pascal", "Bella Ramsey", "Gael García Bernal", "Evan Peters"
]


@app.route('/get-random-actors')
def get_random_actors():
    start, goal = random.sample(ACTORS, 2)
    
    def get_image(name):
        url = f"https://api.themoviedb.org/3/search/person?query={name}&api_key={TMDB_API_KEY}"
        res = requests.get(url).json()
        results = res.get("results")
        if results:
            path = results[0].get("profile_path")
            return f"https://image.tmdb.org/t/p/w185{path}" if path else None
        return None

    return jsonify({
        "start": {"name": start, "image": get_image(start)},
        "goal": {"name": goal, "image": get_image(goal)}
    })

@app.route('/validate-link', methods=['POST'])
def validate_link():
    data = request.json
    actor = data.get('actor')  # current actor (used only for logic)
    title = data.get('title')
    next_actor = data.get('next_actor')  # the one we want to verify

    search_url = f"https://api.themoviedb.org/3/search/multi?query={title}&api_key={TMDB_API_KEY}"
    search_response = requests.get(search_url).json()

    for media in search_response.get('results', [])[:5]:
        media_id = media['id']
        media_type = media['media_type']
        if media_type not in ['movie', 'tv']:
            continue

        credits_url = f"https://api.themoviedb.org/3/{media_type}/{media_id}/credits?api_key={TMDB_API_KEY}"
        credits = requests.get(credits_url).json()
        cast = credits.get('cast', [])

        for c in cast:
            if c.get('name', '').strip().lower() == next_actor.strip().lower():
                poster = f"https://image.tmdb.org/t/p/w185{media.get('poster_path')}" if media.get('poster_path') else None
                actor_image = f"https://image.tmdb.org/t/p/w185{c.get('profile_path')}" if c.get('profile_path') else None
                return jsonify({"valid": True, "poster": poster, "actor_image": actor_image})

    return jsonify({"valid": False})

@app.route('/suggest')
def suggest():
    query = request.args.get('query')
    type_ = request.args.get('type')
    if not query or not type_:
        return jsonify([])

    search_type = 'person' if type_ == 'actor' else 'multi'
    url = f"https://api.themoviedb.org/3/search/{search_type}?query={query}&api_key={TMDB_API_KEY}"
    response = requests.get(url).json()

    if type_ == 'actor':
        results = [{"name": res['name']} for res in response.get('results', []) if res.get('known_for_department') == 'Acting']
    else:
        results = [
            {"name": res.get('title') or res.get('name'), "image": f"https://image.tmdb.org/t/p/w185{res['poster_path']}"}
            for res in response.get('results', []) if res.get('media_type') in ['movie', 'tv'] and 
res.get('poster_path')
        ]

    return jsonify(results[:5])

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
