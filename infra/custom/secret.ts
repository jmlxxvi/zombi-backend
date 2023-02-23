import { Octokit } from "octokit";
import * as sodium from "libsodium-wrappers";

function encrypt(key: string, secret: string) {
    const binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
    const binsec = sodium.from_string(secret);
    const encBytes = sodium.crypto_box_seal(binsec, binkey);
    const output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);

    console.log(`Encrypted output: ${output}`);

    return output;
}

(async function () {

    await sodium.ready;

    const owner = process.env.GITHUB_OWNER || "pin";
    const repo = process.env.GITHUB_REPO || "pon";
    const headers = { 'X-GitHub-Api-Version': '2022-11-28' };

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const repository_id = (await octokit.request("GET /repos/{owner}/{repo}", { owner, repo }))?.data?.id;

    console.log(`Repository is ${repository_id}`);

    const { key, key_id } = (await octokit.request('GET /repos/{owner}/{repo}/actions/secrets/public-key', { owner, repo, headers }))?.data;

    console.log(`Public Key: ${key}  ID: ${key_id}`);

    // await octokit.request('PUT /repos/{owner}/{repo}/environments/{environment_name}', { environment_name: 'local', owner, repo, headers });

    const response = await octokit.request('PUT /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}', {
        repository_id,
        environment_name: 'local',
        secret_name: 'MYSECRET',
        encrypted_value: encrypt(key, "HERE_I_AM"),
        key_id,
        headers
    });

    console.log(`Response status: ${response.status}`);

})();

