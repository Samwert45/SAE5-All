# 🐰 Connecteur Midpoint avec RabbitMQ

Documentation complète pour activer le mode RabbitMQ dans le connecteur REST Gateway.

## 📋 Table des matières

- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Exemple de flux](#exemple-de-flux)

---

## 🏗️ Architecture

### Mode RabbitMQ (Recommandé)

```
┌──────────┐     ┌────────────┐     ┌──────────┐     ┌─────────────┐     ┌─────────────┐
│ Midpoint │ --> │ Connecteur │ --> │ RabbitMQ │ --> │   Consumer  │ --> │   Système   │
│          │     │    Java    │     │  Queue   │     │   Python    │     │    Cible    │
└──────────┘     └────────────┘     └──────────┘     └─────────────┘     └─────────────┘
```

**Avantages :**
- ✅ **Asynchrone** : Midpoint ne bloque pas en attendant le traitement
- ✅ **Découplé** : Le consumer peut être arrêté/redémarré sans affecter Midpoint
- ✅ **Fiable** : Les messages sont persistés dans RabbitMQ
- ✅ **Scalable** : Plusieurs consumers peuvent traiter les messages en parallèle

### Mode HTTP (Par défaut)

```
┌──────────┐     ┌────────────┐     ┌──────────────┐
│ Midpoint │ --> │ Connecteur │ --> │ Gateway HTTP │
│          │     │    Java    │     │   (Python)   │
└──────────┘     └────────────┘     └──────────────┘
```

---

## 🚀 Installation

### 1️⃣ Appliquer les modifications RabbitMQ au connecteur

Tous les fichiers modifiés sont dans le dossier `RabbitMQ/connector-modifications/`.

#### a) Remplacer les fichiers Java

```bash
cd SAE5-All

# Copier le nouveau build.gradle
cp RabbitMQ/connector-modifications/build.gradle idm-connector-rest-gateway/

# Copier le nouveau RabbitMQClient.java
cp RabbitMQ/connector-modifications/RabbitMQClient.java idm-connector-rest-gateway/src/main/java/lu/lns/connector/restgateway/

# Copier la configuration mise à jour
cp RabbitMQ/connector-modifications/RestGatewayConfiguration.java idm-connector-rest-gateway/src/main/java/lu/lns/connector/restgateway/

# Copier le connecteur mis à jour
cp RabbitMQ/connector-modifications/RestGatewayConnector.java idm-connector-rest-gateway/src/main/java/lu/lns/connector/restgateway/

# Copier les messages UI
cp RabbitMQ/connector-modifications/Messages.properties idm-connector-rest-gateway/src/main/resources/lu/lns/connector/restgateway/
```

#### b) Compiler le connecteur

```bash
cd idm-connector-rest-gateway
./gradlew clean jar
```

Le JAR sera généré dans `build/libs/connector-restgateway-1.0.0-SNAPSHOT.jar` (environ 1MB).

#### c) Installer dans Midpoint

```bash
docker cp build/libs/connector-restgateway-1.0.0-SNAPSHOT.jar midpoint:/opt/midpoint/var/icf-connectors/
docker restart midpoint
```

Attendez 1-2 minutes que Midpoint redémarre.

---

### 2️⃣ Démarrer RabbitMQ

```bash
cd SAE5-All/RabbitMQ
docker-compose -f docker-compose-rabbitmq.yml up -d
```

Vérifier que RabbitMQ est démarré :
```bash
docker ps | grep rabbitmq
```

**Interface Web RabbitMQ** : http://localhost:15672
- Username: `admin`
- Password: `admin123`

---

### 3️⃣ Démarrer le consumer Python

```bash
# Installer la dépendance
pip install pika

# Lancer le consumer
cd SAE5-All/RabbitMQ
python3 gateway-rabbitmq-consumer.py
```

Vous verrez :
```
======================================================================
🐰 Gateway RabbitMQ Consumer - Midpoint Connector
======================================================================
Connexion à RabbitMQ:
  - Host: localhost
  - Port: 5672
  - Queue: midpoint-operations
======================================================================
✅ Connecté à RabbitMQ
⏳ En attente de messages sur la queue 'midpoint-operations'...
   (Ctrl+C pour arrêter)
======================================================================
```

---

## ⚙️ Configuration

### Dans Midpoint (Interface Web)

1. Aller dans **Configuration** → **Repository Objects** → **Resources**
2. Sélectionner votre ressource Gateway
3. Cliquer sur **Configuration**

Vous verrez maintenant **6 nouveaux champs RabbitMQ** :

| Champ | Valeur Recommandée | Description |
|-------|-------------------|-------------|
| **Use RabbitMQ** | ✅ `true` | Active le mode RabbitMQ |
| **RabbitMQ Host** | `172.17.0.1` | IP du host Docker (pas localhost) |
| **RabbitMQ Port** | `5672` | Port AMQP |
| **RabbitMQ Username** | `admin` | Utilisateur RabbitMQ |
| **RabbitMQ Password** | `admin123` | Mot de passe RabbitMQ |
| **RabbitMQ Queue** | `midpoint-operations` | Nom de la queue |

⚠️ **Important** : Utilisez `172.17.0.1` et non `localhost` si Midpoint tourne dans Docker.

### Via XML

Si vous configurez la ressource en XML :

```xml
<connectorConfiguration>
    <icfc:configurationProperties xmlns:gen="http://midpoint.evolveum.com/xml/ns/public/connector/icf-1/bundle/lu.lns.connector.restgateway/lu.lns.connector.restgateway.RestGatewayConnector">

        <!-- ✅ ACTIVER RABBITMQ -->
        <gen:useRabbitmq>true</gen:useRabbitmq>

        <!-- Configuration RabbitMQ -->
        <gen:rabbitmqHost>172.17.0.1</gen:rabbitmqHost>
        <gen:rabbitmqPort>5672</gen:rabbitmqPort>
        <gen:rabbitmqUsername>admin</gen:rabbitmqUsername>
        <gen:rabbitmqPassword>admin123</gen:rabbitmqPassword>
        <gen:rabbitmqQueue>midpoint-operations</gen:rabbitmqQueue>

        <!-- Configuration HTTP (ignorée si useRabbitmq=true) -->
        <gen:gatewayUrl>http://localhost:5000</gen:gatewayUrl>
        <gen:connectionTimeout>30000</gen:connectionTimeout>
        <gen:requestTimeout>60000</gen:requestTimeout>
        <gen:validateSsl>true</gen:validateSsl>
    </icfc:configurationProperties>
</connectorConfiguration>
```

---

## 🎯 Utilisation

### Test de connexion

Dans Midpoint :
1. Aller sur votre ressource Gateway
2. Cliquer sur **Test Connection**

Vous devriez voir : ✅ **Connection successful**

### Créer un utilisateur

1. Aller dans **Users** → **New User**
2. Remplir les informations :
   - **Name** : `jdoe`
   - **Given Name** : `John`
   - **Family Name** : `Doe`
   - **Email** : `john.doe@example.com`
3. Assigner la ressource Gateway
4. Cliquer sur **Save**

### Vérifier la réception

Dans le terminal du consumer Python, vous verrez :

```
======================================================================
📨 CREATE - User - 2026-01-21T10:30:00Z
======================================================================
{
  "operation": "CREATE",
  "entityType": "User",
  "timestamp": "2026-01-21T10:30:00Z",
  "uid": "jdoe",
  "attributes": {
    "username": "jdoe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "enabled": true
  }
}
======================================================================
```

---

## 📊 Exemple de flux

### Opération CREATE

```json
{
  "operation": "CREATE",
  "entityType": "User",
  "timestamp": "2026-01-21T10:30:00Z",
  "uid": "jdoe",
  "attributes": {
    "username": "jdoe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "enabled": true,
    "roles": ["Employee", "Developer"]
  }
}
```

### Opération UPDATE

```json
{
  "operation": "UPDATE",
  "entityType": "User",
  "timestamp": "2026-01-21T10:35:00Z",
  "uid": "jdoe",
  "attributes": {
    "email": "john.newemail@example.com",
    "roles": ["Employee", "Developer", "TeamLead"]
  }
}
```

### Opération DELETE

```json
{
  "operation": "DELETE",
  "entityType": "User",
  "timestamp": "2026-01-21T10:40:00Z",
  "uid": "jdoe",
  "attributes": {}
}
```

---

## 🔄 Basculer entre HTTP et RabbitMQ

### Mode HTTP

Dans Midpoint, mettre :
- **Use RabbitMQ** : ❌ `false`

Le connecteur enverra les requêtes HTTP vers `Gateway URL`.

### Mode RabbitMQ

Dans Midpoint, mettre :
- **Use RabbitMQ** : ✅ `true`

Le connecteur publiera les messages dans RabbitMQ.

---

## 🛠️ Personnaliser le consumer

Le fichier `gateway-rabbitmq-consumer.py` contient une fonction `callback()` où vous pouvez ajouter votre logique :

```python
def callback(ch, method, properties, body):
    data = json.loads(body)

    # Affichage du message
    print(json.dumps(data, indent=2))

    # ========================================
    # 👇 AJOUTEZ VOTRE LOGIQUE ICI
    # ========================================

    if data["operation"] == "CREATE":
        # Envoyer vers votre API
        # requests.post("https://api.example.com/users", json=data)
        pass

    elif data["operation"] == "UPDATE":
        # Mettre à jour dans votre BD
        # db.users.update({"uid": data["uid"]}, data["attributes"])
        pass

    elif data["operation"] == "DELETE":
        # Supprimer de votre système
        # requests.delete(f"https://api.example.com/users/{data['uid']}")
        pass

    # Acknowledge le message
    ch.basic_ack(delivery_tag=method.delivery_tag)
```

---

## 🐞 Troubleshooting

### Le test de connexion échoue

**Erreur** : `Failed to initialize RabbitMQ client`

**Solutions** :
1. Vérifier que RabbitMQ est démarré : `docker ps | grep rabbitmq`
2. Vérifier l'IP : `172.17.0.1` (pas `localhost` si Midpoint est dans Docker)
3. Vérifier les credentials : `admin` / `admin123`

### Les messages n'arrivent pas au consumer

**Solutions** :
1. Vérifier que le consumer est lancé
2. Vérifier le nom de la queue : `midpoint-operations`
3. Vérifier dans l'interface RabbitMQ (http://localhost:15672) si les messages sont dans la queue

### Le JAR ne se compile pas

**Erreur** : `Could not resolve com.rabbitmq:amqp-client`

**Solution** : Vérifier votre connexion Internet et relancer `./gradlew clean jar`

---

## 📚 Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `build.gradle` | Ajout dépendance RabbitMQ |
| `RabbitMQClient.java` | **NOUVEAU** - Client RabbitMQ |
| `RestGatewayConfiguration.java` | Ajout 6 propriétés RabbitMQ |
| `RestGatewayConnector.java` | Support double mode HTTP/RabbitMQ |
| `Messages.properties` | Labels UI pour RabbitMQ |

---

## ✅ Checklist de déploiement

- [ ] RabbitMQ démarré (`docker-compose up -d`)
- [ ] Nouveau JAR compilé avec support RabbitMQ
- [ ] JAR copié dans Midpoint
- [ ] Midpoint redémarré
- [ ] Ressource configurée avec `useRabbitmq=true`
- [ ] Consumer Python lancé
- [ ] Test de connexion réussi dans Midpoint
- [ ] Test de création d'utilisateur réussi

---

## 🎉 Prêt !

Votre connecteur Midpoint avec RabbitMQ est maintenant opérationnel !

Pour toute question, vérifiez les logs :
- **Midpoint** : `docker logs midpoint`
- **RabbitMQ** : `docker logs rabbitmq-midpoint`
- **Consumer** : Visible dans le terminal
