import { collectionHandlers } from "@/lib/collection-api";
import type { ClientLogo } from "@/lib/types";

const handlers = collectionHandlers<ClientLogo>("clients.json", "client");

export const GET = handlers.list;
export const POST = handlers.create;
