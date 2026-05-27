# TasaciónEC - Arquitectura de Plataforma de Valoración Inmobiliaria

## 📋 Resumen Ejecutivo

TasaciónEC es una plataforma de valoración inmobiliaria automatizada que utiliza IA avanzada para generar reportes profesionales de avalúo cumpliendo con estándares de la Superintendencia de Bancos de Ecuador. La plataforma integra captura móvil con geolocalización, análisis de mercado, motor de costos, análisis geoespacial y generación automática de reportes con NLG.

## 🏗️ Arquitectura del Sistema

### Estilo Arquitectónico
- **Backend**: API REST con tRPC para type-safety end-to-end
- **Frontend**: SPA con React + TanStack Router
- **Base de Datos**: PostgreSQL con extensión PostGIS para datos geoespaciales
- **Storage**: MinIO (S3-compatible) para fotos y documentos
- **IA/ML**: OpenAI GPT-4o para generación de reportes

### Stack Tecnológico

#### Backend
- **Runtime**: Node.js con TypeScript
- **Framework**: tRPC para APIs type-safe
- **ORM**: Prisma para acceso a base de datos
- **Validación**: Zod para schemas
- **Autenticación**: JWT con bcryptjs
- **Storage**: MinIO Client

#### Frontend
- **Framework**: React 18 con TypeScript
- **Routing**: TanStack Router (file-based routing)
- **Estado**: Zustand con persistencia en localStorage
- **Forms**: React Hook Form con validación Zod
- **Estilos**: Tailwind CSS
- **Iconos**: Lucide React
- **Notificaciones**: React Hot Toast

#### Base de Datos
- **DBMS**: PostgreSQL 15+
- **Extensiones**: PostGIS para datos geoespaciales
- **ORM**: Prisma con migraciones automáticas

#### IA/ML
- **Proveedor**: OpenAI (GPT-4o)
- **SDK**: Vercel AI SDK
- **Casos de Uso**:
  - Generación de descripciones de entorno
  - Generación de descripciones técnicas
  - Justificación de valores de tasación
  - (Futuro) OCR para documentos legales
  - (Futuro) Computer Vision para análisis de fotos

## 📊 Módulos del Sistema

### Módulo 1: Captura Híbrida (Implementado)

**Características Implementadas:**
- ✅ Formulario de captura de propiedades con validación
- ✅ Geolocalización GPS automática del navegador
- ✅ Selección de tipo de propiedad (Casa, Apartamento, Comercial, Terreno, Industrial)
- ✅ Captura de características físicas (área, dormitorios, baños, etc.)
- ✅ Validación de datos en cliente y servidor
- ✅ Almacenamiento con metadatos de auditoría

**Características Pendientes (Frontend Mock):**
- ⏳ Upload de fotos con metadata EXIF
- ⏳ Captura offline-first con sincronización
- ⏳ OCR para documentos legales (escrituras, certificados)
- ⏳ Validación de integridad con hash SHA-256

**Flujo de Datos:**
```
Usuario → Formulario Web → Validación Zod → tRPC Mutation → 
Prisma → PostgreSQL → AuditLog
```

### Módulo 2: Motor de Homologación (Mock Frontend)

**Diseño Propuesto:**
- Scraping de portales inmobiliarios (Plusvalía, Properati, OLX)
- Clustering geoespacial con H3/Geohash para encontrar comparables
- Modelo hedónico (XGBoost/LightGBM) para ajustes de precio
- Cálculo de factores de ajuste (ubicación, tamaño, edad, calidad)
- Interface de curación manual para validación

**Implementación Actual:**
- Base de datos con modelo `Comparable`
- Campos para ajustes de ubicación, tamaño, edad y calidad
- Cálculo de precio ajustado
- Integración con reportes de valoración

**Próximos Pasos:**
1. Implementar scraper con Playwright
2. Crear pipeline de limpieza de datos
3. Entrenar modelo de precios hedónicos
4. Implementar cálculo automático de ajustes
5. UI para revisión manual de comparables

### Módulo 3: Motor de Costos y Depreciación (Implementado Backend)

**Características Implementadas:**
- ✅ Cálculo de valor de terreno (área × precio/m²)
- ✅ Cálculo de costo de construcción (área construida × costo/m²)
- ✅ Depreciación lineal basada en edad
- ✅ Método de depreciación configurable
- ✅ Valor de costo = terreno + construcción - depreciación

**Parámetros Actuales:**
- Costo de construcción: $650/m²
- Valor de terreno: $150/m²
- Depreciación: 5% anual después de 5 años (máx 50%)

**Mejoras Futuras:**
- Integración con API de Cámara de la Construcción
- Métodos de depreciación avanzados (Ross-Heidecke, Fitto-Corvini)
- Ajustes por calidad de materiales
- Costos de mantenimiento correctivo/defectivo

