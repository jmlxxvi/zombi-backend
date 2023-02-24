import { join } from "node:path";
import { writeFileSync, statSync, mkdirSync, readFileSync } from "node:fs";

import { execSync } from "node:child_process";

import config from "../config";

(async function () {
    const CDKOUT = join(__dirname, "../cdk.out");

    const OutputFile = `${CDKOUT}/deploy-outputs.json`

    const keyFilesDir = join(__dirname, "../../keys");
    const keyPairName = config.key.name;
    const keyPairFile = `${keyFilesDir}/${keyPairName}.pem`

    const envVarsDir = join(__dirname, "../../.env");
    const envVarsLocalFile = `${envVarsDir}/local`;
    const envVarsContextFile = `${envVarsDir}/${config.context}`;


    let ok = true;

    try {
        execSync(`aws ec2 create-key-pair --key-name ${keyPairName} --query 'KeyMaterial' --output text >> ${keyPairFile}`, { stdio: 'inherit' });
    } catch (error: any) {
        if (error.status === 254) { // 254 means the keypair already exists.
            console.log("KeyPair file already exists");
        } else {
            ok = false;
            console.log(error);
        }
    }

    if (ok) {
        try {
            execSync(`npx cdk deploy --require-approval never --outputs-file ${OutputFile}`, { stdio: 'inherit' });
        } catch (error) {
            ok = false;
            console.log(error);
        }
    }

    if (ok) {
        console.log("Creating env vars file...");

        const out = (await import(OutputFile)).ZombiInfraBackendStack;

        let evc = "# Environment variables. You will use this on the CI repository.\n";

        evc += `export NODE_ENV="${config.context}"\n`;
        evc += `export ZOMBI_CONTEXT="${config.context}"\n`;
        evc += `export ZOMBI_DB_URL="${out.dbEndpointUrl}"\n`;
        evc += `export ZOMBI_DB_DEFAULT_SCHEMA="app_sys"\n`;
        evc += `export ZOMBI_CACHE_URL="${out.CacheEndpointUrl}"\n`;
        evc += `export ZOMBI_CLIENT_ENDPOINT="${out.lambdaServerFunctionUrl}"\n`;
        evc += `export ZOMBI_LAMBDA_NAME_MICROSERVER="${out.lambdaServerFunctionName}"\n`;
        evc += `export ZOMBI_LAMBDA_NAME_QUEUE="${out.lambdaQueueFunctionName}"\n`;
        evc += `export ZOMBI_LAMBDA_NAME_REACTOR="${out.lambdaReactorFunctionName}"\n`;
        evc += `export ZOMBI_LAMBDA_NAME_WEBSOCKETS="${out.lambdaWebsocketsFunctionName}"\n`;
        evc += `export ZOMBI_LAMBDA_URL_WEBSOCKETS="${out.lambdaWebsocketsFunctionApiEndpoint}"\n`;
        evc += `export ZOMBI_LAMBDA_NAME_FILES="${out.lambdaFilesFunctionName}"\n`;
        evc += `export ZOMBI_CODE_BUCKET="${out.CodeBucketName}"\n`;
        evc += `export ZOMBI_DOCS_BUCKET="${out.DocsBucketName}"\n`;
        evc += `export ZOMBI_DOCS_WEBSITE="${out.DocsBucketWebsiteDomainName}"\n`;
        evc += `export ZOMBI_SERVER_TIMEOUT="30000"\n`;
        evc += `export ZOMBI_SERVER_SEND_ERROR_NOTIFICATIONS="no"\n`;
        evc += `export ZOMBI_SERVER_MAX_MEMORY_ALARM="80"\n`;
        evc += `export ZOMBI_STORAGE_PATH="/tmp"\n`;
        evc += `export ZOMBI_STATS_ENABLED="yes"\n`;
        evc += `export ZOMBI_STATS_MEMORY_CHECK_INTERVAL="300"\n`;
        evc += `export ZOMBI_LOG_LEVEL="TRACE"\n`;
        evc += `export ZOMBI_LOG_SHOW_TIMESTAMP="yes"\n`;
        evc += `export ZOMBI_LOG_SHOW_ICONS="yes"\n`;
        evc += `export ZOMBI_AUTH_MODULE_ACCESS="yes"\n`;
        evc += `export ZOMBI_HIDE_SERVER_ERRORS="no"\n`;
        evc += `export ZOMBI_SYSTEM_USER_ID=""\n`;
        evc += `export ZOMBI_ADMIN_GROUP_ID=""\n`;
        evc += `export ZOMBI_LOG_ARGUMENTS="yes"\n`;
        evc += `export ZOMBI_TEST_USER_NAME=""\n`;
        evc += `export ZOMBI_TEST_USER_PASSWORD=""\n`;

        evc += `export AWS_ACCESS_KEY_ID="${out.ciAccessKeyId}"\n`;
        evc += `export AWS_SECRET_ACCESS_KEY="${out.ciAccessKeysecretAccessKey}"\n`;
        evc += `export AWS_DEFAULT_REGION="${out.defaultRegion}"\n`;

        evc += `export BASTION_HOST="${out.ec2InstancePublicDnsName}"\n`;
        evc += `export BASTION_SSH_KEY="${readFileSync(keyPairFile)}"\n`;

        let evl = "# Local Environment variables. You will use this on the CI repository.\n";

        evl += `export NODE_ENV="development"\n`;
        evl += `export ZOMBI_CONTEXT="local"\n`;
        evl += `export ZOMBI_DB_URL="postgresql://postgres:postgres@localhost:5432/postgres"\n`;
        evl += `export ZOMBI_DB_DEFAULT_SCHEMA="app_sys"\n`;
        evl += `export ZOMBI_CACHE_URL="redis://localhost:6379"\n`;
        evl += `export ZOMBI_CLIENT_ENDPOINT="http://localhost:8000"\n`;
        evl += `export ZOMBI_SERVER_TIMEOUT="30000"\n`;
        evl += `export ZOMBI_SERVER_SEND_ERROR_NOTIFICATIONS="no"\n`;
        evl += `export ZOMBI_SERVER_MAX_MEMORY_ALARM="80"\n`;
        evl += `export ZOMBI_STORAGE_PATH="/tmp"\n`;
        evl += `export ZOMBI_STATS_ENABLED="yes"\n`;
        evl += `export ZOMBI_STATS_MEMORY_CHECK_INTERVAL="300"\n`;
        evl += `export ZOMBI_LOG_LEVEL="TRACE"\n`;
        evl += `export ZOMBI_LOG_SHOW_TIMESTAMP="yes"\n`;
        evl += `export ZOMBI_LOG_SHOW_ICONS="yes"\n`;
        evl += `export ZOMBI_AUTH_MODULE_ACCESS="yes"\n`;
        evl += `export ZOMBI_HIDE_SERVER_ERRORS="no"\n`;
        evl += `export ZOMBI_SYSTEM_USER_ID="3f0a91b2-7d9d-4ced-bac7-608d278620cd"\n`;
        evl += `export ZOMBI_ADMIN_GROUP_ID="5a228dec-7689-47c8-bfb7-cab1400cad7b"\n`;
        evl += `export ZOMBI_LOG_ARGUMENTS="yes"\n`;
        evl += `export ZOMBI_TEST_USER_NAME="system"\n`;
        evl += `export ZOMBI_TEST_USER_PASSWORD="manager"\n`;

        try { mkdirSync(envVarsDir); } catch (error) { }
        try { mkdirSync(keyFilesDir); } catch (error) { }

        try { writeFileSync(envVarsLocalFile, evl); } catch (error) { console.error(error); }
        try { writeFileSync(envVarsContextFile, evc); } catch (error) { console.error(error); }

    }

    if (ok) {
        console.log("Process done, please check the following files:");
        console.log("1", keyPairFile);
        console.log("2", envVarsLocalFile);
        console.log("3", envVarsContextFile);
    }
})();





