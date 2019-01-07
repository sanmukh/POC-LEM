docker container stop $(docker ps -q)
docker build -t isage .
docker run -p 4000:80 isage
