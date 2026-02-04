# SAE5-All - Gateway de Provisioning MidPoint

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  MIDPOINT   │────▶│ Java Connector   │────▶│   RabbitMQ   │────▶│ Python Consumer │
│  (IAM)      │     │ (RestGateway)    │     │   (Queue)    │     │                 │
└─────────────┘     └──────────────────┘     └──────────────┘     └────────┬────────┘
                                                                           │
                                              ┌────────────────────────────┼────────────────────────────┐
                                              ▼                            ▼                            ▼
                                         ┌─────────┐                  ┌─────────┐                  ┌─────────┐
                                         │  LDAP   │                  │  Odoo   │                  │   SQL   │
                                         └─────────┘                  └─────────┘                  └─────────┘
```

## Structure du Projet

```
SAE5-All/
├── idm-connector-rest-gateway/        # Connecteur Java MidPoint
│   └── src/main/java/lu/lns/connector/restgateway/
│       ├── RestGatewayConnector.java       # Connecteur (CREATE/UPDATE/DELETE)
│       ├── RestGatewayConfiguration.java   # Configuration
│       ├── RabbitMQClient.java             # Client RabbitMQ
│       └── JsonMapper.java                 # Conversion → JSON
│
├── front-head/                        # Front-end configuration
│   ├── connecteurs.html                    # Page sélection connecteurs
│   ├── utilisateurs.html                   # Page gestion utilisateurs
│   ├── css/style.css
│   └── js/app.js
│
├── roles/                             # Rôles MidPoint XML
│   ├── role-ldap.xml                       # Role LDAP (avec ldapGroups)
│   ├── role-odoo.xml                       # Role Odoo
│   └── role-sql.xml                        # Role SQL
│
├── RabbitMQ/
│   └── docker-compose-rabbitmq.yml    # Docker RabbitMQ
│
├── consumer-rabbitmq.py               # Consumer Python
└── config.json                        # Configuration connecteurs
```

## Les 3 Rôles MidPoint

| Rôle | Description | Attribut spécial |
|------|-------------|------------------|
| `ldap` | Provisionne vers LDAP | `ldapGroups` avec DN complet |
| `odoo` | Provisionne vers Odoo | `roles: odoo` |
| `sql` | Provisionne vers SQL | `roles: sql` |

Chaque rôle mappe tous les attributs utilisateur en outbound.

## Attributs Mappés

| Attribut Connector | Source MidPoint |
|--------------------|-----------------|
| `icfs:name` | `$focus/name` |
| `ri:firstName` | `$focus/givenName` |
| `ri:lastName` | `$focus/familyName` |
| `ri:fullName` | `$focus/fullName` |
| `ri:email` | `$focus/emailAddress` |
| `ri:telephoneNumber` | `$focus/telephoneNumber` |
| `ri:title` | `$focus/title` |
| `ri:description` | `$focus/description` |
| `ri:locality` | `$focus/locality` |
| `ri:organization` | `$focus/organization` |
| `ri:organizationalUnit` | `$focus/organizationalUnit` |
| `ri:costCenter` | `$focus/costCenter` |
| `ri:preferredLanguage` | `$focus/preferredLanguage` |
| `ri:locale` | `$focus/locale` |
| `ri:timezone` | `$focus/timezone` |
| `ri:roles` | Nom du rôle (ldap/odoo/sql) |
| `ri:ldapGroups` | DN du groupe LDAP (role ldap seulement) |

## Format Message JSON (RabbitMQ)

```json
{
  "operation": "UPDATE",
  "entityType": "User",
  "uid": "0536914d-4f98-43e9-8003-c4b43031088a",
  "attributes": {
    "username": "Sami2",
    "firstName": "Sami2",
    "lastName": "Sami2",
    "fullName": "Sami2 Sami2",
    "roles": ["ldap", "odoo"],
    "ldapGroups": ["cn=LDAP-Users,ou=Groups,dc=example,dc=com"]
  }
}
```

## Configuration RabbitMQ

| Paramètre | Valeur |
|-----------|--------|
| Host | localhost |
| Port AMQP | 5672 |
| Port Web UI | 15672 |
| User | admin |
| Password | admin123 |
| Queue | midpoint-operations |

## Commandes

```bash
# Démarrer RabbitMQ
docker-compose -f RabbitMQ/docker-compose-rabbitmq.yml up -d

# Build le connecteur Java
cd idm-connector-rest-gateway && ./gradlew clean jar

# Déployer dans MidPoint
docker cp build/libs/connector-restgateway-*.jar midpoint:/opt/midpoint/var/icf-connectors/
docker restart midpoint

# Lancer le consumer Python
python consumer-rabbitmq.py
```

## Workflow

1. **Créer un utilisateur** dans MidPoint avec ses attributs
2. **Assigner un rôle** (ldap, odoo ou sql)
3. Le rôle **provisionne automatiquement** vers la ressource RabbitMQ
4. Le **consumer Python** reçoit le message avec tous les attributs
5. Le consumer peut ensuite **router vers LDAP/Odoo/SQL** selon le rôle

## Ressource MidPoint

OID de la ressource RabbitMQ : `736ea741-2c73-4478-b5d1-07d84cdf860f`

Pour changer, modifier le `resourceRef` dans les fichiers `roles/*.xml`.
