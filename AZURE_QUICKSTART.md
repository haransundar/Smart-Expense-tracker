# Azure Quick Start - 5 Minutes to Deploy

## Prerequisites

- Azure VM with Ubuntu
- Azure CLI installed
- Docker installed
- kubectl installed

## Quick Deploy (Automated)

```bash
# 1. Clone repository
git clone https://github.com/haransundar/Smart-Expense-tracker.git
cd Smart-Expense-tracker

# 2. Make script executable
chmod +x deploy-to-azure.sh

# 3. Run deployment script
./deploy-to-azure.sh
```

The script will prompt you for:
- ACR name (must be globally unique)
- Resource group name
- AKS cluster name
- Azure region

Then it will automatically:
1. Create Azure resources
2. Build and push Docker images
3. Deploy to Kubernetes
4. Initialize database
5. Provide access URL

## Manual Deploy (Step by Step)

### Step 1: Setup Azure Resources

```bash
# Variables
ACR_NAME="expensetracker$(date +%s)"
RESOURCE_GROUP="expense-tracker-rg"
AKS_NAME="expense-tracker-aks"
LOCATION="eastus"

# Login
az login

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create ACR
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic

# Create AKS
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_NAME \
  --node-count 2 \
  --node-vm-size Standard_B2s \
  --attach-acr $ACR_NAME \
  --generate-ssh-keys
```

### Step 2: Build and Push Images

```bash
# Login to ACR
az acr login --name $ACR_NAME

# Build and push backend
cd backend
docker build -f Dockerfile.prod -t $ACR_NAME.azurecr.io/expense-tracker-backend:latest .
docker push $ACR_NAME.azurecr.io/expense-tracker-backend:latest
cd ..

# Build and push frontend
cd frontend
docker build -f Dockerfile.prod -t $ACR_NAME.azurecr.io/expense-tracker-frontend:latest .
docker push $ACR_NAME.azurecr.io/expense-tracker-frontend:latest
cd ..
```

### Step 3: Deploy to Kubernetes

```bash
# Get AKS credentials
az aks get-credentials --resource-group $RESOURCE_GROUP --name $AKS_NAME

# Update manifests
sed -i "s/<ACR_NAME>/$ACR_NAME/g" kubernetes/backend-deployment.yaml
sed -i "s/<ACR_NAME>/$ACR_NAME/g" kubernetes/frontend-deployment.yaml

# Deploy
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/postgres-secret.yaml
kubectl apply -f kubernetes/backend-secret.yaml
kubectl apply -f kubernetes/postgres-pvc.yaml
kubectl apply -f kubernetes/postgres-deployment.yaml
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl apply -f kubernetes/frontend-deployment.yaml

# Wait for deployment
kubectl wait --for=condition=ready pod -l app=postgres -n expense-tracker --timeout=300s
kubectl wait --for=condition=ready pod -l app=backend -n expense-tracker --timeout=300s
kubectl wait --for=condition=ready pod -l app=frontend -n expense-tracker --timeout=300s
```

### Step 4: Initialize Database

```bash
# Get PostgreSQL pod
POSTGRES_POD=$(kubectl get pods -n expense-tracker -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# Copy and execute schema
kubectl cp database/schema.sql expense-tracker/$POSTGRES_POD:/tmp/schema.sql
kubectl exec -n expense-tracker $POSTGRES_POD -- psql -U postgres -d expense_tracker -f /tmp/schema.sql
```

### Step 5: Access Application

```bash
# Get external IP
kubectl get service frontend-service -n expense-tracker

# Wait for EXTERNAL-IP to appear
EXTERNAL_IP=$(kubectl get service frontend-service -n expense-tracker -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "Application URL: http://$EXTERNAL_IP"
```

## Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n expense-tracker

# Check services
kubectl get services -n expense-tracker

# View logs
kubectl logs -n expense-tracker -l app=backend --tail=50
kubectl logs -n expense-tracker -l app=frontend --tail=50
```

## Common Commands

```bash
# View all resources
kubectl get all -n expense-tracker

# Scale backend
kubectl scale deployment backend -n expense-tracker --replicas=3

# Restart deployment
kubectl rollout restart deployment/backend -n expense-tracker

# View logs (follow)
kubectl logs -f -n expense-tracker -l app=backend

# Execute command in pod
kubectl exec -it -n expense-tracker <POD_NAME> -- /bin/bash

# Port forward for testing
kubectl port-forward -n expense-tracker service/backend-service 8000:8000
```

## Cleanup

```bash
# Delete everything
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

## Troubleshooting

### Pods not starting
```bash
kubectl describe pod <POD_NAME> -n expense-tracker
kubectl logs <POD_NAME> -n expense-tracker
```

### Image pull errors
```bash
# Check ACR integration
az aks check-acr --name $AKS_NAME --resource-group $RESOURCE_GROUP --acr $ACR_NAME

# Reattach ACR
az aks update --name $AKS_NAME --resource-group $RESOURCE_GROUP --attach-acr $ACR_NAME
```

### Database connection issues
```bash
# Check database is running
kubectl get pods -n expense-tracker -l app=postgres

# Test connection from backend
kubectl exec -it -n expense-tracker <BACKEND_POD> -- python -c "from database import engine; print(engine.connect())"
```

## Cost Estimate

- AKS (2 x Standard_B2s nodes): ~$60/month
- ACR (Basic): ~$5/month
- Load Balancer: ~$20/month
- Storage: ~$5/month

**Total: ~$90/month**

## Next Steps

1. Configure custom domain
2. Add SSL certificate
3. Set up monitoring
4. Configure auto-scaling
5. Set up CI/CD pipeline
6. Configure backups

For detailed instructions, see [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md)
