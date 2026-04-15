# AWS Setup Guide for Cloud IDE Platform

## Overview
This guide provides step-by-step instructions to set up the complete AWS infrastructure for the cloud IDE platform using AWS Fargate, EFS, VPC, ALB, and ECR.

## Architecture Components
- **VPC**: Virtual Private Cloud with public/private subnets
- **EFS**: Elastic File System for persistent storage
- **ECR**: Elastic Container Registry for Docker images
- **ECS Fargate**: Serverless container orchestration
- **ALB**: Application Load Balancer for routing traffic
- **Security Groups**: Network access control
- **IAM Roles**: Permissions for ECS tasks

---

## Prerequisites
- AWS Account with admin access
- AWS CLI installed and configured
- Docker installed locally
- Basic understanding of AWS services

---

## Step 1: Create VPC and Networking

### 1.1 Create VPC
1. Go to **VPC Console** → **Create VPC**
2. Configure:
   - **Name**: `cloud-ide-vpc`
   - **IPv4 CIDR block**: `10.0.0.0/16`
   - **IPv6 CIDR block**: No IPv6
   - **Tenancy**: Default
3. Click **Create VPC**

### 1.2 Create Internet Gateway
1. Go to **Internet Gateways** → **Create internet gateway**
2. Configure:
   - **Name**: `cloud-ide-igw`
3. Click **Create**
4. Select the IGW → **Actions** → **Attach to VPC**
5. Select `cloud-ide-vpc` → **Attach**

### 1.3 Create Subnets

