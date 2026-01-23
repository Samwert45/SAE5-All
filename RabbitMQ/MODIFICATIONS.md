# 📝 Modifications apportées pour le support RabbitMQ

Ce document liste toutes les modifications apportées au connecteur pour supporter RabbitMQ.

---

## 📁 Structure du dossier RabbitMQ

```
RabbitMQ/
├── connector-modifications/        # Fichiers Java modifiés
│   ├── build.gradle               # ✅ Ajout dépendance RabbitMQ
│   ├── RabbitMQClient.java        # 🆕 Client RabbitMQ
│   ├── RestGatewayConfiguration.java  # ✅ +6 propriétés RabbitMQ
│   ├── RestGatewayConnector.java  # ✅ Support double mode
│   └── Messages.properties        # ✅ Labels UI RabbitMQ
├── docker-compose-rabbitmq.yml    # 🆕 Docker RabbitMQ
├── gateway-rabbitmq-consumer.py   # 🆕 Consumer Python
├── apply-rabbitmq-support.sh      # 🆕 Script d'installation
├── README-RABBITMQ.md             # 🆕 Documentation complète
├── QUICKSTART.md                  # 🆕 Guide rapide
└── MODIFICATIONS.md               # 🆕 Ce fichier
```

---

## 🔧 Fichiers modifiés

### 1. `build.gradle`

**Modifications :**
- Changement des dépendances ConnId de `implementation` à `compileOnly`
- Ajout de la dépendance RabbitMQ : `com.rabbitmq:amqp-client:5.20.0`
- Configuration du JAR pour inclure toutes les dépendances

**Diff clé :**
```gradle
dependencies {
    // ConnId Framework - compileOnly pour ne pas inclure dans le JAR
    compileOnly("net.tirasa.connid:connector-framework:${connidVersion}")
    compileOnly("com.evolveum.polygon:connector-common:${polygonVersion}") {
        exclude group: 'net.tirasa.connid', module: 'connector-framework'
    }

    // JSON processing - inclus dans le JAR
    implementation 'com.google.code.gson:gson:2.10.1'

    // RabbitMQ client - inclus dans le JAR ⬅️ NOUVEAU
    implementation 'com.rabbitmq:amqp-client:5.20.0'

    // Logging
    implementation 'org.slf4j:slf4j-api:1.7.36'
}

jar {
    // Inclure toutes les dépendances dans le JAR ⬅️ NOUVEAU
    from {
        configurations.runtimeClasspath.collect { it.isDirectory() ? it : zipTree(it) }
    }
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}
```

**Impact :** Le JAR passe de ~300KB à ~1MB avec RabbitMQ.

---

### 2. `RabbitMQClient.java` 🆕

**Nouveau fichier** qui gère la connexion et publication vers RabbitMQ.

**Fonctionnalités :**
- `init()` : Établit la connexion RabbitMQ
- `publish(String jsonMessage)` : Publie un message dans la queue
- `testConnection()` : Test de la connexion
- `close()` : Ferme la connexion proprement

**Code clé :**
```java
public void init() throws IOException, TimeoutException {
    ConnectionFactory factory = new ConnectionFactory();
    factory.setHost(configuration.getRabbitmqHost());
    factory.setPort(configuration.getRabbitmqPort());
    factory.setUsername(configuration.getRabbitmqUsername());
    factory.setPassword(configuration.getRabbitmqPassword());

    this.connection = factory.newConnection();
    this.channel = connection.createChannel();

    String queueName = configuration.getRabbitmqQueue();
    channel.queueDeclare(queueName, true, false, false, null);
}

public void publish(String jsonMessage) throws IOException {
    String queueName = configuration.getRabbitmqQueue();
    channel.basicPublish("", queueName, null,
        jsonMessage.getBytes(StandardCharsets.UTF_8));
}
```

---

### 3. `RestGatewayConfiguration.java`

**Modifications :**
- Ajout de 6 nouvelles propriétés RabbitMQ
- Validation conditionnelle selon le mode choisi

**Nouvelles propriétés :**
```java
// Configuration RabbitMQ
private Boolean useRabbitmq = false;           // ⬅️ Switch HTTP/RabbitMQ
private String rabbitmqHost = "localhost";
private Integer rabbitmqPort = 5672;
private String rabbitmqUsername = "admin";
private String rabbitmqPassword = "admin123";
private String rabbitmqQueue = "midpoint-operations";
```

**Validation :**
```java
@Override
public void validate() {
    if (Boolean.FALSE.equals(useRabbitmq)) {
        // Valider config HTTP Gateway
    }

    if (Boolean.TRUE.equals(useRabbitmq)) {
        // Valider config RabbitMQ
    }
}
```

**Interface Midpoint :**
Les propriétés sont exposées dans l'UI avec `@ConfigurationProperty`.

---

### 4. `RestGatewayConnector.java`

**Modifications :**
- Ajout du client RabbitMQ comme attribut
- Initialisation conditionnelle selon `useRabbitmq`
- Méthode `sendMessage()` pour router vers HTTP ou RabbitMQ
- Test de connexion adapté au mode

**Diff clé :**

**Avant :**
```java
public class RestGatewayConnector {
    private RestGatewayClient client;

    public void init(Configuration configuration) {
        this.client = new RestGatewayClient(this.configuration);
    }

    public Uid create(...) {
        client.post("/create", jsonPayload);
    }
}
```