### Módulo 4: Análisis Geoespacial y Riesgos (Mock Frontend)

**Diseño Propuesto:**
- Integración con Mapbox/Google Maps para visualización
- CNN/Transformers para detección de patologías en fotos
- Clasificación de estado de conservación
- Cruce con capas de riesgo oficial (inundación, sismicidad)
- Matriz de riesgo ambiental

**Modelo de Datos Implementado:**
```prisma
model RiskAssessment {
  floodRisk         Float
  seismicRisk       Float
  landslideRisk     Float
  environmentalRisk Float
  overallRisk       String
  nearbyPOIs        String[]
  detectedIssues    String[]
}
```

**Próximos Pasos:**
1. Integrar mapas interactivos
2. Implementar modelo de Computer Vision (YOLO/ResNet)
3. Conectar con APIs de riesgo gubernamentales
4. Calcular scores de ubicación automáticos

### Módulo 5: Generación de Reportes con IA (✨ WOW FEATURE - Implementado)

**Características Implementadas:**
- ✅ Generación automática con OpenAI GPT-4o
- ✅ Descripción del entorno (2-3 párrafos)
- ✅ Descripción técnica de la propiedad
- ✅ Justificación del valor final
- ✅ Cálculo de valor de mercado (homologación)
- ✅ Cálculo de valor de costo (reemplazo)
- ✅ Valor final ponderado (70% mercado + 30% costo)
- ✅ Desglose de costos detallado
- ✅ Hash SHA-256 para auditoría inmutable
- ✅ Interfaz de visualización con tabs

**Flujo de Generación:**
```
Usuario → Click "Generar Reporte" → tRPC Mutation →
OpenAI API (3 llamadas paralelas) →
  1. Descripción de Entorno
  2. Descripción Técnica
  3. Justificación de Valor
→ Cálculos de Valoración →
Hash SHA-256 → PostgreSQL → UI Actualizada
```

**Prompts de IA:**
Los prompts están diseñados para generar contenido profesional en español, adecuado para documentación bancaria, con contexto específico de cada propiedad.

## 🗄️ Esquema de Base de Datos

### Modelos Principales

#### User
- Autenticación con bcrypt
- Roles: APPRAISER, SUPERVISOR, ADMIN
- Relación 1:N con Properties y Reports

#### Property
- Información básica (dirección, tipo, estado)
- Datos geoespaciales (latitude, longitude) con PostGIS
- Características físicas (áreas, dormitorios, baños)
- Detalles de construcción (materiales, conservación)
- Información legal (OCR futuro)
- Timestamps de auditoría

#### PropertyPhoto
- Storage en MinIO (minioKey, url)
- Metadata EXIF (latitude, longitude, timestamp, deviceInfo)
- Categorización (facade, interior, kitchen, bathroom, damage, document)
- Análisis de IA (detectedIssues, aiConfidence)

#### Comparable
- Fuente de datos (portal, manual, scraped)
- Ubicación y distancia
- Características comparables
- Factores de ajuste (4 tipos)
- Precio ajustado calculado

#### ValuationReport
- Estado del reporte (GENERATING, DRAFT, APPROVED, etc.)
- Tres métodos de valoración (market, cost, income)
- Valor final ponderado
- Desglose de costos
- Contenido generado por IA (3 secciones)
- Hash de documento para auditoría
- Workflow de aprobación

#### RiskAssessment
- Scores de riesgo (0-10) por categoría
- Nivel de riesgo general
- POIs cercanos
- Issues estructurales detectados

#### AuditLog
- Registro inmutable de todas las acciones
- Quién, qué, cuándo, dónde
- Metadata en JSON
- Relaciones con entidades

## 🔐 Seguridad y Cumplimiento

### Autenticación y Autorización
- **JWT**: Tokens con expiración de 30 días
- **Password Hashing**: bcryptjs con 10 salt rounds
- **RBAC**: Roles de usuario (Appraiser, Supervisor, Admin)
- **Token Storage**: localStorage con Zustand Persist

### Auditoría y Trazabilidad
- **AuditLog**: Registro inmutable de todas las acciones
- **Document Hash**: SHA-256 para reportes
- **Timestamps**: createdAt en todos los modelos
- **Metadata**: JSON con contexto de cada acción

### Protección de Datos
- **Encriptación en Tránsito**: HTTPS/TLS
- **Encriptación en Reposo**: PostgreSQL con cifrado
- **MinIO**: Acceso con credenciales seguras
- **Environment Variables**: Secrets en .env

### Cumplimiento Regulatorio
- **Superintendencia de Bancos**: Estructura de reportes conforme
- **Trazabilidad**: Auditoría completa de cambios
- **Versionado**: Hash de documentos para inmutabilidad
- **Human-in-the-Loop**: Workflow de aprobación

## 🚀 Estrategia de MLOps

### Modelo de Precios Hedónicos (Futuro)