#### Public Subnet 1
1. Go to **Subnets** → **Create subnet**
2. Configure:
   - **VPC**: `cloud-ide-vpc`
   - **Name**: `cloud-ide-public-subnet-1`
   - **Availability Zone**: `ap-south-1a` (or your region's first AZ)
   - **IPv4 CIDR block**: `10.0.1.0/24`
3. Click **Create subnet**

#### Public Subnet 2
1. Repeat above with:
   - **Name**: `cloud-ide-public-subnet-2`
   - **Availability Zone**: `ap-south-1b` (or your region's second AZ)
   - **IPv4 CIDR block**: `10.0.2.0/24`

### 1.4 Create Route Table
1. Go to **Route Tables** → **Create route table**
2. Configure:
   - **Name**: `cloud-ide-public-rt`
   - **VPC**: `cloud-ide-vpc`
3. Click **Create**
4. Select the route table → **Routes** tab → **Edit routes**
5. Add route:
   - **Destination**: `0.0.0.0/0`
   - **Target**: Select your Internet Gateway (`cloud-ide-igw`)
6. Click **Save changes**

### 1.5 Associate Subnets with Route Table
1. Select route table → **Subnet associations** tab → **Edit subnet associations**
2. Select both public subnets
3. Click **Save associations**

### 1.6 Enable Auto-assign Public IP
1. Go to **Subnets**
2. Select `cloud-ide-public-subnet-1`
3. **Actions** → **Edit subnet settings**
4. Check **Enable auto-assign public IPv4 address**
5. Click **Save**
6. Repeat for `cloud-ide-public-subnet-2`

**Save these values:**
```
VPC_ID=vpc-xxxxxxxxx
SUBNET_ID_1=subnet-012af762b773d0c29
SUBNET_ID_2=subnet-010f07e57a14a302e
```

---

## Step 2: Create Security Groups

### 2.1 Create ECS Security Group
1. Go to **Security Groups** → **Create security group**
2. Configure:
   - **Name**: `cloud-ide-ecs-sg`
   - **Description**: Security group for ECS Fargate tasks
   - **VPC**: `cloud-ide-vpc`

3. **Inbound rules**:
   - **Rule 1**: 
     - Type: Custom TCP
     - Port: 8080
     - Source: Custom → Select ALB security group (create ALB SG first, or add this later)
     - Description: Allow traffic from ALB
   
   - **Rule 2**:
     - Type: NFS
     - Port: 2049
     - Source: Custom → `10.0.0.0/16` (VPC CIDR)
     - Description: Allow EFS access

4. **Outbound rules**:
   - Keep default (All traffic to 0.0.0.0/0)

5. Click **Create security group**

### 2.2 Create ALB Security Group
1. Go to **Security Groups** → **Create security group**
2. Configure:
   - **Name**: `cloud-ide-alb-sg`
   - **Description**: Security group for Application Load Balancer
   - **VPC**: `cloud-ide-vpc`

3. **Inbound rules**:
   - **Rule 1**:
     - Type: HTTP
     - Port: 80
     - Source: 0.0.0.0/0
     - Description: Allow HTTP from internet
   
   - **Rule 2**:
     - Type: HTTPS
     - Port: 443
     - Source: 0.0.0.0/0
     - Description: Allow HTTPS from internet
   
   - **Rule 3**:
     - Type: Custom TCP
     - Port: 8080
     - Source: 0.0.0.0/0
     - Description: Allow direct access on 8080 (for testing)

4. **Outbound rules**:
   - Keep default

5. Click **Create security group**

### 2.3 Create EFS Security Group
1. Go to **Security Groups** → **Create security group**
2. Configure:
   - **Name**: `cloud-ide-efs-sg`
   - **Description**: Security group for EFS
   - **VPC**: `cloud-ide-vpc`

3. **Inbound rules**:
   - **Rule 1**:
     - Type: NFS
     - Port: 2049
     - Source: Custom → Select `cloud-ide-ecs-sg`
     - Description: Allow NFS from ECS tasks

4. Click **Create security group**

### 2.4 Update ECS Security Group
1. Go back to `cloud-ide-ecs-sg`
2. Edit inbound rules
3. Update Rule 1 source to `cloud-ide-alb-sg`
4. Save changes

**Save these values:**
```
ECS_SECURITY_GROUP_ID=sg-0425b39234dec81e7
ALB_SECURITY_GROUP_ID=sg-xxxxxxxxx
EFS_SECURITY_GROUP_ID=sg-xxxxxxxxx
```

---

## Step 3: Create EFS (Elastic File System)

### 3.1 Create EFS File System
1. Go to **EFS Console** → **Create file system**
2. Click **Customize**
3. Configure:
   - **Name**: `cloud-ide-efs`
   - **Availability and durability**: Regional
   - **Automatic backups**: Enabled (optional)
   - **Lifecycle management**: 30 days since last access (optional)
   - **Performance mode**: General Purpose
   - **Throughput mode**: Bursting
   - **Encryption**: Enable encryption at rest (recommended)
4. Click **Next**

### 3.2 Configure Network Access
1. **VPC**: Select `cloud-ide-vpc`
2. **Mount targets**:
   - **Availability Zone 1**: `ap-south-1a`
     - Subnet: `cloud-ide-public-subnet-1`
     - Security group: `cloud-ide-efs-sg`
   
   - **Availability Zone 2**: `ap-south-1b`
     - Subnet: `cloud-ide-public-subnet-2`
     - Security group: `cloud-ide-efs-sg`

3. Click **Next** → **Next** → **Create**

### 3.3 Create EFS Access Point
1. Go to your EFS file system → **Access points** tab
2. Click **Create access point**
3. Configure:
   - **Name**: `cloud-ide-shared-access-point`
   - **Root directory path**: `/workspace`
   - **POSIX user**:
     - User ID: `1000`
     - Group ID: `1000`
   - **Root directory creation permissions**:
     - Owner user ID: `1000`
     - Owner group ID: `1000`
     - Permissions: `755`
4. Click **Create access point**

**Save these values:**
```
EFS_FILE_SYSTEM_ID=fs-0cd014d72e65b1a47
EFS_ACCESS_POINT_ID=fsap-01e9a48723d7c7039
```

---

## Step 4: Create IAM Roles

### 4.1 Create ECS Task Execution Role
1. Go to **IAM Console** → **Roles** → **Create role**
2. Select **AWS service** → **Elastic Container Service**
3. Select **Elastic Container Service Task**
4. Click **Next**
5. Attach policies:
   - `AmazonECSTaskExecutionRolePolicy`
   - `AmazonElasticFileSystemClientReadWriteAccess`
6. Click **Next**
7. Configure:
   - **Role name**: `cloud-ide-ecs-task-execution-role`
   - **Description**: Allows ECS tasks to call AWS services
8. Click **Create role**

### 4.2 Create ECS Task Role
1. Go to **IAM Console** → **Roles** → **Create role**
2. Select **AWS service** → **Elastic Container Service**
3. Select **Elastic Container Service Task**
4. Click **Next**
5. Attach policies:
   - `AmazonElasticFileSystemClientReadWriteAccess`
   - Create custom policy for additional permissions (optional)
6. Click **Next**
7. Configure:
   - **Role name**: `cloud-ide-ecs-task-role`
   - **Description**: Allows ECS tasks to access AWS resources
8. Click **Create role**

**Save these values:**
```
TASK_EXECUTION_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/cloud-ide-ecs-task-execution-role
TASK_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/cloud-ide-ecs-task-role
```

---

## Step 5: Create ECR Repository

### 5.1 Create Repository
1. Go to **ECR Console** → **Repositories** → **Create repository**
2. Configure:
   - **Visibility**: Private
   - **Repository name**: `cloud-ide-ecr`
   - **Tag immutability**: Disabled
   - **Scan on push**: Enabled (optional)
   - **Encryption**: AES-256 (default)
3. Click **Create repository**

### 5.2 Build and Push Docker Image

#### Build the Image
```bash
cd aws-backend

# Build the image
docker build -t cloud-ide-ecr .
```

#### Authenticate Docker to ECR
```bash
# Get login command
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com
```

#### Tag and Push
```bash
# Tag the image
docker tag cloud-ide-ecr:latest ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/cloud-ide-ecr:latest

# Push to ECR
docker push ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/cloud-ide-ecr:latest
```

**Save these values:**
```
ECR_REPOSITORY_URI=ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/cloud-ide-ecr
IMAGE_URI=ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/cloud-ide-ecr:latest
```

---

## Step 6: Create Application Load Balancer

### 6.1 Create Target Group
1. Go to **EC2 Console** → **Target Groups** → **Create target group**
2. Configure:
   - **Target type**: IP addresses
   - **Target group name**: `cloud-ide-target-group`
   - **Protocol**: HTTP
   - **Port**: 8080
   - **VPC**: `cloud-ide-vpc`
   - **Protocol version**: HTTP1
   
3. **Health checks**:
   - **Health check protocol**: HTTP
   - **Health check path**: `/health`
   - **Advanced health check settings**:
     - Healthy threshold: 2
     - Unhealthy threshold: 3
     - Timeout: 5 seconds
     - Interval: 30 seconds
     - Success codes: 200

4. Click **Next**
5. Skip registering targets (will be done dynamically)
6. Click **Create target group**

### 6.2 Create Application Load Balancer
1. Go to **EC2 Console** → **Load Balancers** → **Create load balancer**
2. Select **Application Load Balancer** → **Create**
3. Configure:
   - **Name**: `cloud-ide-load-balancer`
   - **Scheme**: Internet-facing
   - **IP address type**: IPv4
   
4. **Network mapping**:
   - **VPC**: `cloud-ide-vpc`
   - **Mappings**: Select both availability zones
     - `ap-south-1a` → `cloud-ide-public-subnet-1`
     - `ap-south-1b` → `cloud-ide-public-subnet-2`

5. **Security groups**:
   - Select `cloud-ide-alb-sg`
   - Remove default security group

6. **Listeners and routing**:
   - **Protocol**: HTTP
   - **Port**: 8080
   - **Default action**: Forward to `cloud-ide-target-group`

7. Click **Create load balancer**

8. Wait for ALB to become **Active** (2-3 minutes)

**Save these values:**
```
TARGET_GROUP_ARN=arn:aws:elasticloadbalancing:ap-south-1:ACCOUNT_ID:targetgroup/cloud-ide-target-group/xxxxx
ALB_DNS_NAME=cloud-ide-load-balancer-xxxxxxxxx.ap-south-1.elb.amazonaws.com
```

---

## Step 7: Create ECS Cluster

### 7.1 Create Cluster
1. Go to **ECS Console** → **Clusters** → **Create cluster**
2. Configure:
   - **Cluster name**: `cloud-ide-ECS-cluster`
   - **Infrastructure**: AWS Fargate (serverless)
   - **Monitoring**: Enable Container Insights (optional)
3. Click **Create**

**Save these values:**
```
CLUSTER_NAME=cloud-ide-ECS-cluster
CLUSTER_ARN=arn:aws:ecs:ap-south-1:ACCOUNT_ID:cluster/cloud-ide-ECS-cluster
```

---

## Step 8: Create ECS Task Definition

### 8.1 Create Task Definition
1. Go to **ECS Console** → **Task Definitions** → **Create new task definition**
2. Click **Create new task definition** → **Create new task definition with JSON**

### 8.2 Task Definition JSON

```json
{
  "family": "cloud-ide-fargate-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/cloud-ide-ecs-task-execution-role",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/cloud-ide-ecs-task-role",
  "containerDefinitions": [
    {
      "name": "cloud-ide-ecr",
      "image": "ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/cloud-ide-ecr:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "PORT",
          "value": "8080"
        }
      ],
      "mountPoints": [
        {
          "sourceVolume": "efs-workspace",
          "containerPath": "/workspace",
          "readOnly": false
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/cloud-ide-fargate-task",
          "awslogs-region": "ap-south-1",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      }
    }
  ],
  "volumes": [
    {
      "name": "efs-workspace",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-0cd014d72e65b1a47",
        "transitEncryption": "ENABLED",
        "authorizationConfig": {
          "accessPointId": "fsap-01e9a48723d7c7039",
          "iam": "DISABLED"
        }
      }
    }
  ]
}
```

### 8.3 Create via Console (Alternative)

If using the console instead of JSON:

1. **Task definition configuration**:
   - **Task definition family**: `cloud-ide-fargate-task`
   - **Launch type**: AWS Fargate
   - **Operating system**: Linux
   - **CPU**: 1 vCPU
   - **Memory**: 2 GB
   - **Task execution role**: `cloud-ide-ecs-task-execution-role`
   - **Task role**: `cloud-ide-ecs-task-role`

2. **Container details**:
   - **Name**: `cloud-ide-ecr`
   - **Image URI**: `ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/cloud-ide-ecr:latest`
   - **Port mappings**: 8080 (TCP)
   - **Environment variables**:
     - `PORT` = `8080`

3. **Storage**:
   - Click **Add volume**
   - **Volume type**: EFS
   - **Volume name**: `efs-workspace`
   - **File system ID**: Select your EFS
   - **Access point ID**: Select your access point
   - **Transit encryption**: Enabled
   
   - In container, add mount point:
     - **Source volume**: `efs-workspace`
     - **Container path**: `/workspace`

4. **Logging**:
   - **Log driver**: AWS Logs
   - **Log group**: `/ecs/cloud-ide-fargate-task`
   - **Auto-create log group**: Yes

5. Click **Create**

**Save these values:**
```
TASK_DEFINITION_ARN=arn:aws:ecs:ap-south-1:ACCOUNT_ID:task-definition/cloud-ide-fargate-task:1
TASK_DEFINITION_FAMILY=cloud-ide-fargate-task
```

---

## Step 9: Test the Setup

### 9.1 Manually Run a Task (Test)
1. Go to **ECS Console** → **Clusters** → `cloud-ide-ECS-cluster`
2. Click **Tasks** tab → **Run new task**
3. Configure:
   - **Launch type**: Fargate
   - **Task definition**: `cloud-ide-fargate-task:1`
   - **Platform version**: LATEST
   - **Cluster**: `cloud-ide-ECS-cluster`
   - **Subnets**: Select both public subnets
   - **Security group**: `cloud-ide-ecs-sg`
   - **Auto-assign public IP**: ENABLED
4. Click **Create**

### 9.2 Verify Task is Running
1. Wait for task status to become **RUNNING** (1-2 minutes)
2. Click on the task
3. Note the **Private IP** (e.g., 10.0.1.45)

### 9.3 Register Task with ALB (Manual Test)
```bash
aws elbv2 register-targets \
  --target-group-arn arn:aws:elasticloadbalancing:ap-south-1:ACCOUNT_ID:targetgroup/cloud-ide-target-group/xxxxx \
  --targets Id=10.0.1.45,Port=8080
```

### 9.4 Test Access
```bash
# Test health endpoint
curl http://cloud-ide-load-balancer-xxxxxxxxx.ap-south-1.elb.amazonaws.com:8080/health

# Expected response: OK
```

### 9.5 Clean Up Test Task
```bash
# Stop the task
aws ecs stop-task \
  --cluster cloud-ide-ECS-cluster \
  --task TASK_ARN

# Deregister from ALB
aws elbv2 deregister-targets \
  --target-group-arn TARGET_GROUP_ARN \
  --targets Id=10.0.1.45,Port=8080
```

---

## Step 10: Configure Backend Environment Variables

Update `vercel-backend3/.env`:

```bash
# AWS Configuration
NEXT_PUBLIC_REGION=ap-south-1
NEXT_PUBLIC_CLUSTER_ID=cloud-ide-ECS-cluster
NEXT_PUBLIC_TASK_DEFINITION_ID=cloud-ide-fargate-task:1
NEXT_PUBLIC_SUBNTET_ID1=subnet-012af762b773d0c29
NEXT_PUBLIC_SUBNET_ID2=subnet-010f07e57a14a302e
NEXT_PUBLIC_SECURITY_ID=sg-0425b39234dec81e7
NEXT_PUBLIC_TARGET_GROUP_ARN=arn:aws:elasticloadbalancing:ap-south-1:ACCOUNT_ID:targetgroup/cloud-ide-target-group/xxxxx

# EFS Configuration
EFS_FILE_SYSTEM_ID=fs-0cd014d72e65b1a47
SHARED_ACCESS_POINT_ID=fsap-01e9a48723d7c7039

# Backend Configuration
PORT=4000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# Database Configuration
DATABASE_URL=your-database-url

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Step 11: Configure Frontend Environment Variables

Update `frontend/my-app/.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://cloud-ide-load-balancer-xxxxxxxxx.ap-south-1.elb.amazonaws.com:8080
NEXT_PUBLIC_VERCEL_BACKEND_URL=http://your-backend-url:4000
NEXT_PUBLIC_ALB_URL=http://cloud-ide-load-balancer-xxxxxxxxx.ap-south-1.elb.amazonaws.com

# Auth0 Configuration (if using)
NEXT_PUBLIC_AUTH0_DOMAIN=your-auth0-domain
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-auth0-client-id
```

---

## Step 12: Deploy and Test

### 12.1 Start Backend
```bash
cd vercel-backend3
npm install
npm run dev
```

### 12.2 Start Frontend
```bash
cd frontend/my-app
npm install
npm run dev
```

### 12.3 Test Complete Flow
1. Open browser: `http://localhost:3000`
2. Login/Register
3. Create a new project
4. Backend should:
   - Start Fargate task
   - Wait for RUNNING state
   - Extract private IP
   - Register with ALB
   - Store in Redis
   - Save session to database
5. Verify you can:
   - Browse files
   - Edit files
   - Use terminal
   - See live file changes

---

## Cost Optimization Tips

### 1. Use Fargate Spot (70% cheaper)
- Suitable for non-critical workloads
- Tasks may be interrupted with 2-minute warning

### 2. Auto-stop Idle Containers
- Implement idle timeout detection
- Stop tasks after 30 minutes of inactivity

### 3. Use Smaller Task Sizes
- Start with 0.5 vCPU / 1 GB RAM
- Scale up based on usage

### 4. EFS Lifecycle Management
- Move files to Infrequent Access after 30 days
- 92% cost savings for infrequently accessed files

### 5. Use Reserved Capacity (for production)
- Fargate Savings Plans: up to 50% discount
- Commit to 1 or 3 years

---

## Monitoring and Logging

### CloudWatch Logs
- Task logs: `/ecs/cloud-ide-fargate-task`
- View in CloudWatch Console

### CloudWatch Metrics
- Monitor:
  - CPU utilization
  - Memory utilization
  - Task count
  - ALB request count
  - EFS throughput

### Set Up Alarms
```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name cloud-ide-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

---

## Troubleshooting

### Task Fails to Start
- Check CloudWatch logs
- Verify IAM roles have correct permissions
- Ensure security groups allow traffic
- Verify EFS mount targets are available

### Cannot Access via ALB
- Check target health in target group
- Verify security group rules
- Ensure task is registered with ALB
- Check ALB listener rules

### EFS Mount Fails
- Verify EFS security group allows NFS (port 2049)
- Check EFS mount targets exist in both AZs
- Verify access point configuration

### High Costs
- Check for orphaned tasks
- Implement auto-stop for idle containers
- Review CloudWatch metrics for optimization

---

## Security Best Practices

1. **Use HTTPS**: Configure SSL certificate on ALB
2. **Enable VPC Flow Logs**: Monitor network traffic
3. **Rotate Credentials**: Use AWS Secrets Manager
4. **Enable CloudTrail**: Audit API calls
5. **Use Private Subnets**: Move tasks to private subnets with NAT Gateway
6. **Enable EFS Encryption**: Already enabled in setup
7. **Implement WAF**: Add AWS WAF to ALB for protection
8. **Use IAM Roles**: Never hardcode credentials

---

## Next Steps

1. **Set up CI/CD**: Automate Docker image builds and deployments
2. **Configure Custom Domain**: Use Route 53 and ACM for HTTPS
3. **Implement Auto-scaling**: Scale tasks based on demand
4. **Add Monitoring**: Set up comprehensive CloudWatch dashboards
5. **Backup Strategy**: Configure EFS backups
6. **Disaster Recovery**: Multi-region setup for high availability

---

## Quick Reference

### All Environment Variables Needed

```bash
# AWS
NEXT_PUBLIC_REGION=ap-south-1
NEXT_PUBLIC_CLUSTER_ID=cloud-ide-ECS-cluster
NEXT_PUBLIC_TASK_DEFINITION_ID=cloud-ide-fargate-task:1
NEXT_PUBLIC_SUBNTET_ID1=subnet-xxxxxxxxx
NEXT_PUBLIC_SUBNET_ID2=subnet-xxxxxxxxx
NEXT_PUBLIC_SECURITY_ID=sg-xxxxxxxxx
NEXT_PUBLIC_TARGET_GROUP_ARN=arn:aws:elasticloadbalancing:...
EFS_FILE_SYSTEM_ID=fs-xxxxxxxxx
SHARED_ACCESS_POINT_ID=fsap-xxxxxxxxx

# URLs
NEXT_PUBLIC_API_URL=http://your-alb-dns:8080
NEXT_PUBLIC_ALB_URL=http://your-alb-dns
NEXT_PUBLIC_VERCEL_BACKEND_URL=http://your-backend:4000

# Other
DATABASE_URL=your-database-url
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=4000
```

### Useful AWS CLI Commands

```bash
# List running tasks
aws ecs list-tasks --cluster cloud-ide-ECS-cluster

# Describe task
aws ecs describe-tasks --cluster cloud-ide-ECS-cluster --tasks TASK_ARN

# Stop task
aws ecs stop-task --cluster cloud-ide-ECS-cluster --task TASK_ARN

# List target health
aws elbv2 describe-target-health --target-group-arn TARGET_GROUP_ARN

# View logs
aws logs tail /ecs/cloud-ide-fargate-task --follow
```

---

## Support and Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS EFS Documentation](https://docs.aws.amazon.com/efs/)
- [AWS Fargate Pricing](https://aws.amazon.com/fargate/pricing/)
- [AWS Architecture Center](https://aws.amazon.com/architecture/)

---

## Conclusion

You now have a complete AWS infrastructure for your cloud IDE platform! The setup includes:
- ✅ VPC with public subnets
- ✅ EFS for persistent storage
- ✅ ECR for Docker images
- ✅ ECS Fargate for serverless containers
- ✅ ALB for load balancing
- ✅ Security groups for network isolation
- ✅ IAM roles for permissions

Your platform can now dynamically create isolated development environments for multiple users with persistent storage and automatic routing.
