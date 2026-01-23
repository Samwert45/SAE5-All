/**
 * Application State - Stockage dynamique en mémoire
 */
const AppState = {
    // Connecteurs sélectionnés
    connecteurs: [],

    // Configuration des connecteurs
    configs: {
        Odoo: {
            host: '',
            port: '8069',
            database: '',
            username: '',
            apiKey: ''
        },
        SQL: {
            host: '',
            port: '3306',
            database: '',
            username: '',
            password: ''
        },
        LDAP: {
            host: '',
            port: '389',
            baseDn: '',
            bindDn: '',
            password: ''
        }
    },

    // Liste des utilisateurs
    utilisateurs: [],

    // Charger depuis localStorage
    load() {
        const savedConnecteurs = localStorage.getItem('connecteurs');
        const savedConfigs = localStorage.getItem('configs');
        const savedUtilisateurs = localStorage.getItem('utilisateurs');

        if (savedConnecteurs) {
            this.connecteurs = JSON.parse(savedConnecteurs);
        }
        if (savedConfigs) {
            this.configs = { ...this.configs, ...JSON.parse(savedConfigs) };
        }
        if (savedUtilisateurs) {
            this.utilisateurs = JSON.parse(savedUtilisateurs);
        }
    },

    // Sauvegarder dans localStorage
    save() {
        localStorage.setItem('connecteurs', JSON.stringify(this.connecteurs));
        localStorage.setItem('configs', JSON.stringify(this.configs));
        localStorage.setItem('utilisateurs', JSON.stringify(this.utilisateurs));
    },

    // Ajouter/Retirer un connecteur
    toggleConnecteur(name) {
        const index = this.connecteurs.indexOf(name);
        if (index === -1) {
            this.connecteurs.push(name);
        } else {
            this.connecteurs.splice(index, 1);
        }
        this.save();
    },

    // Vérifier si un connecteur est sélectionné
    isConnecteurSelected(name) {
        return this.connecteurs.includes(name);
    },

    // Mettre à jour la config d'un connecteur
    updateConfig(connecteur, field, value) {
        if (this.configs[connecteur]) {
            this.configs[connecteur][field] = value;
            this.save();
        }
    },

    // Obtenir la config d'un connecteur
    getConfig(connecteur) {
        return this.configs[connecteur] || {};
    },

    // Ajouter un utilisateur
    addUtilisateur(email, importance) {
        const user = {
            id: Date.now(),
            email: email,
            importance: parseInt(importance),
            createdAt: new Date().toISOString()
        };
        this.utilisateurs.push(user);
        this.save();
        return user;
    },

    // Supprimer un utilisateur
    removeUtilisateur(id) {
        this.utilisateurs = this.utilisateurs.filter(u => u.id !== id);
        this.save();
    },

    // Obtenir les utilisateurs triés par importance
    getUtilisateursSorted() {
        return [...this.utilisateurs].sort((a, b) => b.importance - a.importance);
    }
};

/**
 * Toast notifications
 */
function showToast(message, type = 'info') {
    // Supprimer les anciens toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Page Connecteurs
 */
function initConnecteursPage() {
    const connecteurItems = document.querySelectorAll('.connecteur-item');
    const summaryContainer = document.getElementById('selected-summary');

    // Initialiser l'état des checkboxes
    connecteurItems.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const name = checkbox.value;

        // Restaurer l'état
        if (AppState.isConnecteurSelected(name)) {
            checkbox.checked = true;
            item.classList.add('selected');
        }

        // Event listener
        item.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                checkbox.checked = !checkbox.checked;
            }

            item.classList.toggle('selected', checkbox.checked);
            AppState.toggleConnecteur(name);
            updateConnecteursSummary();
            renderConfigPanels();
        });
    });

    // Initialiser les panneaux de config
    initConfigPanels();
    updateConnecteursSummary();
    renderConfigPanels();

    function updateConnecteursSummary() {
        if (!summaryContainer) return;

        const selected = AppState.connecteurs;

        if (selected.length === 0) {
            summaryContainer.innerHTML = '<p class="empty-state">Aucun connecteur sélectionné</p>';
        } else {
            summaryContainer.innerHTML = `
                <h3>Connecteurs actifs (${selected.length})</h3>
                <div class="summary-items">
                    ${selected.map(c => `<span class="summary-item">${c}</span>`).join('')}
                </div>
            `;
        }
    }
}

/**
 * Configuration des connecteurs
 */
