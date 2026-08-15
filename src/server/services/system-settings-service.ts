import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/server/supabase/clients";
import { ok } from "@/server/api/response";
import { mapDatabaseError } from "@/server/errors/app-error";
import type { Actor } from "@/types/domain";
const schema=z.object({key:z.string().trim().min(1).max(120).regex(/^[A-Z0-9_]+$/),value:z.unknown()});
export async function systemSettings(request:NextRequest,method:string,actor:Actor){const client=createAdminClient();if(method==="GET"){const result=await client.from("system_settings").select("*").order("key");if(result.error)mapDatabaseError(result.error);return ok(result.data)}const input=schema.parse(await request.json());const result=await client.from("system_settings").upsert({key:input.key,value:input.value,updated_by:actor.id}).select().single();if(result.error)mapDatabaseError(result.error);await client.from("audit_logs").insert({actor_id:actor.id,action:"SETTING_UPDATED",entity_type:"SYSTEM_SETTING",metadata:{key:input.key}});return ok(result.data)}

