import { join } from "node:path";

import { Octokit } from "octokit";
import * as sodium from "libsodium-wrappers";

import config from "../config";
import { readFileSync } from "node:fs";

function encrypt(key: string, secret: string) {
    const binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL)
    const binsec = sodium.from_string(secret)
    const encBytes = sodium.crypto_box_seal(binsec, binkey)
    const output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)

    return output
}

sodium.ready.then(async () => {

    // https://docs.github.com/en/rest/overview/endpoints-available-for-github-apps?apiVersion=2022-11-28

    const owner = process.env.GITHUB_OWNER || "pin";
    const repo = process.env.GITHUB_REPO || "pon";
    const headers = {
        'X-GitHub-Api-Version': '2022-11-28'
    };

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const envVarsDir = join(__dirname, "../../.env");
    const envVarsLocalFile = `${envVarsDir}/local`;
    const envVarsContextFile = `${envVarsDir}/${config.context}`;

    const repository_id = (await octokit.request("GET /repos/{owner}/{repo}", { owner, repo }))?.data?.id;

    console.log(`Repository is ${repository_id}`);

    const { key, key_id } = (await octokit.request('GET /repos/{owner}/{repo}/actions/secrets/public-key', { owner, repo, headers }))?.data;

    console.log(`Public Key is ${key}`);

    await octokit.request('PUT /repos/{owner}/{repo}/environments/{environment_name}', { environment_name: 'local', owner, repo, headers });
    await octokit.request('PUT /repos/{owner}/{repo}/environments/{environment_name}', { environment_name: config.context, owner, repo, headers });

    await octokit.request('PUT /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}', {
        repository_id,
        environment_name: 'local',
        secret_name: 'LOCAL_ENV',
        encrypted_value: encrypt(key, readFileSync(envVarsLocalFile).toString()),
        key_id,
        headers
    });

    await octokit.request('PUT /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}', {
        repository_id,
        environment_name: config.context,
        secret_name: `${config.context.toUpperCase()}_ENV`,
        encrypted_value: encrypt(key, readFileSync(envVarsContextFile).toString()),
        key_id,
        headers
    });

    console.log(`Secrets created`);

});
