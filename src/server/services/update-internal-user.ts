import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/server/supabase/clients";
import { ok } from "@/server/api/response";
import { AppError, mapDatabaseError } from "@/server/errors/app-error";
import type { Actor } from "@/types/domain";

const schema=z.object({name:z.string().trim().min(1).max(160).optional(),role:z.enum(["OWNER","STAFF_SIDOARJO","STAFF_MERAUKE","FINANCE"]).optional(),isActive:z.boolean().optional()});
export async function updateInternalUser(request:NextRequest,id:string|undefined,actor:Actor){if(!id)throw new AppError("VALIDATION_ERROR","User ID wajib diisi.");const input=schema.parse(await request.json());const client=createAdminClient();const result=await client.from("profiles").update({name:input.name,role:input.role,is_active:input.isActive}).eq("id",id).select().single();if(result.error)mapDatabaseError(result.error);await client.from("audit_logs").insert({actor_id:actor.id,action:"USER_UPDATED",entity_type:"USER",entity_id:id});return ok(result.data)}
