import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const sections = [
  {
    title: "1. Aceptación del servicio",
    body:
      "Al crear una cuenta en RentTools aceptas estos términos y condiciones, nuestra política de privacidad y las reglas de uso de la plataforma. RentTools es un marketplace que conecta propietarios de herramientas y maquinaria con profesionales que desean alquilarlas.",
  },
  {
    title: "2. Requisitos de la cuenta",
    body:
      "Debes proporcionar información veraz y mantenerla actualizada. Para alquilar o publicar equipos es obligatorio completar la verificación de identidad (KYC). RentTools puede suspender o cancelar cuentas con datos falsos o actividad fraudulenta.",
  },
  {
    title: "3. Uso de la plataforma",
    body:
      "Te comprometes a usar RentTools únicamente para fines profesionales legítimos, respetar los contratos de alquiler generados en la plataforma, devolver los equipos en las condiciones acordadas y no realizar transacciones fuera del sistema para evadir comisiones o controles de seguridad.",
  },
  {
    title: "4. Alquileres y pagos",
    body:
      "Cada alquiler se rige por el contrato digital generado tras la aprobación de la solicitud. Los montos, depósitos, fechas y puntos de entrega se establecen en ese contrato. Los pagos procesados por RentTools están sujetos a las políticas de retención, liberación y disputas publicadas en la plataforma.",
  },
  {
    title: "5. Responsabilidad del equipo",
    body:
      "El arrendatario es responsable del uso adecuado del equipo durante el periodo de alquiler, de reportar daños o incidentes de inmediato y de cumplir con las normas de seguridad industrial aplicables. El propietario garantiza que el equipo publicado se encuentra en condiciones operativas y conforme a la descripción.",
  },
  {
    title: "6. Privacidad y datos",
    body:
      "RentTools trata tus datos personales conforme a su política de privacidad industrial. La información de identidad, contacto, ubicación y evidencias fotográficas se utiliza para verificación, gestión de alquileres, prevención de fraude y cumplimiento legal.",
  },
  {
    title: "7. Modificaciones",
    body:
      "RentTools puede actualizar estos términos. Los cambios relevantes se comunicarán por la plataforma o por correo electrónico. El uso continuado del servicio después de una actualización implica la aceptación de los nuevos términos.",
  },
];

export function ServiceTermsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Términos y condiciones de servicio</DialogTitle>
          <DialogDescription>
            RentTools Marketplace — última actualización: julio 2026
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm leading-relaxed text-slate-700">
          {sections.map((section) => (
            <section key={section.title}>
              <h3 className="font-bold text-slate-900">{section.title}</h3>
              <p className="mt-1">{section.body}</p>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
