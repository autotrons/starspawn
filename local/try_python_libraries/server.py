from flask import Flask, request
from gensim.summarization.summarizer import summarize as gensim_summarize
import json

app = Flask(__name__)

@app.route('/summarize', methods=['POST'])
def summarize_text():
  text_to_summarize = request.get_json()['text']

  result = {
    'gensim': gensim_summarization(text_to_summarize)
  }

  return json.dumps(result)

def gensim_summarization(text_to_summarize):
  result = {'success': True, 'summary': '', 'error': ''}

  try:
    summary = gensim_summarize(text_to_summarize)

    if len(summary) == 0:
      raise Exception('Gensim needs more text in order to summarize.')

    result['summary'] = summary
    
  except Exception as exception:
    result['success'] = False
    result['error'] = str(exception)

  return result

if __name__ == "__main__":
    app.run(host='0.0.0.0')