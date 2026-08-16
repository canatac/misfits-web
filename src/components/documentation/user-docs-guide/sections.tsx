/* eslint-disable react/no-unescaped-entities */
import React from "react";
import {
  Rocket,
  Mail,
  Sparkles,
  ShieldCheck,
  KeyRound,
  Inbox,
  Filter,
  Star,
  Archive,
  Trash2,
  PenSquare,
  CheckCircle2,
  UserCog,
  Sliders,
} from "lucide-react";

const SHORTCUTS = [
  { key: "J / K", label: "Message suivant / précédent", desc: "Parcourez la liste sans la souris.", color: "text-[#C49B66]" },
  { key: "C", label: "Nouveau message", desc: "Ouvre la fenêtre de rédaction.", color: "text-[#4ADE80]" },
  { key: "E", label: "Archiver", desc: "Retire le message de la boîte de réception.", color: "text-[#38BDF8]" },
  { key: "#", label: "Supprimer", desc: "Envoie le message à la corbeille.", color: "text-rose-400" },
  { key: "S", label: "Étoile / retirer l'étoile", desc: "Marque le message comme important.", color: "text-[#C49B66]" },
  { key: "U", label: "Marquer comme non lu", desc: "Utile pour revenir dessus plus tard.", color: "text-[#38BDF8]" },
  { key: "⌘/Ctrl + /", label: "Rechercher", desc: "Place le curseur dans la barre de recherche.", color: "text-[#C49B66]" },
  { key: "⌘/Ctrl + B", label: "Afficher / masquer la barre latérale", desc: "Plus de place pour la lecture.", color: "text-[#38BDF8]" },
  { key: "⌘/Ctrl + J", label: "Afficher / masquer le panneau assistant", desc: "Ouvrez l'aide à la demande.", color: "text-[#4ADE80]" },
  { key: "Esc", label: "Fermer", desc: "Ferme les fenêtres, panneaux ou aperçus ouverts.", color: "text-[#A1A1AA]" },
];

export const OverviewSection: React.FC = () => (
  <section className="p-6 rounded-2xl bg-[#121214] border border-[#242427] space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-[#C49B66]/10 border border-[#C49B66]/30 flex items-center justify-center">
        <Rocket className="w-5 h-5 text-[#C49B66]" />
      </div>
      <div>
        <h2 className="text-base font-bold text-white">1. Présentation de misfits.ai Mail</h2>
        <p className="text-xs text-[#71717A]">Une messagerie moderne, claire et centrée sur votre attention</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
      <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#242427] space-y-2">
        <div className="flex items-center gap-2 text-[#C49B66] font-bold"><Mail className="w-4 h-4" /><span>Une boîte, plusieurs adresses</span></div>
        <p className="text-[#A1A1AA] leading-relaxed">Regroupez vos différentes adresses au même endroit et naviguez-y sans jongler entre plusieurs onglets.</p>
      </div>
      <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#242427] space-y-2">
        <div className="flex items-center gap-2 text-[#38BDF8] font-bold"><Sparkles className="w-4 h-4" /><span>Une aide sur demande</span></div>
        <p className="text-[#A1A1AA] leading-relaxed">Résumés de fils longs, suggestions de réponses, traductions : les assistants sont là quand vous en avez besoin, sans jamais agir seuls.</p>
      </div>
      <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#242427] space-y-2">
        <div className="flex items-center gap-2 text-[#4ADE80] font-bold"><ShieldCheck className="w-4 h-4" /><span>Une expérience privée</span></div>
        <p className="text-[#A1A1AA] leading-relaxed">Vos échanges vous appartiennent. Les paramètres de confidentialité sont accessibles depuis votre profil à tout moment.</p>
      </div>
    </div>
  </section>
);

