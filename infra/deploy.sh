[ -z "${APP_ID}" ] && echo "Environment not set!" && exit 2

# . .env

CDK_OUTPUT=./cdk.out/deploy-outputs.json
ENV_OUTPUT=./cdk.out/environment_variables

# npx cdk deploy --outputs-file ./cdk.out/deploy-outputs.json

# npx ts-node --prefer-ts-exts bin/zombi-infra.ts

# echo "# Generated environment variables" > ${ENV_OUTPUT}

echo ZZZ=`cat ${CDK_OUTPUT} | jq '.ZombiInfraBackendStack["ec2InstancePublicDnsName"]'`
# cat ${OUTPUT} 
