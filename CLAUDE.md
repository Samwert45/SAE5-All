# SAE5-All - Projet Connecteur MidPoint avec RabbitMQ

## Architecture Globale

```
MidPoint → Java Connector → RabbitMQ → Python Consumer → API Cible
```

## Structure du Projet

```
SAE5-All/
├── idm-connector-rest-gateway/     # Connecteur Java MidPoint
│   └── src/main/java/lu/lns/connector/restgateway/
│       ├── RestGatewayConnector.java      # Connecteur principal (CREATE/UPDATE/DELETE)
│       ├── RestGatewayConfiguration.java  # Config (URL, RabbitMQ, timeouts)
│       ├── RestGatewayClient.java         # Client HTTP
│       ├── RabbitMQClient.java            # Client RabbitMQ (publish)
│       └── JsonMapper.java                # Conversion attributs → JSON
│
├── consumer-rabbitmq.py            # Consumer Python (écoute la queue)
├── gateway-http.py                 # API Flask (mode HTTP)
├── gateway.py                      # API Flask basique
├── docker-compose-rabbitmq.yml     # RabbitMQ container
└── RabbitMQ/                       # Fichiers support RabbitMQ
```

## Modes de Fonctionnement

### Mode HTTP (useRabbitmq=false)
```
MidPoint → Connector → HTTP POST → gateway-http.py (Flask :5000)
```

### Mode RabbitMQ (useRabbitmq=true)
```
MidPoint → Connector → RabbitMQ Queue → consumer-rabbitmq.py → ???
```

## Format des Messages JSON

```json
{
  "operation": "CREATE|UPDATE|DELETE",
  "entityType": "User|Role|Service|Organisation",
  "timestamp": "2026-01-22T10:30:00Z",
  "uid": "uuid-unique",
  "attributes": {
    "username": "jdoe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "enabled": true,
    "roles": ["Employee", "Developer"]
  }
}
```

## Configuration RabbitMQ

- **Host**: localhost (ou 172.17.0.1 depuis Docker)
- **Port**: 5672 (AMQP), 15672 (Web UI)
- **Credentials**: admin / admin123
- **Queue**: midpoint-operations

## Commandes Utiles

```bash
# Démarrer RabbitMQ
docker-compose -f docker-compose-rabbitmq.yml up -d

# Build connector
cd idm-connector-rest-gateway && ./gradlew clean jar

# Déployer dans MidPoint
docker cp build/libs/connector-restgateway-*.jar midpoint:/opt/midpoint/var/icf-connectors/
docker restart midpoint

# Lancer le consumer
python consumer-rabbitmq.py
```

## Problème Actuel

Le consumer-rabbitmq.py **affiche** les messages mais ne les **redirige pas** vers une API cible.

Il faut modifier le consumer pour :
1. Recevoir le message JSON de RabbitMQ
2. Déterminer l'API cible selon le type d'opération/entité
3. Faire un appel HTTP vers cette API
4. Gérer les erreurs et réponses

## APIs Cibles Potentielles

- `gateway-http.py` : Flask sur localhost:5000
  - POST /create
  - POST /update
  - POST /delete
