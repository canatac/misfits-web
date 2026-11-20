# language: fr
Fonctionnalité: Email cheat sheet — modal des raccourcis clavier avec recherche (MW-2026-122)
  Les utilisateurs actuels ne connaissent pas les raccourcis clavier disponibles.
  Un cheat sheet accessible depuis le composer ou l'inbox améliore la productivité.

  Contexte:
    Etant donné que l'utilisateur est connecté à misfits.ai Mail
    Et que l'utilisateur est sur la boîte de réception

  @AC1
  Scénario: Le modal du cheat sheet s'affiche via le bouton de la barre d'outils du composer
    Quand l'utilisateur ouvre le composer
    Et qu'il active le bouton d'aide des raccourcis de la barre d'outils
    Alors le modal du cheat sheet est affiché

  @AC2
  Scénario: Le raccourci clavier "?" ouvre le cheat sheet depuis l'inbox
    Quand l'utilisateur appuie sur la touche "?" depuis la boîte de réception
    Alors le modal du cheat sheet est affiché

  @AC3
  Scénario: Les raccourcis sont groupés par catégorie
    Quand le modal du cheat sheet est affiché
    Alors les raccourcis sont groupés par catégorie Navigation, Composition, Actions et Recherche

  @AC4
  Scénario: Recherche ou filtre par nom de raccourci
    Quand le modal du cheat sheet est affiché
    Et que l'utilisateur saisit le nom d'un raccourci dans la recherche
    Alors seuls les raccourcis dont le nom correspond sont affichés

  @AC5
  Scénario: Lien vers la documentation complète
    Quand le modal du cheat sheet est affiché
    Alors un lien vers la documentation complète est affiché

  @AC6
  Scénario: Fermeture via Escape
    Quand le modal du cheat sheet est affiché
    Et que l'utilisateur appuie sur la touche Escape
    Alors le modal du cheat sheet est fermé

  @AC6
  Scénario: Fermeture via un clic en dehors
    Quand le modal du cheat sheet est affiché
    Et que l'utilisateur clique en dehors du modal
    Alors le modal du cheat sheet est fermé

  @AC7
  Scénario: Test Gherkin PASS pour MW-2026-122
    Etant donné que les scénarios @AC1 à @AC6 de l'issue 1026 sont exécutés
    Alors le test Gherkin MW-2026-122 est PASS
