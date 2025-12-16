carladimmler@Carlas-MacBook-Air ~ % mvn package
carladimmler@Carlas-MacBook-Air ~ % java -jar target/partyhub-1.0-SNAPSHOT-runner.jar
carladimmler@Carlas-MacBook-Air Partyhub % chmod +x build.sh                               
carladimmler@Carlas-MacBook-Air Partyhub % docker run --rm --name partyhub-app partyhub-app
carladimmler@Carlas-MacBook-Air Partyhub % docker login ghcr.io              
carladimmler@Carlas-MacBook-Air Partyhub % kubectl get pods                  
carladimmler@Carlas-MacBook-Air Partyhub % ./build.sh                        
carladimmler@Carlas-MacBook-Air Partyhub % kubectl delete -f k8s/backend.yaml
carladimmler@Carlas-MacBook-Air Partyhub % kubectl apply -f k8s/backend.yaml
carladimmler@Carlas-MacBook-Air ~ % leocloud get template nginx      