**Après :**
```java
public class RestGatewayConnector {
    private RestGatewayClient client;
    private RabbitMQClient rabbitmqClient;  // ⬅️ NOUVEAU

    public void init(Configuration configuration) {
        if (Boolean.TRUE.equals(this.configuration.getUseRabbitmq())) {
            this.rabbitmqClient = new RabbitMQClient(this.configuration);
            this.rabbitmqClient.init();
        } else {
            this.client = new RestGatewayClient(this.configuration);
        }
    }

    public Uid create(...) {
        sendMessage(jsonPayload);  // ⬅️ Route vers HTTP ou RabbitMQ
    }

    private void sendMessage(String jsonPayload) {
        if (Boolean.TRUE.equals(configuration.getUseRabbitmq())) {
            rabbitmqClient.publish(jsonPayload);
        } else {
            client.post(endpoint, jsonPayload);
        }
    }
}
```

---

### 5. `Messages.properties`

**Modifications :**
- Ajout des labels UI pour les 6 propriétés RabbitMQ

**Ajouts :**
```properties
# RabbitMQ Configuration
useRabbitmq.display=Use RabbitMQ
useRabbitmq.help=Enable RabbitMQ mode instead of HTTP Gateway...

rabbitmqHost.display=RabbitMQ Host
rabbitmqHost.help=RabbitMQ server hostname or IP address...

rabbitmqPort.display=RabbitMQ Port
rabbitmqPort.help=RabbitMQ server port (default: 5672 for AMQP)

rabbitmqUsername.display=RabbitMQ Username
rabbitmqUsername.help=Username for RabbitMQ authentication

rabbitmqPassword.display=RabbitMQ Password
rabbitmqPassword.help=Password for RabbitMQ authentication

rabbitmqQueue.display=RabbitMQ Queue Name
rabbitmqQueue.help=Name of the queue where messages will be published
```

---

## 🆕 Nouveaux fichiers

### 1. `docker-compose-rabbitmq.yml`

Déploiement Docker de RabbitMQ avec :
- Port AMQP : 5672
- Interface Web : 15672
- Credentials : admin/admin123
- Volume persistant pour les données

### 2. `gateway-rabbitmq-consumer.py`

Consumer Python qui :
- Se connecte à RabbitMQ
- Écoute la queue `midpoint-operations`
- Affiche les messages CREATE/UPDATE/DELETE
- Peut être personnalisé pour envoyer vers un système cible

### 3. `apply-rabbitmq-support.sh`

Script d'installation automatique qui :
1. Copie les fichiers modifiés
2. Compile le connecteur
3. Démarre RabbitMQ
4. Installe le JAR dans Midpoint
5. Redémarre Midpoint

### 4. Documentation

- `README-RABBITMQ.md` : Documentation complète
- `QUICKSTART.md` : Guide de démarrage rapide
- `MODIFICATIONS.md` : Ce fichier

---

## 🔄 Compatibilité

### Mode HTTP (par défaut)

Si `useRabbitmq = false` :
- ✅ Fonctionne exactement comme avant
- ✅ Aucun impact sur l'existant
- ✅ Utilise RestGatewayClient

### Mode RabbitMQ

Si `useRabbitmq = true` :
- ✅ Utilise RabbitMQClient
- ✅ Les propriétés HTTP sont ignorées
- ✅ Messages publiés dans la queue RabbitMQ

**Aucune modification n'est destructrice** - le mode HTTP continue de fonctionner.

---

## 📊 Impact sur la taille du JAR

| Version | Taille | Contenu |
|---------|--------|---------|
| Avant (HTTP seul) | ~300 KB | Gson uniquement |
| Après (HTTP + RabbitMQ) | ~1 MB | Gson + RabbitMQ client |

---

## ✅ Tests effectués

- [x] Compilation du JAR avec RabbitMQ
- [x] Mode HTTP fonctionne toujours
- [x] Mode RabbitMQ : CREATE opération
- [x] Mode RabbitMQ : UPDATE opération
- [x] Mode RabbitMQ : DELETE opération
- [x] Test de connexion RabbitMQ
- [x] Consumer Python reçoit les messages
- [x] Interface Midpoint affiche les nouvelles propriétés

---

## 🎯 Pour appliquer les modifications

### Option 1 : Script automatique (recommandé)

```bash
cd SAE5-All
bash RabbitMQ/apply-rabbitmq-support.sh
```

### Option 2 : Manuel

```bash
# 1. Copier les fichiers
cp RabbitMQ/connector-modifications/* idm-connector-rest-gateway/...

# 2. Compiler
cd idm-connector-rest-gateway
./gradlew clean jar

# 3. Installer
docker cp build/libs/connector-restgateway-1.0.0-SNAPSHOT.jar midpoint:/opt/midpoint/var/icf-connectors/
docker restart midpoint

# 4. Démarrer RabbitMQ
cd ../RabbitMQ
docker-compose -f docker-compose-rabbitmq.yml up -d

# 5. Lancer le consumer
python3 gateway-rabbitmq-consumer.py
```

---

## 📚 Ressources

- [Documentation RabbitMQ](https://www.rabbitmq.com/documentation.html)
- [Pika (Python RabbitMQ client)](https://pika.readthedocs.io/)
- [ConnId Framework](https://connid.tirasa.net/)

---

**Dernière mise à jour** : 2026-01-21
