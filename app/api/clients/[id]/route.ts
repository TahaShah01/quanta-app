import { collectionHandlers } from "@/lib/collection-api";
import type { ClientLogo } from "@/lib/types";

const handlers = collectionHandlers<ClientLogo>("clients.json", "client");

export const PUT = handlers.update;
export const DELETE = handlers.remove;
