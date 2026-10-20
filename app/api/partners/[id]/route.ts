import { collectionHandlers } from "@/lib/collection-api";
import type { Partner } from "@/lib/types";

const handlers = collectionHandlers<Partner>("partners.json", "partner");

export const PUT = handlers.update;
export const DELETE = handlers.remove;
