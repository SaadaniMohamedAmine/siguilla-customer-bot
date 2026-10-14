import { requireOrgApi, toErrorResponse, HttpError } from "@/lib/session";
import { deleteOrganization, AccountError } from "@/lib/account";

export async function DELETE() {
  try {
    const { org, role } = await requireOrgApi({ write: true });
    if (role !== "owner") throw new HttpError(403, "Only the owner can delete the organization.");
    await deleteOrganization(org.id);
    return Response.json({ data: { id: org.id } });
  } catch (error) {
    if (error instanceof AccountError)
      return Response.json({ error: error.message }, { status: error.status });
    return toErrorResponse(error);
  }
}
