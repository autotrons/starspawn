from gensim.summarization.summarizer import summarize as gensim_summarize

def summarize(text_to_summarize):
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