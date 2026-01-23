#!/usr/bin/env python3
"""
Consumer RabbitMQ - Reçoit les messages de Midpoint
"""

import pika
import json
import sys

# Configuration RabbitMQ
RABBITMQ_HOST = 'localhost'
RABBITMQ_PORT = 5672
RABBITMQ_USER = 'admin'
RABBITMQ_PASS = 'admin123'
RABBITMQ_QUEUE = 'midpoint-operations'


def print_separator():
    print("=" * 70)


def callback(ch, method, properties, body):
    """Callback quand un message arrive"""
    try:
        data = json.loads(body)

        operation = data.get("operation", "UNKNOWN")
        entity_type = data.get("entityType", "Unknown")
        uid = data.get("uid", "N/A")
        attributes = data.get("attributes", {})

        # Extraire les infos importantes
        username = attributes.get('__NAME__', uid)
        roles = attributes.get('roles', [])
        ldap_groups = attributes.get('ldapGroups', [])

        # Convertir en liste si c'est une string
        if isinstance(roles, str):
            roles = [roles]
        if isinstance(ldap_groups, str):
            ldap_groups = [ldap_groups]

        print_separator()
        print(f"📨 {operation} - {entity_type}")
        print_separator()
        print(f"   UID:      {uid}")
        print(f"   Username: {username}")
        print_separator()

        # Afficher les rôles
        if roles:
            print("📋 ROLES:")
            for role in roles:
                print(f"   • {role}")
        else:
            print("📋 ROLES: (aucun)")

        print_separator()

        # Afficher les groupes LDAP
        if ldap_groups:
            print("📂 GROUPES LDAP:")
            for group in ldap_groups:
                print(f"   • {group}")
        else:
            print("📂 GROUPES LDAP: (aucun)")

        print_separator()

        # Afficher tous les autres attributs
        print("📝 AUTRES ATTRIBUTS:")
        for key, value in attributes.items():
            if key not in ['__NAME__', 'roles', 'ldapGroups', '__UID__']:
                if value:
                    print(f"   {key}: {value}")

        print_separator()
        print()

        # Acknowledge le message
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except json.JSONDecodeError as e:
        print(f"❌ Erreur JSON: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception as e:
        print(f"❌ Erreur: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def main():
    print_separator()
    print("🐰 Consumer RabbitMQ - Midpoint Gateway")
    print_separator()
    print(f"Host: {RABBITMQ_HOST}:{RABBITMQ_PORT}")
    print(f"Queue: {RABBITMQ_QUEUE}")
    print_separator()

    try:
        # Connexion à RabbitMQ
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
        parameters = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=credentials,
            heartbeat=60
        )

        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        # Déclarer la queue
        channel.queue_declare(queue=RABBITMQ_QUEUE, durable=True)

        print("✅ Connecté à RabbitMQ")
        print(f"⏳ En attente de messages sur '{RABBITMQ_QUEUE}'...")
        print("   (Ctrl+C pour arrêter)")
        print_separator()
        print()

        # Consommer les messages
        channel.basic_qos(prefetch_count=1)
        channel.basic_consume(
            queue=RABBITMQ_QUEUE,
            on_message_callback=callback
        )

        channel.start_consuming()

    except KeyboardInterrupt:
        print("\n")
        print_separator()
        print("🛑 Arrêt du consumer")
        print_separator()
        sys.exit(0)
    except pika.exceptions.AMQPConnectionError as e:
        print(f"❌ Erreur connexion RabbitMQ: {e}")
        print("\nVérifie que RabbitMQ est démarré :")
        print("  docker-compose -f docker-compose-rabbitmq.yml up -d")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erreur: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
