# Azure Deployment Guide - AKS with ACR

Complete guide to deploy Smart Expense Tracker on Azure Kubernetes Service (AKS) using Azure Container Registry (ACR).

## Prerequisites

- Azure CLI installed
- kubectl installed
- Docker installed
- Azure subscription
- GitHub repository with code

## Architecture

```
GitHub Repository
    ↓
Azure Container Registry (ACR)
    ↓
Azure Kubernetes Service (AKS)
    ├── Frontend (React + Nginx)
    ├── Backend (FastAPI)
    └── PostgreSQL Database
```

---

## Step 1: Azure Setup

### 1.1 Login to Azure

```bash
# Login to Azure
az login

# Set your subscription
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Verify
az account show
```

### 1.2 Create Resource Group

```bash
# Create resource group
az group create \
  --name expense-tracker-rg \
  --location eastus
```

---

## Step 2: Create Azure Container Registry (ACR)

```bash
# Create ACR
az acr create \
  --resource-group expense-tracker-rg \
  --name expensetracker<UNIQUE_ID> \
  --sku Basic \
  --location eastus

# Login to ACR
az acr login --name expensetracker<UNIQUE_ID>

# Get ACR login server
az acr show --name expensetracker<UNIQUE_ID> --query loginServer --output table
```

**Note:** Replace `<UNIQUE_ID>` with a unique identifier (e.g., your initials + numbers)

---

## Step 3: Build and Push Docker Images to ACR

### 3.1 Clone Repository on Azure VM

```bash
# SSH into your Azure VM
ssh azureuser@<VM_IP>

# Install Docker if not installed
sudo apt-get update
sudo apt-get install -y docker.io
sudo usermod -aG docker $USER
newgrp docker

# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Clone repository
git clone https://github.com/haransundar/Smart-Expense-tracker.git
cd Smart-Expense-tracker
```

### 3.2 Build and Push Backend Image

```bash
# Set ACR name
ACR_NAME="expensetracker<UNIQUE_ID>"

# Login to ACR
az acr login --name $ACR_NAME

# Build backend image
cd backend
docker build -f Dockerfile.prod -t $ACR_NAME.azurecr.io/expense-tracker-backend:latest .

# Push to ACR
docker push $ACR_NAME.azurecr.io/expense-tracker-backend:latest

cd ..
```

### 3.3 Build and Push Frontend Image

```bash
# Build frontend image
cd frontend
docker build -f Dockerfile.prod -t $ACR_NAME.azurecr.io/expense-tracker-frontend:latest .

# Push to ACR
docker push $ACR_NAME.azurecr.io/expense-tracker-frontend:latest

cd ..
```

### 3.4 Verify Images in ACR

```bash
# List images in ACR
az acr repository list --name $ACR_NAME --output table

# Show tags
az acr repository show-tags --name $ACR_NAME --repository expense-tracker-backend --output table
az acr repository show-tags --name $ACR_NAME --repository expense-tracker-frontend --output table
```

---

## Step 4: Create Azure Kubernetes Service (AKS)

```bash
# Create AKS cluster
az aks create \
  --resource-group expense-tracker-rg \
  --name expense-tracker-aks \
  --node-count 2 \
  --node-vm-size Standard_B2s \
  --enable-managed-identity \
  --generate-ssh-keys \
  --attach-acr expensetracker<UNIQUE_ID> \
  --location eastus

# This will take 5-10 minutes
```

### 4.1 Connect to AKS Cluster

```bash
# Get credentials
az aks get-credentials \
  --resource-group expense-tracker-rg \
  --name expense-tracker-aks

# Verify connection
kubectl get nodes
```

---

## Step 5: Update Kubernetes Manifests

### 5.1 Update Image Names

```bash
# Replace <ACR_NAME> in all deployment files
ACR_NAME="expensetracker<UNIQUE_ID>"

# Update backend deployment
sed -i "s/<ACR_NAME>/$ACR_NAME/g" kubernetes/backend-deployment.yaml

# Update frontend deployment
sed -i "s/<ACR_NAME>/$ACR_NAME/g" kubernetes/frontend-deployment.yaml
```

### 5.2 Update Secrets (IMPORTANT!)

Edit `kubernetes/backend-secret.yaml` and `kubernetes/postgres-secret.yaml` with secure passwords:

```bash
# Generate secure password
openssl rand -base64 32

# Edit secrets
nano kubernetes/backend-secret.yaml
nano kubernetes/postgres-secret.yaml
```

---

## Step 6: Deploy to AKS

### 6.1 Create Namespace

```bash
kubectl apply -f kubernetes/namespace.yaml
```

### 6.2 Deploy Secrets

```bash
kubectl apply -f kubernetes/postgres-secret.yaml
kubectl apply -f kubernetes/backend-secret.yaml
```

### 6.3 Deploy PostgreSQL

```bash
kubectl apply -f kubernetes/postgres-pvc.yaml
kubectl apply -f kubernetes/postgres-deployment.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n expense-tracker --timeout=300s
```

### 6.4 Initialize Database Schema

```bash
# Get PostgreSQL pod name
POSTGRES_POD=$(kubectl get pods -n expense-tracker -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# Copy schema file
kubectl cp database/schema.sql expense-tracker/$POSTGRES_POD:/tmp/schema.sql

# Execute schema
kubectl exec -n expense-tracker $POSTGRES_POD -- psql -U postgres -d expense_tracker -f /tmp/schema.sql
```

