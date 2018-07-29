#!/usr/bin/env python
import warnings
warnings.filterwarnings("ignore", message="numpy.dtype size changed")
warnings.filterwarnings("ignore", message="numpy.ufunc size changed")

import spacy
nlp = spacy.load('en')
doc = nlp(u'This is a sentence.')
print(doc)