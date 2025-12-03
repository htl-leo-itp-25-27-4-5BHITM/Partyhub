carladimmler@Carlas-MacBook-Air Partyhub % chmod +x build.sh                               
carladimmler@Carlas-MacBook-Air Partyhub % docker run --rm --name partyhub-app partyhub-app
carladimmler@Carlas-MacBook-Air Partyhub % docker login ghcr.io              
carladimmler@Carlas-MacBook-Air Partyhub % kubectl get pods                  
carladimmler@Carlas-MacBook-Air Partyhub % ./build.sh                        
carladimmler@Carlas-MacBook-Air Partyhub % kubectl delete -f k8s/backend.yaml
carladimmler@Carlas-MacBook-Air Partyhub % kubectl apply -f k8s/backend.yaml