### 6.5 Deploy Backend

```bash
kubectl apply -f kubernetes/backend-deployment.yaml

# Wait for backend to be ready
kubectl wait --for=condition=ready pod -l app=backend -n expense-tracker --timeout=300s
```

### 6.6 Deploy Frontend

```bash
kubectl apply -f kubernetes/frontend-deployment.yaml

# Wait for frontend to be ready
kubectl wait --for=condition=ready pod -l app=frontend -n expense-tracker --timeout=300s
```

---

## Step 7: Access Your Application

### 7.1 Get External IP

```bash
# Get frontend service external IP
kubectl get service frontend-service -n expense-tracker

# Wait for EXTERNAL-IP (may take 2-3 minutes)
kubectl get service frontend-service -n expense-tracker --watch
```

### 7.2 Access Application

```bash
# Get the external IP
EXTERNAL_IP=$(kubectl get service frontend-service -n expense-tracker -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "Access your application at: http://$EXTERNAL_IP"
```

---

## Step 8: Verify Deployment

```bash
# Check all pods
kubectl get pods -n expense-tracker

# Check services
kubectl get services -n expense-tracker

# Check logs
kubectl logs -n expense-tracker -l app=backend --tail=50
kubectl logs -n expense-tracker -l app=frontend --tail=50
kubectl logs -n expense-tracker -l app=postgres --tail=50
```

---

## Step 9: Configure Domain (Optional)

### 9.1 Add DNS Record

1. Go to your domain registrar
2. Add an A record pointing to the EXTERNAL_IP
3. Example: `expense-tracker.yourdomain.com` → `EXTERNAL_IP`

### 9.2 Install Nginx Ingress Controller

```bash
# Install nginx ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Wait for ingress controller
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

### 9.3 Install Cert-Manager (for SSL)

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Wait for cert-manager
kubectl wait --namespace cert-manager \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/instance=cert-manager \
  --timeout=120s
```

### 9.4 Deploy Ingress

```bash
# Update domain in ingress.yaml
nano kubernetes/ingress.yaml

# Apply ingress
kubectl apply -f kubernetes/ingress.yaml
```

---

## Monitoring and Maintenance

### View Logs

```bash
# Backend logs
kubectl logs -f -n expense-tracker -l app=backend

# Frontend logs
kubectl logs -f -n expense-tracker -l app=frontend

# Database logs
kubectl logs -f -n expense-tracker -l app=postgres
```

### Scale Application

```bash
# Scale backend
kubectl scale deployment backend -n expense-tracker --replicas=3

# Scale frontend
kubectl scale deployment frontend -n expense-tracker --replicas=3
```

### Update Application

```bash
# Build new image
docker build -t $ACR_NAME.azurecr.io/expense-tracker-backend:v2 .
docker push $ACR_NAME.azurecr.io/expense-tracker-backend:v2

# Update deployment
kubectl set image deployment/backend backend=$ACR_NAME.azurecr.io/expense-tracker-backend:v2 -n expense-tracker

# Check rollout status
kubectl rollout status deployment/backend -n expense-tracker
```

---

## Troubleshooting

### Pods Not Starting

```bash
# Describe pod
kubectl describe pod <POD_NAME> -n expense-tracker

# Check events
kubectl get events -n expense-tracker --sort-by='.lastTimestamp'
```

### Database Connection Issues

```bash
# Test database connection
kubectl exec -it -n expense-tracker <BACKEND_POD> -- python -c "from database import engine; print(engine.connect())"
```

### Image Pull Errors

```bash
# Verify ACR integration
az aks check-acr --name expense-tracker-aks --resource-group expense-tracker-rg --acr expensetracker<UNIQUE_ID>
```

---

## Cleanup

```bash
# Delete AKS cluster
az aks delete --name expense-tracker-aks --resource-group expense-tracker-rg --yes --no-wait

# Delete ACR
az acr delete --name expensetracker<UNIQUE_ID> --resource-group expense-tracker-rg --yes

# Delete resource group
az group delete --name expense-tracker-rg --yes --no-wait
```

---

## Cost Optimization

- Use **Standard_B2s** VMs for development (cheaper)
- Use **Spot instances** for non-production workloads
- Enable **cluster autoscaler** for dynamic scaling
- Use **Azure Database for PostgreSQL** instead of self-hosted (managed service)
- Set up **auto-shutdown** for development environments

---

## Security Best Practices

1. **Never commit secrets** to Git
2. Use **Azure Key Vault** for production secrets
3. Enable **RBAC** on AKS cluster
4. Use **Network Policies** to restrict pod communication
5. Enable **Azure Defender** for container security
6. Regularly update images and dependencies
7. Use **private endpoints** for ACR

---

## Next Steps

1. Set up CI/CD with GitHub Actions
2. Configure monitoring with Azure Monitor
3. Set up backup for PostgreSQL
4. Implement auto-scaling policies
5. Add SSL certificate with Let's Encrypt
6. Configure custom domain

---

## Support

For issues, check:
- AKS logs: `kubectl logs`
- Azure Portal: Monitor section
- GitHub Issues: https://github.com/haransundar/Smart-Expense-tracker/issues