**Entrenamiento:**
```python
# Feature Engineering
features = [
    'land_area', 'built_area', 'bedrooms', 'bathrooms',
    'age', 'location_score', 'nearby_pois'
]

# Model Training
model = XGBRegressor(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1
)

# SHAP for Explainability
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)
```

**Deployment:**
- Model Registry: MLflow
- Serving: FastAPI endpoint
- Monitoring: Evidently AI para drift detection
- Retraining: Mensual con nuevos datos

### Computer Vision (Futuro)

**Arquitectura:**
- Backbone: ResNet50/EfficientNet
- Detección: YOLO para patologías
- Clasificación: Estado de conservación
- Confianza: Threshold 0.85 para auto-aprobación

**Pipeline:**
```
Foto → Preprocessing → Model Inference →
Confidence Check → (>0.85) Auto-approve : Manual Review
```

## 📈 Métricas de Éxito

### Técnicas
- **Latencia de API**: < 200ms (p95)
- **Disponibilidad**: > 99.5%
- **Precisión de Modelo**: MAPE < 10%
- **Tasa de Error OCR**: < 2%
- **Tiempo de Generación de Reporte**: < 30s

### Negocio
- **Reducción de Tiempo**: 95% vs proceso manual
- **Costo por Avalúo**: -70%
- **Satisfacción de Usuario**: > 4.5/5
- **Adopción**: 80% de appraisers en 6 meses

## 🛠️ Instalación y Deployment

### Requisitos
- Node.js 18+
- PostgreSQL 15+ con PostGIS
- Docker y Docker Compose
- OpenAI API Key

### Setup Local

1. **Clonar repositorio**
```bash
git clone <repo-url>
cd tasacionec
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

3. **Instalar dependencias**
```bash
pnpm install
```

4. **Iniciar servicios**
```bash
docker-compose up -d  # PostgreSQL + MinIO
```

5. **Migrar base de datos**
```bash
pnpm prisma db push
```

6. **Iniciar aplicación**
```bash
pnpm dev
```

7. **Acceder**
- Frontend: http://localhost:5173
- Admin: admin@tasacionec.com / {ADMIN_PASSWORD}

### Deployment Production

**Docker Compose:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://...
      - OPENAI_API_KEY=sk-...
    depends_on:
      - postgres
      - minio
  
  postgres:
    image: postgis/postgis:15-3.3
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  minio:
    image: minio/minio
    volumes:
      - minio_data:/data
```

**CI/CD Pipeline (GitHub Actions):**
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm build
      - run: docker build -t tasacionec .
      - run: docker push tasacionec
```

## 🔮 Roadmap de Implementación

### Fase 1: MVP (✅ Completado - 4 semanas)
- [x] Autenticación y autorización
- [x] Captura de propiedades
- [x] Generación de reportes con IA
- [x] Dashboard con estadísticas
- [x] Base de datos con auditoría

### Fase 2: Core ML (🚧 En Progreso - 6 semanas)
- [ ] Scraper de portales inmobiliarios
- [ ] Modelo hedónico de precios
- [ ] Cálculo automático de comparables
- [ ] Integración con Cámara de Construcción
- [ ] Métodos de depreciación avanzados

### Fase 3: IA Avanzada (📅 Planeado - 8 semanas)
- [ ] OCR para documentos legales
- [ ] Computer Vision para patologías
- [ ] Análisis geoespacial con mapas
- [ ] Integración con APIs de riesgo
- [ ] RAG para normativa bancaria

### Fase 4: Escalamiento (📅 Planeado - 6 semanas)
- [ ] Optimización de performance
- [ ] Pruebas de carga
- [ ] Monitoreo con Prometheus/Grafana
- [ ] Alertas y SLAs
- [ ] Auditoría externa y certificación

## 💡 Recomendaciones de Experto

### Datos > Modelos
- Invierte en Feature Store y Data Quality Gates
- Versionado de datasets con DVC
- Pipelines de limpieza robustos

### Explicabilidad Regulatoria
- SHAP values para cada predicción
- Snapshots de inputs para auditoría
- Documentación de decisiones de modelo

### Scraping Ético
- Respeta robots.txt y TOS
- Considera acuerdos de licencia de datos
- Rate limiting y rotación de IPs

### Costos Cloud
- Usa inferencia por lotes
- Cache de embeddings
- Modelos ligeros para producción (MobileNet, DistilBERT)

### Human-in-the-Loop
- No automatices 100% desde día 1
- Workflows de aprobación para valores críticos
- Interfaz de revisión manual

## 📞 Soporte y Contacto

Para preguntas técnicas o soporte:
- Email: tech@tasacionec.com
- Documentación: https://docs.tasacionec.com
- Issues: GitHub Issues

---

**Versión**: 1.0.0  
**Última Actualización**: 2026  
**Autor**: Equipo de Ingeniería TasaciónEC
