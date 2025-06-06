from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import requests
import os

app = Flask(__name__)
CORS(app)

TMDB_API_KEY = os.getenv('TMDB_API_KEY')


ACTORS = [
    "Jennifer Lawrence", "Robert Downey Jr.", "Scarlett Johansson", "Dwayne Johnson", "Tom Hanks", 
    "Emma Stone", "Brad Pitt", "Leonardo DiCaprio", "Chris Evans", "Natalie Portman",
    "Margot Robbie", "Ryan Reynolds", "Zendaya", "Tom Holland", "Anne Hathaway",
    "Chris Hemsworth", "Angelina Jolie", "Christian Bale", "Gal Gadot", "Samuel L. Jackson",
    "Ryan Gosling", "Jessica Chastain", "Matt Damon", "Viola Davis", "Jake Gyllenhaal",
    "Florence Pugh", "Adam Driver", "Jodie Comer", "Millie Bobby Brown", "Cillian Murphy",
    "Bryan Cranston", "Pedro Pascal", "Daniel Kaluuya", "Austin Butler", "Timothée Chalamet",
    "Zoe Saldana", "Paul Rudd", "Hugh Jackman", "Oscar Isaac", "Elizabeth Olsen",
    "John Boyega", "Daniel Radcliffe", "Emma Watson", "Rupert Grint", "Meryl Streep",
    "Keanu Reeves", "Taron Egerton", "Jason Momoa", "Anya Taylor-Joy", "Rachel Zegler",
    "Sebastian Stan", "Anthony Mackie", "Jeremy Renner", "Hailee Steinfeld", "Chadwick Boseman",
    "Ben Affleck", "Michael B. Jordan", "Idris Elba", "Winona Ryder", "Paul Mescal",
    "Sadie Sink", "Finn Wolfhard", "Noah Schnapp", "Caleb McLaughlin", "David Harbour",
    "Gaten Matarazzo", "Joe Keery", "Maya Hawke", "Natalia Dyer", "Charlie Heaton",
    "Benedict Cumberbatch", "Andrew Garfield", "Tobey Maguire", "Joaquin Phoenix", "Jared Leto",
    "Jamie Lee Curtis", "Michelle Yeoh", "Brendan Fraser", "Kate Winslet", "Naomi Watts",
    "Robert Pattinson", "Kristen Stewart", "James McAvoy", "Sophie Turner", "Maisie Williams",
    "Kit Harington", "Peter Dinklage", "Lena Headey", "Emilia Clarke", "Millie Gibson",
    "Ncuti Gatwa", "Jenna Ortega", "Steve Carell", "Mindy Kaling", "John Krasinski",
    "Amy Adams", "Julia Roberts", "Anne Hathaway", "Reese Witherspoon", "Nicole Kidman",
    "Harrison Ford", "Mark Hamill", "Carrie Fisher", "Daisy Ridley", "Oscar Isaac",
    "Billy Dee Williams", "Donald Glover", "Alden Ehrenreich", "Phoebe Waller-Bridge",
    "Brie Larson", "Lupita Nyong'o", "Letitia Wright", "Danai Gurira", "Martin Freeman",
    "Andy Serkis", "Michael Sheen", "David Tennant", "Bill Skarsgård", "Alexander Skarsgård",
    "Charlize Theron", "Helen Mirren", "Ethan Hawke", "Josh Hutcherson", "Elizabeth Banks",
    "Woody Harrelson", "Donald Sutherland", "Stanley Tucci", "Jeffrey Wright", "Mahershala Ali",
    "Tessa Thompson", "Rami Malek", "Ben Kingsley", "Rosamund Pike", "Emily Blunt",
    "Dev Patel", "Halle Berry", "Sandra Bullock", "Kerry Washington", "Octavia Spencer",
    "Awkwafina", "Ken Jeong", "Simu Liu", "Gemma Chan", "Henry Golding",
    "Michelle Yeoh", "Stephen Yeun", "Ali Wong", "Jamie Foxx", "Chris Rock",
    "Kevin Hart", "Will Smith", "Jada Pinkett Smith", "Regina King", "Lakeith Stanfield"
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

        credits_url = 
f"https://api.themoviedb.org/3/{media_type}/{media_id}/credits?api_key={TMDB_API_KEY}"
        credits = requests.get(credits_url).json()
        cast = credits.get('cast', [])

        for c in cast:
            if c.get('name', '').strip().lower() == next_actor.strip().lower():
                poster = f"https://image.tmdb.org/t/p/w185{media.get('poster_path')}" if 
media.get('poster_path') else None
                actor_image = f"https://image.tmdb.org/t/p/w185{c.get('profile_path')}" if 
c.get('profile_path') else None
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
