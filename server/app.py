import random
import requests
import time
from flask_cors import CORS
from flask import Flask, jsonify, request
from dotenv import load_dotenv
import os

load_dotenv()
TMDB_API_KEY = os.getenv("TMDB_API_KEY")

app = Flask(__name__)
CORS(app, supports_credentials=True)

@app.route('/')
def index():
    return '✅ Flask backend is running!'

# 🎭 Fixed list of 100 popular actor names
popular_actors = [ ... ]  # (keep your full list here)

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

@app.route('/get-random-actors')
def get_random_actors():
    actor_names = random.sample(popular_actors, 2)
    actor1 = fetch_actor_data(actor_names[0])
    actor2 = fetch_actor_data(actor_names[1])
    return jsonify({"start": actor1, "goal": actor2})

# ✅ Enhanced validation with images
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

        poster_path = media.get('poster_path')
        poster_url = f"https://image.tmdb.org/t/p/w185{poster_path}" if poster_path else None

        credits_url = f"https://api.themoviedb.org/3/{media_type}/{media_id}/credits?api_key={TMDB_API_KEY}"
        credits = requests.get(credits_url).json()
        cast = credits.get('cast', [])

        for c in cast:
            if c.get('name', '').strip().lower() == actor.strip().lower():
                actor_path = c.get('profile_path')
                actor_url = f"https://image.tmdb.org/t/p/w185{actor_path}" if actor_path else None
                return jsonify({
                    "valid": True,
                    "actorImage": actor_url,
                    "titleImage": poster_url
                })

    return jsonify({"valid": False})

# 🔍 Suggest endpoint for autosuggest
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
        results = [res['name'] for res in response.get('results', []) if res.get('known_for_department') 
== 'Acting']
    else:
        results = [res.get('title') or res.get('name') for res in response.get('results', []) if 
res.get('media_type') in ['movie', 'tv']]

    return jsonify(results[:5])

@app.route('/test-env')
def test_env():
    return jsonify({"TMDB_API_KEY": TMDB_API_KEY})

if __name__ == '__main__':
    from os import environ
    port = int(environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)

