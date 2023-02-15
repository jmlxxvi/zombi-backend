https://docs.aws.amazon.com/msk/latest/developerguide/msk-authentication.html 

KeyPass=mykey
CommonName=PePaKafkaAuthCN1
TopicName=mytopic

PrivateCAARN="arn:aws:acm-pca:us-east-1:686659205044:certificate-authority/087b8738-6b44-41f8-9b8c-ad990c2dc066"
ClusterARN="arn:aws:kafka:us-east-1:686659205044:cluster/TheBlackLambdaMSK/c230f004-4c80-412b-874e-db7e461a0a5c-11"
MSKBootstrap="b-1.theblacklambdamsk.zq6ow0.c11.kafka.us-east-1.amazonaws.com:9094,b-2.theblacklambdamsk.zq6ow0.c11.kafka.us-east-1.amazonaws.com:9094"
MSKZookeeper="z-2.theblacklambdamsk.zq6ow0.c11.kafka.us-east-1.amazonaws.com:2181,z-3.theblacklambdamsk.zq6ow0.c11.kafka.us-east-1.amazonaws.com:2181,z-1.theblacklambdamsk.zq6ow0.c11.kafka.us-east-1.amazonaws.com:2181"
CertificateARN="arn:aws:acm-pca:us-east-1:686659205044:certificate-authority/087b8738-6b44-41f8-9b8c-ad990c2dc066/certificate/1741ad1e0d1ad294fa50033df90dafc1"

sudo find / -name cacerts 2>/dev/null

cp /usr/lib/jvm/java-11-openjdk-amd64/lib/security/cacerts kafka.client.truststore.jks

aws kafka get-bootstrap-brokers --cluster-arn ${ClusterARN}

keytool -genkey -keystore kafka.client.keystore.jks -validity 300 -storepass ${KeyPass} -keypass ${KeyPass} -dname "CN=${CommonName}" -alias ${CommonName} -storetype pkcs12
keytool -keystore kafka.client.keystore.jks -certreq -file client-cert-sign-request -alias ${CommonName} -storepass ${KeyPass} -keypass ${KeyPass}

Change -----BEGIN NEW CERTIFICATE REQUEST----- with -----BEGIN CERTIFICATE REQUEST-----

aws acm-pca issue-certificate --certificate-authority-arn ${PrivateCAARN} --csr fileb://client-cert-sign-request --signing-algorithm "SHA256WITHRSA" --validity Value=300,Type="DAYS"

aws acm-pca get-certificate --certificate-authority-arn ${PrivateCAARN} --certificate-arn ${CertificateARN}

:%s/\\n/\r/g

keytool -keystore kafka.client.keystore.jks -import -file signed-certificate-from-acm -alias ${CommonName} -storepass ${KeyPass} -keypass ${KeyPass}

client.properties:

security.protocol=SSL
ssl.truststore.location=kafka.client.truststore.jks
ssl.keystore.location=kafka.client.keystore.jks
ssl.keystore.password=Your-Store-Pass
ssl.key.password=Your-Key-Pass

bin/kafka-topics.sh --create --zookeeper $zoo --replication-factor 2 --partitions 1 --topic ${TopicName}
bin/kafka-console-producer.sh --broker-list BootstrapBroker-String --topic ${TopicName} --producer.config client.properties
bin/kafka-console-consumer.sh --bootstrap-server ${MSKBootstrap} --topic ${TopicName} --consumer.config client.properties


Authorization
-------------

https://amazonmsk-labs.workshop.aws/en/securityencryption/tlsmauth/setup.html

export dn="User:CN=${CommonName}"

bin/kafka-acls.sh --authorizer-properties zookeeper.connect=${MSKZookeeper} --add --allow-principal "$dn" --operation Read --group=* --topic jmgtopic
bin/kafka-acls.sh --authorizer-properties zookeeper.connect=${MSKZookeeper} --add --allow-principal "$dn" --operation Read --operation Write --topic jmgtopic

bin/kafka-acls.sh --authorizer-properties zookeeper.connect=${MSKZookeeper} --remove --allow-principal "$dn" --operation Read --operation Write --topic jmgtopic
