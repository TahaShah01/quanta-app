import { collectionHandlers } from "@/lib/collection-api";
import type { Partner } from "@/lib/types";

const handlers = collectionHandlers<Partner>("partners.json", "partner");

export const GET = handlers.list;
export const POST = handlers.create;
