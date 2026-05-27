# TasaciónEC - Kubernetes Deployment Guide

## 📋 Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured to access your cluster
- Helm 3 (optional, for cert-manager)
- Domain name pointed to your cluster's load balancer

## 🚀 Quick Start

### 1. Create Namespace

```bash
kubectl create namespace tasacionec
kubectl config set-context --current --namespace=tasacionec
```

### 2. Create Secrets

First, copy the secrets template and fill in the values:

```bash
cp secrets.yaml.template secrets.yaml
```

Edit `secrets.yaml` and replace all `CHANGE_ME` values with secure credentials:

```bash
# Generate secure random strings
openssl rand -base64 32
```

Apply the secrets:

```bash
kubectl apply -f secrets.yaml
```

**Important**: Never commit `secrets.yaml` to version control!

### 3. Deploy Infrastructure

Deploy the infrastructure components in order:

```bash
# ConfigMap
kubectl apply -f configmap.yaml

# PostgreSQL with PostGIS
kubectl apply -f postgres-statefulset.yaml

# MinIO Object Storage
kubectl apply -f minio-statefulset.yaml

# Kafka Message Broker
kubectl apply -f kafka-statefulset.yaml
```

Wait for all pods to be ready:

```bash
kubectl get pods -w
```

### 4. Deploy Application

```bash
# Application deployment
kubectl apply -f deployment.yaml

# Services
kubectl apply -f service.yaml

# Ingress
kubectl apply -f ingress.yaml
```

### 5. Verify Deployment

```bash
# Check all resources
kubectl get all

# Check pod logs
kubectl logs -f deployment/tasacionec-app

# Check ingress
kubectl get ingress
```

## 🔧 Configuration

### Environment Variables

All configuration is managed through ConfigMaps and Secrets:

- **ConfigMap** (`configmap.yaml`): Non-sensitive configuration
- **Secrets** (`secrets.yaml`): Sensitive data (passwords, API keys)

### Scaling

Scale the application horizontally:

```bash
kubectl scale deployment tasacionec-app --replicas=5
```

### Resource Limits

Adjust resource limits in `deployment.yaml`:

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "500m"
```

## 📊 Monitoring

### Health Checks

The application includes liveness and readiness probes:

- **Liveness**: `/api/health` - Restarts pod if unhealthy
- **Readiness**: `/api/health` - Removes from load balancer if not ready

### Logs

View application logs:

```bash
# All pods
kubectl logs -l app=tasacionec --tail=100 -f

# Specific pod
kubectl logs tasacionec-app-xxxxx -f

# Previous crashed pod
kubectl logs tasacionec-app-xxxxx --previous
```

### Metrics

Install metrics-server for resource monitoring:

```bash
kubectl top nodes
kubectl top pods
```

## 🔐 Security

### TLS/SSL

Install cert-manager for automatic SSL certificates:

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@tasacionec.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### Network Policies

Apply network policies to restrict pod-to-pod communication:

```bash
kubectl apply -f network-policies.yaml
```

### RBAC

The application uses minimal RBAC permissions. Review and adjust as needed.

## 💾 Backup and Restore

### Database Backup

Create a CronJob for automated backups:

```bash
kubectl apply -f backup-cronjob.yaml
```

Manual backup:

```bash
kubectl exec -it postgres-0 -- pg_dump -U postgres app > backup.sql
```

### Restore Database

```bash
kubectl exec -i postgres-0 -- psql -U postgres app < backup.sql
```

### Object Storage Backup

MinIO data is stored in persistent volumes. Use your cloud provider's volume snapshot feature.

## 🔄 Updates and Rollbacks

### Rolling Update

```bash
# Update image
kubectl set image deployment/tasacionec-app app=tasacionec/app:v2.0.0

# Check rollout status
kubectl rollout status deployment/tasacionec-app
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/tasacionec-app

# Rollback to specific revision
kubectl rollout undo deployment/tasacionec-app --to-revision=2

# Check rollout history
kubectl rollout history deployment/tasacionec-app
```

## 🐛 Troubleshooting

### Pods Not Starting

```bash
# Describe pod to see events
kubectl describe pod tasacionec-app-xxxxx

# Check logs
kubectl logs tasacionec-app-xxxxx

# Check resource constraints
kubectl top pods
```

### Database Connection Issues

```bash
# Test database connectivity
kubectl exec -it tasacionec-app-xxxxx -- sh
# Inside pod:
nc -zv postgres 5432
psql postgresql://postgres:password@postgres:5432/app
```

### MinIO Access Issues

```bash
# Check MinIO pod
kubectl logs minio-0

# Test MinIO connectivity
kubectl port-forward minio-0 9000:9000
# Open browser: http://localhost:9000
```

### Kafka Issues

```bash
# Check Kafka brokers
kubectl exec -it kafka-0 -- kafka-broker-api-versions --bootstrap-server localhost:9092

# List topics
kubectl exec -it kafka-0 -- kafka-topics --bootstrap-server localhost:9092 --list
```

### Ingress Not Working

```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress resource
kubectl describe ingress tasacionec-ingress

# Check certificate
kubectl describe certificate tasacionec-tls
```

## 📈 Performance Tuning

### PostgreSQL

Tune PostgreSQL for better performance:

```yaml
env:
- name: POSTGRES_SHARED_BUFFERS
  value: "256MB"
- name: POSTGRES_EFFECTIVE_CACHE_SIZE
  value: "1GB"
- name: POSTGRES_WORK_MEM
  value: "16MB"
```

### Kafka

Adjust Kafka for higher throughput:

```yaml
env:
- name: KAFKA_NUM_NETWORK_THREADS
  value: "8"
- name: KAFKA_NUM_IO_THREADS
  value: "8"
- name: KAFKA_SOCKET_SEND_BUFFER_BYTES
  value: "102400"
- name: KAFKA_SOCKET_RECEIVE_BUFFER_BYTES
  value: "102400"
```

## 🌐 Multi-Region Deployment

For high availability across regions:

1. Deploy to multiple Kubernetes clusters
2. Use external database service (AWS RDS, Google Cloud SQL)
3. Configure multi-region object storage
4. Use global load balancer (AWS Route 53, Cloudflare)

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/tasacionec/tasacionec/issues
- Email: support@tasacionec.com
- Documentation: https://docs.tasacionec.com

## 📄 License

Copyright © 2024 TasaciónEC. All rights reserved.
