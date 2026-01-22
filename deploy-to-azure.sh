#!/bin/bash

# Smart Expense Tracker - Azure Deployment Script
# This script automates the deployment to Azure AKS

set -e

echo "=========================================="
echo "Smart Expense Tracker - Azure Deployment"
echo "=========================================="
echo ""

# Configuration
read -p "Enter your ACR name (e.g., expensetracker123): " ACR_NAME
read -p "Enter resource group name [expense-tracker-rg]: " RESOURCE_GROUP
RESOURCE_GROUP=${RESOURCE_GROUP:-expense-tracker-rg}
read -p "Enter AKS cluster name [expense-tracker-aks]: " AKS_NAME
AKS_NAME=${AKS_NAME:-expense-tracker-aks}
read -p "Enter Azure region [eastus]: " LOCATION
LOCATION=${LOCATION:-eastus}

echo ""
echo "Configuration:"
echo "  ACR Name: $ACR_NAME"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  AKS Cluster: $AKS_NAME"
echo "  Location: $LOCATION"
echo ""
read -p "Continue? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Deployment cancelled."
    exit 0
fi

# Step 1: Login to Azure
echo ""
echo "Step 1: Logging in to Azure..."
az login

# Step 2: Create Resource Group
echo ""
echo "Step 2: Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Step 3: Create ACR
echo ""
echo "Step 3: Creating Azure Container Registry..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --location $LOCATION

# Step 4: Login to ACR
echo ""
echo "Step 4: Logging in to ACR..."
az acr login --name $ACR_NAME

# Step 5: Build and Push Images
echo ""
echo "Step 5: Building and pushing Docker images..."

echo "Building backend image..."
cd backend
docker build -f Dockerfile.prod -t $ACR_NAME.azurecr.io/expense-tracker-backend:latest .
docker push $ACR_NAME.azurecr.io/expense-tracker-backend:latest
cd ..

echo "Building frontend image..."
cd frontend
docker build -f Dockerfile.prod -t $ACR_NAME.azurecr.io/expense-tracker-frontend:latest .
docker push $ACR_NAME.azurecr.io/expense-tracker-frontend:latest
cd ..

# Step 6: Create AKS Cluster
echo ""
echo "Step 6: Creating AKS cluster (this will take 5-10 minutes)..."
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_NAME \
  --node-count 2 \
  --node-vm-size Standard_B2s \
  --enable-managed-identity \
  --generate-ssh-keys \
  --attach-acr $ACR_NAME \
  --location $LOCATION

# Step 7: Get AKS Credentials
echo ""
echo "Step 7: Getting AKS credentials..."
az aks get-credentials --resource-group $RESOURCE_GROUP --name $AKS_NAME

# Step 8: Update Kubernetes Manifests
echo ""
echo "Step 8: Updating Kubernetes manifests..."
sed -i "s/<ACR_NAME>/$ACR_NAME/g" kubernetes/backend-deployment.yaml
sed -i "s/<ACR_NAME>/$ACR_NAME/g" kubernetes/frontend-deployment.yaml

# Step 9: Deploy to Kubernetes
echo ""
echo "Step 9: Deploying to Kubernetes..."

echo "Creating namespace..."
kubectl apply -f kubernetes/namespace.yaml

echo "Deploying secrets..."
kubectl apply -f kubernetes/postgres-secret.yaml
kubectl apply -f kubernetes/backend-secret.yaml

echo "Deploying PostgreSQL..."
kubectl apply -f kubernetes/postgres-pvc.yaml
kubectl apply -f kubernetes/postgres-deployment.yaml
kubectl wait --for=condition=ready pod -l app=postgres -n expense-tracker --timeout=300s

echo "Initializing database..."
POSTGRES_POD=$(kubectl get pods -n expense-tracker -l app=postgres -o jsonpath='{.items[0].metadata.name}')
kubectl cp database/schema.sql expense-tracker/$POSTGRES_POD:/tmp/schema.sql
kubectl exec -n expense-tracker $POSTGRES_POD -- psql -U postgres -d expense_tracker -f /tmp/schema.sql

echo "Deploying backend..."
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl wait --for=condition=ready pod -l app=backend -n expense-tracker --timeout=300s

echo "Deploying frontend..."
kubectl apply -f kubernetes/frontend-deployment.yaml
kubectl wait --for=condition=ready pod -l app=frontend -n expense-tracker --timeout=300s

# Step 10: Get External IP
echo ""
echo "Step 10: Waiting for external IP..."
echo "This may take 2-3 minutes..."
kubectl get service frontend-service -n expense-tracker --watch &
WATCH_PID=$!
sleep 180
kill $WATCH_PID 2>/dev/null || true

EXTERNAL_IP=$(kubectl get service frontend-service -n expense-tracker -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Your application is now running at:"
echo "  http://$EXTERNAL_IP"
echo ""
echo "To check status:"
echo "  kubectl get pods -n expense-tracker"
echo ""
echo "To view logs:"
echo "  kubectl logs -f -n expense-tracker -l app=backend"
echo "  kubectl logs -f -n expense-tracker -l app=frontend"
echo ""
echo "To delete deployment:"
echo "  az group delete --name $RESOURCE_GROUP --yes --no-wait"
echo ""
