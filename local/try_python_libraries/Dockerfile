FROM python:3

EXPOSE 5000

ADD server.py /

RUN pip install flask
RUN pip install gensim

CMD ["python", "./server.py"]