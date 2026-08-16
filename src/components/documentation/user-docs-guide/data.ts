import type React from "react";
import {
  Compass,
  FileText,
  KeyRound,
  Inbox,
  PenSquare,
  UserCog,
  Sliders,
} from "lucide-react";

export interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CATEGORIES: Category[] = [
  { id: "all", label: "Guide complet", icon: Compass },
  { id: "overview", label: "1. Présentation", icon: FileText },
  { id: "signin", label: "2. Première connexion & 2FA", icon: KeyRound },
  { id: "inbox", label: "3. Boîte de réception", icon: Inbox },
  { id: "compose", label: "4. Rédiger un message", icon: PenSquare },
  { id: "account", label: "5. Comptes & préférences", icon: UserCog },
  { id: "shortcuts", label: "6. Raccourcis", icon: Sliders },
];

export const FAQ_LIST: { q: string; a: string }[] = [
  {
    q: "Comment activer la double authentification (2FA) sur mon compte ?",
    a: "Ouvrez Paramètres → Sécurité, puis choisissez « Activer la 2FA ». Scannez le QR code avec votre application d'authentification préférée (par exemple Google Authenticator, 1Password ou Authy) et confirmez avec le code à 6 chiffres. Conservez précieusement les codes de secours proposés.",
  },
  {
    q: "Comment retrouver un ancien message ?",
    a: "Utilisez la barre de recherche en haut de la boîte de réception, ou le raccourci ⌘/Ctrl+/. Vous pouvez filtrer par expéditeur, mot-clé, période ou dossier. Les résultats s'affichent au fil de la frappe.",
  },
  {
    q: "Puis-je organiser mes messages avec des dossiers ou des étoiles ?",
    a: "Oui. Marquez un message d'une étoile pour le retrouver rapidement, archivez-le lorsqu'il est traité, ou déplacez-le vers un dossier personnalisé depuis le menu d'actions ou par glisser-déposer.",
  },
  {
    q: "Est-ce que misfits.ai Mail lit le contenu de mes messages ?",
    a: "Vos messages restent privés. Les assistants intégrés ne s'activent que sur demande explicite (par exemple pour résumer un fil ou proposer une réponse), et vous gardez toujours le contrôle final sur ce qui est envoyé.",
  },
  {
    q: "Comment changer la langue de l'interface ou passer en mode sombre / clair ?",
    a: "Rendez-vous dans Paramètres → Apparence. Vous pouvez y choisir la langue, le thème (sombre / clair / automatique) et la densité d'affichage.",
  },
  {
    q: "J'ai oublié mon mot de passe, que faire ?",
    a: "Depuis l'écran de connexion, cliquez sur « Mot de passe oublié ». Un lien de réinitialisation sécurisé vous sera envoyé sur votre adresse de secours.",
  },
];
