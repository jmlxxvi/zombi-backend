#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ZombiInfraBackendStack } from '../lib/zombi-infra-backend-stack';

const app = new cdk.App();
new ZombiInfraBackendStack(app, 'ZombiInfraBackendStack');
