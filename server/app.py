from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import requests
import os

app = Flask(__name__)
CORS(app)

TMDB_API_KEY = os.getenv('TMDB_API_KEY')

ACTORS = [
    "Jennifer Lawrence", "Timothée Chalamet", "Florence Pugh", "Pedro Pascal",
    "Jenna Ortega", "Cillian Murphy", "Natalie Portman", "Margot Robbie",
    "Denzel Washington", "Emma Stone", "Ryan Gosling", "Tom Hanks",
    "Zendaya", "Robert Pattinson", "Millie Bobby Brown", "Saoirse Ronan",
    "Adam Driver", "Anya Taylor-Joy", "Paul Mescal", "Daniel Kaluuya",
    "Austin Butler", "Jessica Chastain", "Oscar Isaac", "Barry Keoghan",
    "Greta Lee", "Rachel Zegler", "Jacob Elordi", "Lily-Rose Depp",
    "Paul Dano", "Carey Mulligan", "Sadie Sink", "Stephanie Hsu",
    "Daniel Radcliffe", "Mckenna Grace", "Keke Palmer", "Brian Tyree Henry",
    "Maya Hawke", "Chloe Bailey", "Anthony Ramos", "Ayo Edebiri",
    "Logan Lerman", "Thomasin McKenzie", "Sophie Thatcher", "Maitreyi Ramakrishnan",
    "Letitia Wright", "Bella Ramsey", "David Tennant", "Emma D’Arcy",
    "Jodie Comer", "Tyler James Williams", "Simu Liu", "Hailee Steinfeld",
    "Kaitlyn Dever", "Tom Holland", "Hunter Schafer", "Jeremy Allen White",
    "Finn Wolfhard", "Rachel Sennott", "Josh Hutcherson", "Sebastian Stan",
    "Sydney Sweeney", "Donald Glover", "Kaley Cuoco", "Jacob Tremblay",
    "Rami Malek", "Joseph Quinn", "Melissa Barrera", "Mason Gooding",
    "Ncuti Gatwa", "Phoebe Dynevor", "Justice Smith", "Milo Manheim",
    "Lana Condor", "Xolo Maridueña", "Isabela Merced", "Jabari Banks",
    "Noah Jupe", "Miles Teller", "Nicholas Hoult", "Olivia Cooke",
    "Katherine Langford", "Joshua Bassett", "Devery Jacobs", "Evan Peters",
    "Dominique Fishback", "Caleb McLaughlin", "Zazie Beetz", "Aubrey Plaza",
    "Alexander Skarsgård", "Natasha Lyonne", "Ken Jeong", "Awkwafina",
    "John Boyega", "Lakeith Stanfield", "Ben Barnes", "Lily James"
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
    actor = data.get('actor')
    title = data.get('title')

    search_url = f"https://api.themoviedb.org/3/search/multi?query={title}&api_key={TMDB_API_KEY}"
    search_response = requests.get(search_url).json()

    for media in search_response.get('results', [])[:5]:
        media_id = media['id']
        media_type = media['media_type']
        if media_type not in ['movie', 'tv']:
            continue

        credits_url = 
f"https://api.themoviedb.org/3/{media_type}/{media_id}/credits?api_key={TMDB_API_KEY}"
        credits = requests.get(credits_url).json()
        cast = credits.get('cast', [])

        if any(c.get('name', '').strip().lower() == actor.strip().lower() for c in cast):
            poster = f"https://image.tmdb.org/t/p/w185{media.get('poster_path')}" if 
media.get('poster_path') else None
            return jsonify({"valid": True, "poster": poster})

    return jsonify({"valid": False})

@app.route('/suggest')
def suggest():
    query = request.args.get('query')
    type_ = request.args.get('type')  # "actor" or "title"
    if not query or not type_:
        return jsonify([])

    search_type = 'person' if type_ == 'actor' else 'multi'
    url = f"https://api.themoviedb.org/3/search/{search_type}?query={query}&api_key={TMDB_API_KEY}"
    response = requests.get(url).json()

    if type_ == 'actor':
        results = [{"name": res['name']} for res in response.get('results', []) if 
res.get('known_for_department') == 'Acting']
    else:
        results = [
            {"name": res.get('title') or res.get('name'), "image": 
f"https://image.tmdb.org/t/p/w185{res['poster_path']}"}
            for res in response.get('results', []) if res.get('media_type') in ['movie', 'tv'] and 
res.get('poster_path')
        ]

    return jsonify(results[:5])

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
