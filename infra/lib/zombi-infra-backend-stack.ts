import config, { serverConfig, queueConfig, reactorConfig, websocketsConfig, filesConfig } from "../config";

// import path = require("node:path");
// import crypto from "node:crypto";

import { Duration, Stack, StackProps, Tag, Aspects, CfnOutput, RemovalPolicy, SecretValue } from 'aws-cdk-lib';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as elasticcache from "aws-cdk-lib/aws-elasticache";

import { CfnApi, CfnDeployment, CfnIntegration, CfnRoute, CfnStage } from "aws-cdk-lib/aws-apigatewayv2";
import { CfnAccessKey, Effect, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

import { Construct } from 'constructs';

function tagSubnets(subnets: ec2.ISubnet[], tagName: string, tagValue: string) {
  for (const subnet of subnets) {
    const tagExtended = `${tagValue}-${subnet.availabilityZone}`
    Aspects.of(subnet).add(new Tag(tagName, tagExtended));
  }
}

if (!process.env.APP_ID) {
  throw new Error("Environment not set. See .env file");
}

export class ZombiInfraBackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // --------------
    // S3 Code Bucket
    // --------------

    const CodeBucket = new s3.Bucket(this, config.s3.code.name, {
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    CodeBucket.grantRead(new iam.AccountRootPrincipal());

    new CfnOutput(this, 'CodeBucketName', { value: CodeBucket.bucketName });

    // --------------
    // S3 Docs Bucket
    // --------------

    const DocsBucket = new s3.Bucket(this, config.s3.docs.name, {
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html"
    });

    new CfnOutput(this, 'DocsBucketName', { value: DocsBucket.bucketName });
    new CfnOutput(this, 'DocsBucketWebsiteDomainName', { value: DocsBucket.bucketWebsiteDomainName });


    // ---
    // VPC
    // ---

    const vpc = new ec2.Vpc(this, config.vpc.name, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 1,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'private-subnet-1',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'public-subnet-1',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'isolated-subnet-1',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28,
        },
      ],
    });

    Aspects.of(vpc).add(new Tag('Name', config.vpc.name));

    tagSubnets(vpc.publicSubnets, 'Name', `public-subnet`);
    tagSubnets(vpc.privateSubnets, 'Name', `private-subnet`);
    tagSubnets(vpc.isolatedSubnets, 'Name', `isolated-subnet`);

    // ------------
    // RDS instance
    // ------------
    const dbInstance = new rds.DatabaseInstance(this, config.rds.name, {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14_6,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO,
      ),
      credentials: rds.Credentials.fromPassword(config.rds.username, SecretValue.unsafePlainText(config.rds.password)),
      multiAz: false,
      allocatedStorage: 100,
      maxAllocatedStorage: 200,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      backupRetention: Duration.days(0),
      deleteAutomatedBackups: true,
      removalPolicy: RemovalPolicy.DESTROY,
      deletionProtection: false,
      databaseName: config.rds.database,
      port: config.rds.port,
      publiclyAccessible: false,
    });

    const dbUrl = `postgresql://${config.rds.username}:${config.rds.password}@${dbInstance.instanceEndpoint.hostname}:${config.rds.port}/${config.rds.database}`

    new CfnOutput(this, 'dbEndpointUrl', { value: dbUrl });

    // --------------------
    // EC2 Bastion instance
    // --------------------
    const ec2InstanceSG = new ec2.SecurityGroup(this, `${config.ec2.bastion.name}-sg`, { vpc });

    ec2InstanceSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH connections from anywhere',
    );

    const ec2Instance = new ec2.Instance(this, config.ec2.bastion.name, {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: ec2InstanceSG,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      keyName: config.key.name,
    });

    dbInstance.connections.allowFrom(ec2Instance, ec2.Port.tcp(config.rds.port));

    new CfnOutput(this, `ec2InstancePublicDnsName`, { value: ec2Instance.instancePublicDnsName });

    // -------------
    // Redis cluster
    // -------------
    const redisSubnetGroup = new elasticcache.CfnSubnetGroup(this, `${config.redis.name}-sng`, {
      description: "Subnet group for the redis cluster",
      subnetIds: vpc.isolatedSubnets.map((ps) => ps.subnetId),
      cacheSubnetGroupName: `${config.redis.name}-sng`,
    });

    const redisSecurityGroup = new ec2.SecurityGroup(this, `${config.redis.name}-sg`, {
      vpc: vpc,
      allowAllOutbound: true,
      description: "Security group for the redis cluster",
    });

    const redisCache = new elasticcache.CfnCacheCluster(this, config.redis.name, {
      engine: "redis",
      cacheNodeType: "cache.t3.micro",
      numCacheNodes: 1,
      port: config.redis.port,
      clusterName: config.redis.name,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      cacheSubnetGroupName: redisSubnetGroup.ref,
      engineVersion: "6.2",
      preferredMaintenanceWindow: "fri:00:30-fri:01:30",
    });

    // redisCache.addDependsOn(redisSubnetGroup);
    redisCache.addDependency(redisSubnetGroup);

    const cacheUrl = `redis://${redisCache.attrRedisEndpointAddress}:${config.redis.port}`;

    new CfnOutput(this, `CacheEndpointUrl`, { value: cacheUrl });

    // -------
    // LAMBDAS
    // -------

    // Server Lambda

    const lambdaServerFunctionSG = new ec2.SecurityGroup(this, `${config.lambdas.server.name}-sg`, {
      vpc,
      allowAllOutbound: true,
      description: 'Security group for the Server Lambda',
    });

    const lambdaServerFunction = new lambda.Function(this, config.lambdas.server.name, {
      functionName: config.lambdas.server.name,
      runtime: config.lambdas.settings.runtime,
      vpc,
      securityGroups: [lambdaServerFunctionSG],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      memorySize: config.lambdas.server.memorySize,
      timeout: Duration.seconds(config.lambdas.server.timeout),
      handler: config.lambdas.server.handler,
      code: lambda.Code.fromInline(config.lambdas.settings.inlineCode),
      // code: lambda.Code.fromBucket(new s3.Bucket(), "2023_02_17.02_01_36_lambda-websockets-dev.zip"),
      environment: {
        ...serverConfig,
        ZOMBI_DB_URL: dbUrl,
        ZOMBI_CACHE_URL: cacheUrl
      },
    });

    const lambdaServerFunctionUrl = lambdaServerFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedOrigins: ["*"],
        maxAge: Duration.minutes(10)
      }
    });

    // Adding permission to Redis for the lambda
    redisSecurityGroup.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [lambdaServerFunctionSG],
      }),
      ec2.Port.tcp(config.redis.port),
      `Allow traffic on port ${config.redis.port} from the Lambda ${config.lambdas.server.name}`,
    );

    // Adding permission to RDS for the lambda
    dbInstance.connections.allowFrom(
      lambdaServerFunctionSG,
      ec2.Port.tcp(config.rds.port),
      `Allow traffic on port ${config.redis.port} from the Lambda ${config.lambdas.server.name}`
    );

    new CfnOutput(this, "lambdaServerFunctionName", { value: config.lambdas.server.name });
    new CfnOutput(this, "lambdaServerFunctionUrl", { value: lambdaServerFunctionUrl.url });
    new CfnOutput(this, "lambdaServerFunctionArn", { value: lambdaServerFunctionUrl.functionArn });

    // Queue Lambda

    const lambdaQueueFunctionSG = new ec2.SecurityGroup(this, `${config.lambdas.queue.name}-sg`, {
      vpc,
      allowAllOutbound: true,
      description: 'Security group for the Queue Lambda',
    });

    const lambdaQueueFunction = new lambda.Function(this, config.lambdas.queue.name, {
      functionName: config.lambdas.queue.name,
      runtime: config.lambdas.settings.runtime,
      vpc,
      securityGroups: [lambdaQueueFunctionSG],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      memorySize: config.lambdas.queue.memorySize,
      timeout: Duration.seconds(config.lambdas.queue.timeout),
      handler: config.lambdas.queue.handler,
      code: lambda.Code.fromInline(config.lambdas.settings.inlineCode),
      environment: {
        ...queueConfig,
        ZOMBI_DB_URL: dbUrl,
        ZOMBI_CACHE_URL: cacheUrl
      },
    });

    // We need the URL only to debug or test
    // const lambdaQueueFunctionUrl = lambdaQueueFunction.addFunctionUrl({
    //   authType: lambda.FunctionUrlAuthType.NONE,
    //   cors: {
    //     allowedMethods: [lambda.HttpMethod.ALL],
    //     allowedOrigins: ["*"],
    //     maxAge: Duration.minutes(10)
    //   }
    // });

    const lambdaQueueFunctionQueue = new sqs.Queue(this, `${config.lambdas.queue.name}-queue`, {
      visibilityTimeout: Duration.seconds(900)
    });

    const eventSource = new SqsEventSource(lambdaQueueFunctionQueue);
    lambdaQueueFunction.addEventSource(eventSource);

    // Adding permission to Redis for the lambda
    redisSecurityGroup.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [lambdaQueueFunctionSG],
      }),
      ec2.Port.tcp(config.redis.port),
      `Allow traffic on port ${config.redis.port} from the Lambda ${config.lambdas.queue.name}`,
    );

    // Adding permission to RDS for the lambda
    dbInstance.connections.allowFrom(
      lambdaQueueFunctionSG,
      ec2.Port.tcp(config.rds.port),
      `Allow traffic on port ${config.redis.port} from the Lambda ${config.lambdas.queue.name}`
    );

    new CfnOutput(this, "lambdaQueueFunctionName", { value: config.lambdas.queue.name });
    // new CfnOutput(this, "lambdaQueueFunctionUrl", { value: lambdaQueueFunctionUrl.url });
    new CfnOutput(this, "lambdaQueueFunctionArn", { value: lambdaQueueFunction.functionArn });

    // Reactor Lambda

    const lambdaReactorFunctionSG = new ec2.SecurityGroup(this, `${config.lambdas.reactor.name}-sg`, {
      vpc,
      allowAllOutbound: true,
      description: 'Security group for the Reactor Lambda',
    });

    const lambdaReactorFunction = new lambda.Function(this, config.lambdas.reactor.name, {
      functionName: config.lambdas.reactor.name,
      runtime: config.lambdas.settings.runtime,
      vpc,
      securityGroups: [lambdaReactorFunctionSG],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      memorySize: config.lambdas.reactor.memorySize,
      timeout: Duration.seconds(config.lambdas.reactor.timeout),
      handler: config.lambdas.reactor.handler,
      code: lambda.Code.fromInline(config.lambdas.settings.inlineCode),
      environment: {
        ...reactorConfig,
        ZOMBI_DB_URL: dbUrl,
        ZOMBI_CACHE_URL: cacheUrl
      },
    });

    // We need the URL only to debug or test
    // const lambdaReactorFunctionUrl = lambdaReactorFunction.addFunctionUrl({
    //   authType: lambda.FunctionUrlAuthType.NONE,
    //   cors: {
    //     allowedMethods: [lambda.HttpMethod.ALL],
    //     allowedOrigins: ["*"],
    //     maxAge: Duration.minutes(10)
    //   }
    // });

    const eventRule = new events.Rule(this, "every10MinutesRule", {
      schedule: events.Schedule.cron({ minute: "0/10" }),
    });

    // add the Lambda function as a target for the Event Rule
    eventRule.addTarget(
      new targets.LambdaFunction(lambdaReactorFunction, {
        event: events.RuleTargetInput.fromObject({ "source": "reactor", "type": "every10minutes", "token": config.lambdas.reactor.token }),
      })
    );

    // allow the Event Rule to invoke the Lambda function
    targets.addLambdaPermission(eventRule, lambdaReactorFunction)

    // Adding permission to Redis for the lambda
    redisSecurityGroup.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [lambdaReactorFunctionSG],
      }),
      ec2.Port.tcp(config.redis.port),
      `Allow traffic on port ${config.redis.port} from the Lambda ${config.lambdas.reactor.name}`,
    );

    // Adding permission to RDS for the lambda
    dbInstance.connections.allowFrom(
      lambdaReactorFunctionSG,
      ec2.Port.tcp(config.rds.port),
      `Allow traffic on port ${config.redis.port} from the Lambda ${config.lambdas.reactor.name}`
    );

    new CfnOutput(this, "lambdaReactorFunctionName", { value: config.lambdas.reactor.name });
    // new CfnOutput(this, "lambdaReactorFunctionUrl", { value: lambdaReactorFunctionUrl.url });
    new CfnOutput(this, "lambdaReactorFunctionArn", { value: lambdaReactorFunction.functionArn });

    // -----------------
    // Websockets Lambda
    // -----------------

    const lambdaWebsocketsFunctionApi = new CfnApi(this, `${config.lambdas.websockets.name}-api`, {
      name: `${config.lambdas.websockets.name}-api`,
      protocolType: "WEBSOCKET",
      routeSelectionExpression: "$request.body.action",
    });

    const lambdaWebsocketsFunctionSG = new ec2.SecurityGroup(this, `${config.lambdas.websockets.name}-sg`, {
      vpc,
      allowAllOutbound: true,
      description: 'Security group for the Websockets Lambda',
    });

    const lambdaWebsocketsFunction = new lambda.Function(this, config.lambdas.websockets.name, {
      functionName: config.lambdas.websockets.name,
      runtime: config.lambdas.settings.runtime,
      vpc,
      securityGroups: [lambdaWebsocketsFunctionSG],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      memorySize: config.lambdas.websockets.memorySize,
      timeout: Duration.seconds(config.lambdas.websockets.timeout),
      handler: config.lambdas.websockets.handler,
      code: lambda.Code.fromInline(config.lambdas.settings.inlineCode),
      environment: {
        ...websocketsConfig,
        ZOMBI_CACHE_URL: cacheUrl,
      },
      initialPolicy: [
        new PolicyStatement({
          actions: [
            'execute-api:ManageConnections'
          ],
          resources: [
            "arn:aws:execute-api:" + Stack.of(this).region + ":" + Stack.of(this).account + ":" + lambdaWebsocketsFunctionApi.ref + "/*"
          ],
          effect: Effect.ALLOW,
        })
      ],
    });

    // access role for the socket api to access the socket lambda
    const policy = new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [lambdaWebsocketsFunction.functionArn],
      actions: ["lambda:InvokeFunction"]
    });

    const role = new Role(this, `${config.lambdas.websockets.name}-iam-role`, {
      assumedBy: new ServicePrincipal("apigateway.amazonaws.com")
    });

    role.addToPolicy(policy);

    // lambda integration
    const connectIntegration = new CfnIntegration(this, "connect-lambda-integration", {
      apiId: lambdaWebsocketsFunctionApi.ref,
      integrationType: "AWS_PROXY",
      integrationUri: "arn:aws:apigateway:" + Stack.of(this).region + ":lambda:path/2015-03-31/functions/" + lambdaWebsocketsFunction.functionArn + "/invocations",
      credentialsArn: role.roleArn,
    });
    const disconnectIntegration = new CfnIntegration(this, "disconnect-lambda-integration", {
      apiId: lambdaWebsocketsFunctionApi.ref,
      integrationType: "AWS_PROXY",
      integrationUri: "arn:aws:apigateway:" + Stack.of(this).region + ":lambda:path/2015-03-31/functions/" + lambdaWebsocketsFunction.functionArn + "/invocations",
      credentialsArn: role.roleArn
    });
    const messageIntegration = new CfnIntegration(this, "message-lambda-integration", {
      apiId: lambdaWebsocketsFunctionApi.ref,
      integrationType: "AWS_PROXY",
      integrationUri: "arn:aws:apigateway:" + Stack.of(this).region + ":lambda:path/2015-03-31/functions/" + lambdaWebsocketsFunction.functionArn + "/invocations",
      credentialsArn: role.roleArn
    });

    const connectRoute = new CfnRoute(this, "connect-route", {
      apiId: lambdaWebsocketsFunctionApi.ref,
      routeKey: "$connect",
      authorizationType: "NONE",
      target: "integrations/" + connectIntegration.ref,
    });

    const disconnectRoute = new CfnRoute(this, "disconnect-route", {
      apiId: lambdaWebsocketsFunctionApi.ref,
      routeKey: "$disconnect",
      authorizationType: "NONE",
      target: "integrations/" + disconnectIntegration.ref,
    });

    const messageRoute = new CfnRoute(this, "default-route", {
      apiId: lambdaWebsocketsFunctionApi.ref,
      routeKey: "$default",
      authorizationType: "NONE",
      target: "integrations/" + messageIntegration.ref,
    });

    const deployment = new CfnDeployment(this, `${config.lambdas.websockets.name}-deployment`, {
      apiId: lambdaWebsocketsFunctionApi.ref
    });

    new CfnStage(this, `${config.lambdas.websockets.name}-stage`, {
      apiId: lambdaWebsocketsFunctionApi.ref,
      autoDeploy: true,
      deploymentId: deployment.ref,
      stageName: config.context
    });

    deployment.node.addDependency(connectRoute);
    deployment.node.addDependency(disconnectRoute);
    deployment.node.addDependency(messageRoute);

    // Adding permission to Redis for the lambda
    redisSecurityGroup.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [lambdaWebsocketsFunctionSG],
      }),
      ec2.Port.tcp(config.redis.port),
      `Allow traffic on port ${config.redis.port} from the Lambda ${config.lambdas.websockets.name}`,
    );

    new CfnOutput(this, "lambdaWebsocketsFunctionName", { value: config.lambdas.websockets.name });
    new CfnOutput(this, "lambdaWebsocketsFunctionApiEndpoint", { value: lambdaWebsocketsFunctionApi.attrApiEndpoint });

    // Files Lambda

    const lambdaFilesFunctionSG = new ec2.SecurityGroup(this, `${config.lambdas.files.name}-sg`, {
      vpc,
      allowAllOutbound: true,
      description: 'Security group for the Files Lambda',
    });

    const lambdaFilesFunction = new lambda.Function(this, config.lambdas.files.name, {
      functionName: config.lambdas.files.name,
      runtime: config.lambdas.settings.runtime,
      vpc,
      securityGroups: [lambdaFilesFunctionSG],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      memorySize: config.lambdas.files.memorySize,
      timeout: Duration.seconds(config.lambdas.files.timeout),
      handler: config.lambdas.files.handler,
      code: lambda.Code.fromInline(config.lambdas.settings.inlineCode),
      environment: {
        ...filesConfig,
        ZOMBI_DB_URL: dbUrl,
        ZOMBI_CACHE_URL: cacheUrl
      },
    });

    // We need the URL only to debug or test
    // const lambdaFilesFunctionUrl = lambdaFilesFunction.addFunctionUrl({
    //   authType: lambda.FunctionUrlAuthType.NONE,
    //   cors: {
    //     allowedMethods: [lambda.HttpMethod.ALL],
    //     allowedOrigins: ["*"],
    //     maxAge: Duration.minutes(10)
    //   }
    // });

    // Adding permission to Redis for the lambda
    redisSecurityGroup.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [lambdaFilesFunctionSG],
      }),
      ec2.Port.tcp(config.redis.port),
      `Allow traffic on port ${config.redis.port} from the Lambda ${config.lambdas.files.name}`,
    );

    // Adding permission to RDS for the lambda
    dbInstance.connections.allowFrom(
      lambdaFilesFunctionSG,
      ec2.Port.tcp(config.rds.port),
      `Allow traffic on port ${config.redis.port} from the Lambda ${config.lambdas.files.name}`
    );

    new CfnOutput(this, "lambdaFilesFunctionName", { value: config.lambdas.files.name });
    // new CfnOutput(this, "lambdaFilesFunctionUrl", { value: lambdaFilesFunctionUrl.url });
    new CfnOutput(this, "lambdaFilesFunctionArn", { value: lambdaFilesFunction.functionArn });

    // -------
    // CI User
    // -------

    // User
    const ciUser = new iam.User(this, config.ci.userName, {
      userName: config.ci.userName
    });

    new CfnOutput(this, "ciUserUserName", { value: ciUser.userName });

    ciUser.addToPolicy(new iam.PolicyStatement({
      resources: [
        lambdaServerFunction.functionArn,
        lambdaQueueFunction.functionArn,
        lambdaReactorFunction.functionArn,
        lambdaWebsocketsFunction.functionArn,
        lambdaFilesFunction.functionArn,
      ],
      actions: ["lambda:UpdateFunctionCode"],
    }));

    ciUser.addToPolicy(new iam.PolicyStatement({
      resources: [`${CodeBucket.bucketArn}/*`],
      actions: ["s3:GetObject", "s3:PutObject"],
    }));

    // Access Keys
    const ciAccessKey = new CfnAccessKey(this, config.ci.accessKey, {
      userName: ciUser.userName,
    });

    new CfnOutput(this, 'ciAccessKeysecretAccessKey', { value: ciAccessKey.attrSecretAccessKey });
    new CfnOutput(this, "ciAccessKeyId", { value: ciAccessKey.ref });
  }
}