export const SigninSection: React.FC = () => (
  <section className="p-6 rounded-2xl bg-[#121214] border border-[#242427] space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-[#C49B66]/10 border border-[#C49B66]/30 flex items-center justify-center">
        <KeyRound className="w-5 h-5 text-[#C49B66]" />
      </div>
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>2. Première connexion & double authentification</span>
          <span className="px-2 py-0.5 rounded-full bg-[#C49B66]/20 text-[#C49B66] text-[10px] font-mono font-bold">Recommandé</span>
        </h2>
        <p className="text-xs text-[#71717A]">Sécurisez votre compte en quelques minutes</p>
      </div>
    </div>
    <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#242427] space-y-3 text-xs">
      <p className="text-[#E0E0E0] leading-relaxed">La double authentification (2FA) ajoute une seconde étape à la connexion pour protéger votre boîte, même si votre mot de passe venait à être connu de quelqu'un d'autre.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        <div className="p-3.5 rounded-xl bg-[#121214] border border-[#242427] space-y-1.5">
          <div className="text-[#C49B66] font-bold text-xs">Étape 1 : Ouvrir les paramètres</div>
          <p className="text-[11px] text-[#A1A1AA] leading-relaxed">Depuis votre avatar en haut à droite, ouvrez <strong className="text-white">Paramètres → Sécurité</strong>.</p>
        </div>
        <div className="p-3.5 rounded-xl bg-[#121214] border border-[#242427] space-y-1.5">
          <div className="text-[#38BDF8] font-bold text-xs">Étape 2 : Activer la 2FA</div>
          <p className="text-[11px] text-[#A1A1AA] leading-relaxed">Choisissez « Activer la double authentification » et scannez le QR code avec votre application d'authentification.</p>
        </div>
        <div className="p-3.5 rounded-xl bg-[#121214] border border-[#242427] space-y-1.5">
          <div className="text-[#4ADE80] font-bold text-xs">Étape 3 : Codes de secours</div>
          <p className="text-[11px] text-[#A1A1AA] leading-relaxed">Enregistrez vos codes de secours dans un endroit sûr. Ils vous serviront si vous perdez l'accès à votre téléphone.</p>
        </div>
      </div>
    </div>
  </section>
);

export const InboxSection: React.FC = () => (
  <section className="p-6 rounded-2xl bg-[#121214] border border-[#242427] space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-[#C49B66]/10 border border-[#C49B66]/30 flex items-center justify-center">
        <Inbox className="w-5 h-5 text-[#C49B66]" />
      </div>
      <div>
        <h2 className="text-base font-bold text-white">3. Naviguer dans la boîte de réception</h2>
        <p className="text-xs text-[#71717A]">Filtres, dossiers, étoiles et actions rapides</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
      <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#242427] space-y-2">
        <div className="flex items-center gap-2 text-[#C49B66] font-bold"><Filter className="w-4 h-4" /><span>Filtres & dossiers</span></div>
        <p className="text-[#A1A1AA] leading-relaxed">Les dossiers <strong className="text-white">Boîte de réception</strong>, <strong className="text-white">Envoyés</strong>, <strong className="text-white">Brouillons</strong>, <strong className="text-white">Indésirables</strong> et <strong className="text-white">Corbeille</strong> sont accessibles depuis la colonne de gauche. Les filtres en haut de liste vous aident à trier par non lus, avec pièces jointes, ou vedettes.</p>
      </div>
      <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#242427] space-y-2">
        <div className="flex items-center gap-2 text-[#4ADE80] font-bold"><Star className="w-4 h-4" /><span>Étoiles & épinglage</span></div>
        <p className="text-[#A1A1AA] leading-relaxed">Marquez d'une étoile les messages à retrouver rapidement. Vous pouvez également épingler un fil important en haut de la liste.</p>
      </div>
      <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#242427] space-y-2">
        <div className="flex items-center gap-2 text-[#38BDF8] font-bold"><Archive className="w-4 h-4" /><span>Archiver & marquer lu / non lu</span></div>
        <p className="text-[#A1A1AA] leading-relaxed">Une fois un échange traité, archivez-le : il quitte la boîte sans être supprimé et reste consultable via la recherche.</p>
      </div>
      <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#242427] space-y-2">
        <div className="flex items-center gap-2 text-rose-400 font-bold"><Trash2 className="w-4 h-4" /><span>Corbeille & indésirables</span></div>
        <p className="text-[#A1A1AA] leading-relaxed">Les messages supprimés partent dans la corbeille pendant 30 jours avant suppression définitive. Consultez régulièrement les indésirables pour vérifier qu'aucun message légitime n'y a atterri.</p>
      </div>
    </div>
  </section>
);

