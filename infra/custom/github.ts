import { join } from "node:path";

import { Octokit } from "octokit";
import * as sodium from "libsodium-wrappers";

import config from "../config";
import { readFileSync } from "node:fs";


const envVarsDir = join(__dirname, "../../.env");
const envVarsLocalFile = `${envVarsDir}/local`;
const envVarsContextFile = `${envVarsDir}/${config.context}`;

function encrypt(key: string, secret: string) {
    const binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
    const binsec = sodium.from_string(secret);
    const encBytes = sodium.crypto_box_seal(binsec, binkey);
    const output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);

    return output;
}

sodium.ready.then(async () => {

    // https://docs.github.com/en/rest/overview/endpoints-available-for-github-apps?apiVersion=2022-11-28

    const owner = process.env.GITHUB_OWNER || "pin";
    const repo = process.env.GITHUB_REPO || "pon";
    const headers = { 'X-GitHub-Api-Version': '2022-11-28' };

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const repository_id = (await octokit.request("GET /repos/{owner}/{repo}", { owner, repo }))?.data?.id;

    console.log(`Repository ID is ${repository_id}`);

    const { key, key_id } = (await octokit.request('GET /repos/{owner}/{repo}/actions/secrets/public-key', { owner, repo, headers }))?.data;

    console.log(`Public Key is ${key}`);
    console.log(`Public Key ID is ${key_id}`);

    const local_env_response = await octokit.request('PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}', {
        owner,
        repo,
        secret_name: 'LOCAL_ENV',
        encrypted_value: encrypt(key, readFileSync(envVarsLocalFile, { encoding: "utf8" })),
        key_id,
        headers
    });

    console.log(`Local environment response status: ${local_env_response.status}`);

    const context_env_response = await octokit.request('PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}', {
        owner,
        repo,
        secret_name: `${config.context.toUpperCase()}_ENV`,
        encrypted_value: encrypt(key, readFileSync(envVarsContextFile, { encoding: "utf8" })),
        key_id,
        headers
    });

    console.log(`Context environment response status: ${context_env_response.status}`);

    console.log(`Secrets created`);

});