function initConfigPanels() {
    // Toggle des panneaux
    document.querySelectorAll('.config-header').forEach(header => {
        header.addEventListener('click', () => {
            const panel = header.closest('.config-panel');
            panel.classList.toggle('open');
        });
    });

    // Sauvegarde automatique des champs
    document.querySelectorAll('.config-panel input').forEach(input => {
        const connecteur = input.dataset.connecteur;
        const field = input.dataset.field;

        // Restaurer la valeur
        const savedValue = AppState.getConfig(connecteur)[field];
        if (savedValue) {
            input.value = savedValue;
        }

        // Sauvegarde à chaque modification
        input.addEventListener('input', () => {
            AppState.updateConfig(connecteur, field, input.value);
            showToast('Configuration sauvegardée', 'success');
        });
    });

    // Boutons de test
    document.querySelectorAll('.btn-test').forEach(btn => {
        btn.addEventListener('click', () => {
            const connecteur = btn.dataset.connecteur;
            testConnection(connecteur);
        });
    });
}

function renderConfigPanels() {
    const configSection = document.getElementById('config-section');
    if (!configSection) return;

    const panels = configSection.querySelectorAll('.config-panel');
    panels.forEach(panel => {
        const connecteur = panel.dataset.connecteur;
        if (AppState.isConnecteurSelected(connecteur)) {
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    });

    // Afficher/masquer la section entière
    const hasSelected = AppState.connecteurs.length > 0;
    configSection.style.display = hasSelected ? 'block' : 'none';
}

function testConnection(connecteur) {
    const config = AppState.getConfig(connecteur);
    const statusDot = document.querySelector(`.config-panel[data-connecteur="${connecteur}"] .status-dot`);

    // Vérifier que les champs requis sont remplis
    if (!config.host) {
        showToast(`Veuillez renseigner l'adresse IP pour ${connecteur}`, 'error');
        return;
    }

    // Simuler un test de connexion
    showToast(`Test de connexion à ${connecteur}...`, 'info');

    if (statusDot) {
        statusDot.className = 'status-dot';
    }

    // Simulation (dans la vraie vie, ce serait un appel API)
    setTimeout(() => {
        const success = config.host && config.port;

        if (statusDot) {
            statusDot.classList.add(success ? 'connected' : 'error');
        }

        if (success) {
            showToast(`Connexion à ${connecteur} réussie !`, 'success');
        } else {
            showToast(`Échec de connexion à ${connecteur}`, 'error');
        }
    }, 1000);
}

/**
 * Page Utilisateurs
 */
function initUtilisateursPage() {
    const form = document.getElementById('user-form');
    const usersList = document.getElementById('users-list');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const importance = document.getElementById('importance').value;

            if (!email) {
                showToast('Veuillez entrer un email', 'error');
                return;
            }

            AppState.addUtilisateur(email, importance);
            form.reset();
            renderUsersList();
            showToast('Utilisateur ajouté', 'success');
        });
    }

    renderUsersList();

    function renderUsersList() {
        if (!usersList) return;

        const users = AppState.getUtilisateursSorted();

        if (users.length === 0) {
            usersList.innerHTML = '<p class="empty-state">Aucun utilisateur enregistré</p>';
            return;
        }

        usersList.innerHTML = users.map(user => `
            <div class="user-item" data-id="${user.id}">
                <div class="user-info">
                    <div class="user-avatar">${user.email.charAt(0).toUpperCase()}</div>
                    <div class="user-details">
                        <h3>${user.email}</h3>
                        <p>Ajouté le ${new Date(user.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>
                <div class="user-importance">
                    <span class="importance-badge importance-${user.importance}">
                        Niveau ${user.importance}
                    </span>
                    <button class="btn-delete" onclick="deleteUser(${user.id})">×</button>
                </div>
            </div>
        `).join('');
    }

    // Exposer la fonction de suppression
    window.deleteUser = function(id) {
        AppState.removeUtilisateur(id);
        renderUsersList();
        showToast('Utilisateur supprimé', 'success');
    };
}

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', () => {
    // Charger l'état sauvegardé
    AppState.load();

    // Détecter la page actuelle et initialiser
    if (document.getElementById('connecteurs-page')) {
        initConnecteursPage();
    }

    if (document.getElementById('utilisateurs-page')) {
        initUtilisateursPage();
    }

    // Marquer le lien actif dans la navigation
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('nav a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
});
