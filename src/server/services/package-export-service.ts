import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/server/supabase/clients";
import { mapDatabaseError } from "@/server/errors/app-error";

export async function exportPackagesCsv(request:NextRequest){let query=createAdminClient().from("packages").select("package_code,tracking_number,status,received_at,actual_weight_kg,chargeable_weight_kg,shipping_fee_idr,customers(code,name)").order("received_at",{ascending:false}).limit(10000);const from=request.nextUrl.searchParams.get("dateFrom"),to=request.nextUrl.searchParams.get("dateTo"),status=request.nextUrl.searchParams.get("status");if(from)query=query.gte("received_at",from);if(to)query=query.lte("received_at",`${to}T23:59:59.999Z`);if(status)query=query.eq("status",status);const result=await query;if(result.error)mapDatabaseError(result.error);const lines=["PACKAGE CODE,TRACKING NUMBER,CUSTOMER CODE,CUSTOMER,STATUS,RECEIVED AT,ACTUAL WEIGHT,CHARGEABLE WEIGHT,SHIPPING FEE",...(result.data??[]).map(row=>{const customer=row.customers as unknown as {code:string;name:string}|null;return [row.package_code,row.tracking_number,customer?.code,customer?.name,row.status,row.received_at,row.actual_weight_kg,row.chargeable_weight_kg,row.shipping_fee_idr].map(value=>`"${String(value??"").replaceAll('"','""')}"`).join(",")})];return new NextResponse(`\uFEFF${lines.join("\n")}`,{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":"attachment; filename=packages.csv"}})}