export const ComposeSection: React.FC = () => (
  <section className="p-6 rounded-2xl bg-[#121214] border border-[#242427] space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-[#C49B66]/10 border border-[#C49B66]/30 flex items-center justify-center">
        <PenSquare className="w-5 h-5 text-[#C49B66]" />
      </div>
      <div>
        <h2 className="text-base font-bold text-white">4. Rédiger et envoyer un message</h2>
        <p className="text-xs text-[#71717A]">Pièces jointes, brouillons, réponses assistées</p>
      </div>
    </div>
    <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#242427] space-y-3 text-xs">
      <p className="text-[#A1A1AA] leading-relaxed">Cliquez sur <strong className="text-white">Nouveau message</strong> (ou appuyez sur <span className="px-1.5 py-0.5 rounded bg-[#1D1D20] text-[#C49B66] font-mono border border-[#242427]">C</span>) pour ouvrir la fenêtre de rédaction.</p>
      <div className="p-4 rounded-xl bg-[#121214] border border-[#C49B66]/30 space-y-2.5">
        <div className="flex items-center gap-2 text-white font-bold"><CheckCircle2 className="w-4 h-4 text-[#C49B66]" /><span>Bonnes pratiques</span></div>
        <ol className="list-decimal list-inside space-y-2 text-[#E0E0E0] text-[11px] leading-relaxed">
          <li>Renseignez un objet clair — c'est ce que verra le destinataire en premier.</li>
          <li>Utilisez la barre de mise en forme pour structurer les paragraphes, listes et liens.</li>
          <li>Glissez vos pièces jointes directement dans la fenêtre.</li>
          <li>Les brouillons sont sauvegardés automatiquement au fil de la frappe.</li>
          <li>Besoin d'aide ? Utilisez « Résumer », « Traduire » ou « Suggérer une réponse » à la demande.</li>
        </ol>
      </div>
    </div>
  </section>
);

export const AccountSection: React.FC = () => (
  <section className="p-6 rounded-2xl bg-[#121214] border border-[#242427] space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-[#C49B66]/10 border border-[#C49B66]/30 flex items-center justify-center">
        <UserCog className="w-5 h-5 text-[#C49B66]" />
      </div>
      <div>
        <h2 className="text-base font-bold text-white">5. Comptes & préférences</h2>
        <p className="text-xs text-[#71717A]">Profil, apparence, notifications, signature</p>
      </div>
    </div>
    <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#242427] space-y-2 text-xs">
      <p className="text-[#A1A1AA] leading-relaxed">Les <strong className="text-white">Paramètres</strong> (accessibles via votre avatar) regroupent tout ce qui personnalise votre expérience :</p>
      <ul className="list-disc list-inside space-y-1.5 text-[#E0E0E0] text-[11px] pt-1">
        <li><strong className="text-[#C49B66]">Profil :</strong> nom affiché, photo, adresse de secours.</li>
        <li><strong className="text-[#38BDF8]">Apparence :</strong> thème clair / sombre / automatique, langue, densité d'affichage.</li>
        <li><strong className="text-[#4ADE80]">Notifications :</strong> choisissez quand recevoir des alertes et sur quels appareils.</li>
        <li><strong className="text-[#C49B66]">Signature :</strong> définissez un pied de message ajouté à vos envois.</li>
        <li><strong className="text-[#38BDF8]">Sécurité :</strong> mot de passe, 2FA, sessions actives, appareils connus.</li>
      </ul>
    </div>
  </section>
);

export const ShortcutsSection: React.FC = () => (
  <section className="p-6 rounded-2xl bg-[#121214] border border-[#242427] space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-[#C49B66]/10 border border-[#C49B66]/30 flex items-center justify-center">
        <Sliders className="w-5 h-5 text-[#C49B66]" />
      </div>
      <div>
        <h2 className="text-base font-bold text-white">6. Raccourcis clavier</h2>
        <p className="text-xs text-[#71717A]">Gagnez du temps sans quitter le clavier</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
      {SHORTCUTS.map((s) => (
        <div key={s.key} className="p-3.5 rounded-xl bg-[#0A0A0B] border border-[#242427] flex items-start gap-3">
          <span className={`px-2 py-1 rounded bg-[#1D1D20] ${s.color} font-mono font-bold text-[10px] border border-[#242427] whitespace-nowrap`}>{s.key}</span>
          <div>
            <strong className="text-white block">{s.label}</strong>
            <span className="text-[#71717A] text-[11px]">{s.desc}</span>
          </div>
        </div>
      ))}
    </div>
  </section>
);
