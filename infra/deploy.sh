# [ -z "${APP_ID}" ] && echo "Environment not set!" && exit 2

# . .env

npx ts-node ./custom/deploy.ts

exit 0

OUTPUT_DIR=./cdk.out

CDK_OUTPUT=${OUTPUT_DIR}/deploy-outputs.json
ENV_OUTPUT=${OUTPUT_DIR}/environment_variables

ZZZ=`cat ./config.ts | jq '.ZombiInfraBackendStack["ec2InstancePublicDnsName"]'`

aws ec2 create-key-pair --key-name ec2-key-dev --query 'KeyMaterial' --output text > ec2-key-dev.pem
chmod 0400  ec2-key-dev.pem

# npx cdk deploy --outputs-file ./cdk.out/deploy-outputs.json

# npx ts-node --prefer-ts-exts bin/zombi-infra.ts

# echo "# Generated environment variables" > ${ENV_OUTPUT}

echo ZZZ=`cat ${CDK_OUTPUT} | jq '.ZombiInfraBackendStack["ec2InstancePublicDnsName"]'`
# cat ${OUTPUT} 
