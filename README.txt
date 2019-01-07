The POC software runs under a docker container. Steps to install and run the software are as follows:

1) Install Docker: https://docs.docker.com/docker-for-windows/install/
2) Run Docker: https://docs.microsoft.com/en-us/virtualization/hyper-v-on-windows/quick-start/enable-hyper-v
3) Chage Directory into the source code of POC Software (The directory which contains this README file).
4) Run Command: docker build -f Dockerfile-base -t base .
5) Run Command: docker build -t lem .
6) Run Command: docker run -p 4000:80 lem

Now browser to http://localhost:4000 using a browser to access demo.

To stop the docker container type: docker container stop $(docker ps -q)