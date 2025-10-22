FROM eclipse-temurin:21-jdk AS runner

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /work/

COPY target/quarkus-app/lib/ /work/lib/
COPY target/quarkus-app/*.jar /work/
COPY target/quarkus-app/app/ /work/app/
COPY target/quarkus-app/quarkus/ /work/quarkus/

ENV LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu
ENV JNA_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu
ENV OMP_THREAD_LIMIT=4
ENV OMP_NUM_THREADS=4

CMD ["java", "-Dquarkus.profile=prod" , "-jar", "/work/quarkus-run.jar"]
