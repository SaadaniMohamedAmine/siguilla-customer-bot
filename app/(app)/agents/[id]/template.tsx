/** Remonté à chaque changement d'onglet : le contenu entre en fondu tandis que l'en-tête de l'agent reste en place. */
export default function AgentTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-in anim-keep">{children}</div>;
}
