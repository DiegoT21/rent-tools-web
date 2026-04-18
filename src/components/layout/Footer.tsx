export function Footer() {
  return (
    <footer className="mt-auto pt-8 pb-12 border-t flex flex-col md:flex-row justify-between items-center text-xs font-semibold text-slate-400 tracking-widest uppercase container mx-auto max-w-7xl px-8">
      <p>© 2024 RENTTOOLS. UTILIDAD DE PRECISIÓN PARA PROFESIONALES INDUSTRIALES.</p>
      <div className="flex gap-6 mt-4 md:mt-0">
        <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
        <a href="#" className="hover:text-primary transition-colors">Términos</a>
        <a href="#" className="hover:text-primary transition-colors">Seguridad</a>
        <a href="#" className="hover:text-primary transition-colors">Contacto</a>
      </div>
    </footer>
  );
}
