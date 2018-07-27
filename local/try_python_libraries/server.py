from flask import Flask, request
from gensim_summarizer import summarize as gensim_summarize
import json

app = Flask(__name__)

@app.route('/summarize', methods=['POST'])
def summarize_text():
  text_to_summarize = request.get_json()['text']

  result = {
    'gensim': gensim_summarize(text_to_summarize)
  }

  return json.dumps(result)

if __name__ == "__main__":
    app.run(host='0.0.0.0')