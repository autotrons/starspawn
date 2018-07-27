FROM python:3

EXPOSE 5000

ADD . /

RUN pip install flask
RUN pip install gensim

CMD ["python", "./server.py"]