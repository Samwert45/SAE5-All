# ⚡ Démarrage Rapide - Connecteur RabbitMQ

Guide ultra-rapide pour activer RabbitMQ dans le connecteur Midpoint.

---

## 🚀 Installation en 1 commande

```bash
cd SAE5-All
bash RabbitMQ/apply-rabbitmq-support.sh
```

Ce script va :
1. ✅ Copier les fichiers modifiés
2. ✅ Compiler le connecteur avec support RabbitMQ
3. ✅ Démarrer RabbitMQ Docker
4. ✅ Installer le JAR dans Midpoint
5. ✅ Redémarrer Midpoint

---

## 🎯 Après l'installation

### 1. Installer la dépendance Python

```bash
pip install pika
```

### 2. Lancer le consumer RabbitMQ

```bash
cd SAE5-All/RabbitMQ
python3 gateway-rabbitmq-consumer.py
```

Vous verrez :
```
🐰 Gateway RabbitMQ Consumer - Midpoint Connector
✅ Connecté à RabbitMQ
⏳ En attente de messages sur la queue 'midpoint-operations'...
```

### 3. Configurer la ressource dans Midpoint

Dans l'interface Midpoint :

1. Aller dans **Resources** → Votre ressource Gateway
2. Cliquer sur **Configuration**
3. Activer RabbitMQ avec ces valeurs :

| Paramètre | Valeur |
|-----------|--------|
| **Use RabbitMQ** | ✅ `true` |
| **RabbitMQ Host** | `172.17.0.1` |
| **RabbitMQ Port** | `5672` |
| **RabbitMQ Username** | `admin` |
| **RabbitMQ Password** | `admin123` |
| **RabbitMQ Queue** | `midpoint-operations` |

4. Cliquer sur **Test Connection** → ✅ Success

---

## ✅ Test

### Créer un utilisateur dans Midpoint

1. **Users** → **New User**
2. Remplir :
   - Name: `test-user`
   - Given Name: `Test`
   - Family Name: `User`
   - Email: `test@example.com`
3. Assigner la ressource Gateway
4. **Save**

### Vérifier la réception

Dans le terminal du consumer Python :

```json
======================================================================
📨 CREATE - User - 2026-01-21T10:30:00Z
======================================================================
{
  "operation": "CREATE",
  "entityType": "User",
  "timestamp": "2026-01-21T10:30:00Z",
  "uid": "test-user",
  "attributes": {
    "username": "test-user",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "enabled": true
  }
}
======================================================================
```

---

## 🔧 Commandes utiles

### RabbitMQ

```bash
# Démarrer RabbitMQ
docker-compose -f RabbitMQ/docker-compose-rabbitmq.yml up -d

# Arrêter RabbitMQ
docker-compose -f RabbitMQ/docker-compose-rabbitmq.yml down

# Voir les logs
docker logs rabbitmq-midpoint

# Interface Web
# http://localhost:15672 (admin/admin123)
```

### Midpoint

```bash
# Redémarrer Midpoint
docker restart midpoint

# Voir les logs
docker logs -f midpoint
```

---

## 🐞 Problèmes ?

### Le test de connexion échoue

Vérifier que RabbitMQ est démarré :
```bash
docker ps | grep rabbitmq
```

Si non démarré :
```bash
cd SAE5-All/RabbitMQ
docker-compose -f docker-compose-rabbitmq.yml up -d
```

### Les messages n'arrivent pas

1. Vérifier que le consumer est lancé
2. Vérifier l'IP : `172.17.0.1` (PAS `localhost`)
3. Vérifier les credentials : `admin` / `admin123`

---

## 📚 Documentation complète

Pour plus de détails, voir [README-RABBITMQ.md](README-RABBITMQ.md)

---

## 🔄 Basculer en mode HTTP

Si tu veux revenir au mode HTTP simple :

Dans Midpoint, mettre :
- **Use RabbitMQ** : ❌ `false`

Et lancer la gateway HTTP au lieu du consumer :
```bash
cd SAE5-All
python3 gateway-http.py
```

---

## ✅ C'est tout !

Ton connecteur Midpoint avec RabbitMQ est prêt ! 🎉
