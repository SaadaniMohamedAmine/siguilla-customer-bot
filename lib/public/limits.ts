// Limites publiques (chat / config / feedback-events), partagées par toutes les routes app/api/public/v1/*.
export const CHAT_PER_MINUTE = 20;
export const CHAT_PER_DAY = 200;
export const CONFIG_PER_MINUTE = 60;
export const MISC_PER_MINUTE = 60; // feedback, events
// Ouvertures de la démo (/demo) par IP : large, car des visiteurs derrière un même réseau (entreprise, école) se partagent l'IP.
export const DEMO_PER_HOUR = 30;
