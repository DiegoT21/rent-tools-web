import type { RentalRequestListItem } from "@/services/rentalRequestService";

export function getToolKey(tool: { uuid?: string; _id?: string; id?: string } | null | undefined): string {
  if (!tool) return "";
  return String(tool.uuid ?? tool._id ?? tool.id ?? "");
}

export function findActiveRentalForTool(
  tool: any,
  activeRentals: RentalRequestListItem[]
): RentalRequestListItem | null {
  const toolKey = getToolKey(tool);
  if (!toolKey) return null;

  return (
    activeRentals.find((rental) => {
      const rentalToolKey = String(
        rental.toolUuid ?? rental.tool?.uuid ?? rental.tool?._id ?? rental.tool?.id ?? ""
      );
      return rentalToolKey === toolKey && rental.status === "approved";
    }) ?? null
  );
}

export function isToolRented(tool: any, activeRentals: RentalRequestListItem[]): boolean {
  if (findActiveRentalForTool(tool, activeRentals)) return true;

  const rentalState = String(tool?.rentalState ?? tool?.availabilityStatus ?? "").toLowerCase();
  if (["rented", "in_rental", "on_rent", "rented_out", "active"].includes(rentalState)) {
    return true;
  }

  if (tool?.isAvailable === false && rentalState !== "paused") {
    return true;
  }

  return false;
}

export function getInventoryAvailabilityLabel(
  tool: any,
  activeRentals: RentalRequestListItem[]
) {
  const activeRental = findActiveRentalForTool(tool, activeRentals);
  const rented = isToolRented(tool, activeRentals);

  if (rented) {
    const tenant = activeRental?.tenant ?? activeRental?.renter;
    const tenantName = tenant
      ? `${tenant.firstName ?? tenant.name ?? "Usuario"} ${tenant.lastName ?? ""}`.trim()
      : null;

    return {
      available: false,
      status: "En renta",
      statusColor: "bg-orange-50 text-orange-700 border-orange-200",
      borderColor: "border-l-orange-500",
      footnote: tenantName ? `Arrendado · ${tenantName}` : "No disponible · alquiler activo",
    };
  }

  const available = tool?.isAvailable !== false;
  return {
    available,
    status: available ? "Disponible" : "No disponible",
    statusColor: available
      ? "bg-teal-50 text-teal-600 border-teal-100"
      : "bg-slate-100 text-slate-500 border-slate-200",
    borderColor: available ? "border-l-teal-500" : "border-l-slate-400",
    footnote: available ? "Publicada" : "Pausada",
  };
}
