import random
import requests
import time
from flask import Flask, jsonify, request
from dotenv import load_dotenv
import os

load_dotenv()
TMDB_API_KEY = os.getenv("TMDB_API_KEY")

app = Flask(__name__)

@app.route('/')
def index():
    return '✅ Flask backend is running!'

# 🎭 Fixed list of 100 popular actor names
popular_actors = [
    "Zendaya", "Timothée Chalamet", "Florence Pugh", "Austin Butler", "Anya Taylor-Joy",
    "Tom Holland", "Sydney Sweeney", "Paul Mescal", "Emma Mackey", "Jacob Elordi",
    "Ana de Armas", "Chris Hemsworth", "Margot Robbie", "Michael B. Jordan",
    "Sadie Sink", "Pedro Pascal", "Jenna Ortega", "Robert Pattinson", "Emma Stone",
    "Ryan Gosling", "Jennifer Lawrence", "Simu Liu", "Ayo Edebiri", "Barry Keoghan",
    "Keke Palmer", "Josh O’Connor", "Rami Malek", "Tom Hiddleston", "Natalie Portman",
    "Jacob Tremblay", "Rachel Zegler", "Maya Hawke", "Andrew Garfield",
    "Lupita Nyong’o", "Chadwick Boseman", "Dakota Johnson", "Sebastian Stan",
    "Hailee Steinfeld", "Letitia Wright", "John Boyega", "Saoirse Ronan",
    "Adam Driver", "Jonathan Majors", "Paul Rudd", "Brie Larson", "Chris Evans",
    "Zoë Kravitz", "Miles Teller", "Jennifer Coolidge", "Jessica Chastain",
    "Viola Davis", "Jodie Comer", "Oscar Isaac", "Ben Barnes", "Rosamund Pike",
    "Mckenna Grace", "Elle Fanning", "Daisy Ridley", "Jamie Dornan", "Milo Ventimiglia",
    "Josh Hutcherson", "Karen Gillan", "Kaitlyn Dever", "Joey King", "Tyler James Williams",
    "Glen Powell", "Stephanie Hsu", "Maitreyi Ramakrishnan", "Reneé Rapp",
    "Caleb McLaughlin", "Noah Centineo", "Mason Gooding", "Lana Condor", "Jacob Batalon",
    "David Harbour", "Kate McKinnon", "Awkwafina", "John Krasinski", "Emily Blunt",
    "Cillian Murphy", "Greta Lee", "Ali Wong", "Dev Patel", "Zoe Saldaña",
    "Henry Golding", "Karen Fukuhara", "Bella Ramsey", "Kathryn Newton",
    "Jonathan Groff", "Ariana Greenblatt", "Rachel Sennott", "Meghann Fahy"
]

# 🎲 Randomly get a real actor name + image using TMDb search
def fetch_actor_data(name):
    url = f"https://api.themoviedb.org/3/search/person?api_key={TMDB_API_KEY}&query={name}"
    res = requests.get(url).json()
    results = res.get("results", [])

    if results:
        actor = results[0]
        profile_path = actor.get("profile_path")
        image_url = f"https://image.tmdb.org/t/p/w185{profile_path}" if profile_path else None
        return {"name": name, "image": image_url}
    return {"name": name, "image": None}

# 🧠 Random actor pair route
@app.route('/get-random-actors')
def get_random_actors():
    actor_names = random.sample(popular_actors, 2)
    actor1 = fetch_actor_data(actor_names[0])
    actor2 = fetch_actor_data(actor_names[1])
    return jsonify({"start": actor1, "goal": actor2})

# ✅ Validate actor-title connection using TMDb
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

        credits_url = f"https://api.themoviedb.org/3/{media_type}/{media_id}/credits?api_key={TMDB_API_KEY}"
        credits = requests.get(credits_url).json()
        cast = credits.get('cast', [])
        if any(c.get('name', '').strip().lower() == actor.strip().lower() for c in cast):
            return jsonify({"valid": True})
    return jsonify({"valid": False})

# 🔧 Simple test route
@app.route('/test-env')
def test_env():
    return jsonify({"TMDB_API_KEY": TMDB_API_KEY})

if __name__ == '__main__':
    from os import environ
    port = int(environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)

