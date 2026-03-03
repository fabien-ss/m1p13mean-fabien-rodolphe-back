# Gitflow Setup pour Projet Express

## 1. Initialiser le dépôt git

    git init
    git add .
    git commit -m "Initial commit"

## 2. Installer Gitflow
    sudo apt-get install git-flow

## 3. Initialiser Gitflow dans le projet

## Workflow Gitflow typique

Branch principale de production : master

Branch de développement : develop

Préfixe des features : feature/

Préfixe des releases : release/

Préfixe des hotfixes : hotfix/

Préfixe des tags : v

### 4.1 Créer une nouvelle feature
    git flow feature start nouvelle-fonctionnalite
    # coder ta feature
    git add .
    git commit -m "Ajout de la nouvelle fonctionnalité"
    git flow feature finish nouvelle-fonctionnalite

### 4.2 Préparer une release
    git flow release start 1.0.0
    # ajustements finaux, versioning
    git flow release finish 1.0.0

### 4.3 Corriger un hotfix en production
    git flow hotfix start correction-bug
    # corriger le bug
    git add .
    git commit -m "Correction bug critique"
    git flow hotfix finish correction-bug

## 5. Push des branches sur le remote
    git push origin master
    git push origin develop
    git push --tags

# Notes

develop : branch pour le développement quotidien

master : branch stable prête pour production

feature/* : branches pour chaque nouvelle fonctionnalité

release/* : branches pour préparer une version

hotfix/* : branches pour corriger un bug urgent en production