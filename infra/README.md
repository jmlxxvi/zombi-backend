# Welcome to your CDK TypeScript project

You should explore the contents of this project. It demonstrates a CDK app with an instance of a stack (`ZombiInfraStack`)
which contains an Amazon SQS queue that is subscribed to an Amazon SNS topic.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

npx cdk bootstrap

1 - Create key pair

# zombi-infra

To use this on different environments see: https://docs.aws.amazon.com/cdk/v2/guide/environments.html

Create and .env file on the directory this README file is and then set the following variables:
APP_ID: The name of the application or company
APP_CONTEXT: The context, either "development" or "production"
GITHUB_TOKEN: The token with access to GitHib Rest API
GITHUB_OWNER: The owner of the repository
GITHUB_REPO: The repository name
