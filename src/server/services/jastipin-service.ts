import "server-only";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { fileTypeFromBuffer } from "file-type";
import { createAdminClient } from "@/server/supabase/clients";
import { AppError, mapDatabaseError } from "@/server/errors/app-error";
import { ok } from "@/server/api/response";
import { calculatePackageCharge } from "@/server/domain/pricing/calculate-package-charge";
import {
  cleanCustomerName,
  customerDisplayName,
  normalizeCustomerName,
} from "@/server/domain/customers/normalize-customer-name";
import { normalizeTrackingNumber } from "@/server/domain/tracking/normalize-tracking-number";
import { updateInternalUser } from "@/server/services/update-internal-user";
import { exportClosingDocument } from "@/server/services/closing-export-service";
import { exportPackagesCsv } from "@/server/services/package-export-service";
import { systemSettings } from "@/server/services/system-settings-service";
import {
  cloudinaryDeliveryUrl,
  deleteCloudinaryImage,
  uploadCloudinaryImage,
} from "@/server/storage/cloudinary-storage";
import {
  closingSchema,
  customerSchema,
  expenseSchema,
  packageIntakeSchema,
  packageListSchema,
  paginationSchema,
  paymentSchema,
  pickupSchema,
  rateSchema,
  shipmentSchema,
  userSchema,
  uuid,
} from "@/server/validation/schemas";
import type { Actor } from "@/types/domain";

type Client = ReturnType<typeof createAdminClient>;
const body = async (request: NextRequest) => request.json().catch(() => ({}));
const clean = (value: string) => value.replace(/[%_,().]/g, "");
const MAX_PACKAGE_PHOTOS = 2;

function packageReceivedAt(date: string, time?: string | null) {
  return new Date(`${date}T${time ?? "00:00"}:00+07:00`).toISOString();
}

function todayInJakarta() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function packagePayload(form: FormData) {
  const value = form.get("payload");
  if (typeof value !== "string")
    throw new AppError("VALIDATION_ERROR", "Payload paket wajib diisi.");
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    throw new AppError("VALIDATION_ERROR", "Payload paket tidak valid.");
  }
}

async function validatedPackageFiles(form: FormData, minimum: number) {
  const files = form
    .getAll("file")
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length < minimum || files.length > MAX_PACKAGE_PHOTOS)
    throw new AppError(
      "VALIDATION_ERROR",
      `Foto wajib berjumlah ${minimum}-${MAX_PACKAGE_PHOTOS}.`,
    );
  const validated: { file: File; mime: string }[] = [];
  for (const file of files) {
    if (file.size > 3145728)
      throw new AppError("UPLOAD_TOO_LARGE", "Ukuran file maksimal 3 MB.");
    const detected = await fileTypeFromBuffer(
      Buffer.from(await file.arrayBuffer()),
    );
    if (
      !detected ||
      !["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(
        detected.mime,
      )
    )
      throw new AppError(
        "UPLOAD_TYPE_INVALID",
        "Gunakan JPEG, PNG, WebP, HEIC, atau HEIF.",
      );
    validated.push({ file, mime: detected.mime });
  }
  return validated;
}
function pagination(request: NextRequest) {
  const parsed = paginationSchema.parse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  return {
    ...parsed,
    from: (parsed.page - 1) * parsed.pageSize,
    to: parsed.page * parsed.pageSize - 1,
  };
}
function pageMeta(page: number, pageSize: number, total: number) {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}
function requireId(value?: string) {
  return uuid.parse(value);
}
function db<T extends { error: unknown; data: unknown }>(result: T) {
  if (result.error)
    mapDatabaseError(result.error as { message?: string; code?: string });
  return result.data;
}
async function code(
  client: Client,
  scope: string,
  prefix: string,
  date?: string,
) {
  const result = await client.rpc("next_business_code", {
    p_scope: scope,
    p_prefix: prefix,
    p_date: date ?? null,
  });
  return db(result) as string;
}

export class JastipinService {
  private client = createAdminClient();
  async dispatch(
    request: NextRequest,
    segments: string[],
    actor: Actor,
  ): Promise<NextResponse> {
    const [resource, id, action, subId] = segments;
    const method = request.method;
    if (resource === "dashboard" && method === "GET") return this.dashboard();
    if (resource === "customers")
      return this.customers(request, method, id, actor);
    if (resource === "rate-configs") return this.rates(request, method, id);
    if (resource === "packages" && id === "export")
      return exportPackagesCsv(request);
    if (resource === "packages")
      return this.packages(request, method, id, action, actor);
    if (resource === "unidentified") return this.unidentified(request);
    if (resource === "closings" && id && action === "export")
      return exportClosingDocument(
        id,
        request.nextUrl.searchParams.get("format") ?? "pdf",
      );
    if (resource === "closings")
      return this.closings(request, method, id, action, subId, actor);
    if (resource === "shipments")
      return this.shipments(request, method, id, action, actor);
    if (resource === "invoices")
      return this.simpleList(request, "invoices", id, "created_at");
    if (resource === "payments") return this.payments(request, method, actor);
    if (resource === "expenses")
      return this.expenses(request, method, id, actor);
    if (resource === "pickups") return this.pickups(request, method, id, actor);
    if (resource === "reports") return this.reports(request, id);
    if (resource === "audit-logs")
      return this.simpleList(request, "audit_logs", id, "created_at");
    if (resource === "users" && method === "PATCH")
      return updateInternalUser(request, id, actor);
    if (resource === "users") return this.users(request, method, id, actor);
    if (resource === "settings") return systemSettings(request, method, actor);
    if (resource === "files") return this.files(method, id, actor);
    throw new AppError(
      "NOT_FOUND",
      "Endpoint tidak ditemukan.",
      undefined,
      404,
    );
  }

  private async dashboard() {
    const [received, waiting, ready, transit, pickup, invoices] =
      await Promise.all([
        this.client
          .from("packages")
          .select("id", { count: "exact", head: true })
          .eq("received_date", todayInJakarta()),
        this.client
          .from("packages")
          .select("id", { count: "exact", head: true })
          .eq("status", "WAITING_CLOSING"),
        this.client
          .from("packages")
          .select("id", { count: "exact", head: true })
          .eq("status", "READY_TO_SHIP"),
        this.client
          .from("packages")
          .select("id", { count: "exact", head: true })
          .eq("status", "IN_TRANSIT"),
        this.client
          .from("packages")
          .select("id", { count: "exact", head: true })
          .eq("status", "READY_FOR_PICKUP"),
        this.client
          .from("invoices")
          .select("balance_idr")
          .in("status", ["UNPAID", "PARTIAL"]),
      ]);
    return ok({
      receivedToday: received.count ?? 0,
      waitingClosing: waiting.count ?? 0,
      readyToShip: ready.count ?? 0,
      inTransit: transit.count ?? 0,
      readyForPickup: pickup.count ?? 0,
      outstandingIdr: (invoices.data ?? [])
        .reduce((sum, row) => sum + Number(row.balance_idr), 0)
        .toFixed(0),
    });
  }

  private async unidentified(request: NextRequest) {
    const p = pagination(request);
    let query = this.client
      .from("packages")
      .select("*,customers(id,code,name)", { count: "exact" })
      .is("customer_id", null);
    if (p.search)
      query = query.ilike(
        "normalized_tracking_number",
        `%${normalizeTrackingNumber(p.search)}%`,
      );
    const result = await query
      .order("received_date", { ascending: false })
      .order("received_time", { ascending: false, nullsFirst: false })
      .range(p.from, p.to);
    if (result.error) mapDatabaseError(result.error);
    return ok(result.data, pageMeta(p.page, p.pageSize, result.count ?? 0));
  }

  private async customers(
    request: NextRequest,
    method: string,
    id: string | undefined,
    actor: Actor,
  ) {
    if (method === "GET" && id === "suggestions") {
      const query = cleanCustomerName(
        request.nextUrl.searchParams.get("search") ?? "",
      ).slice(0, 100);
      if (query.length < 2) return ok([]);
      return ok(
        db(
          await this.client.rpc("search_customer_suggestions", {
            p_query: query,
            p_limit: 8,
          }),
        ),
      );
    }
    if (method === "GET" && id)
      return ok(
        db(
          await this.client
            .from("customers")
            .select("*,packages(count),invoices(balance_idr,status)")
            .eq("id", requireId(id))
            .single(),
        ),
      );
    if (method === "GET") {
      const p = pagination(request);
      let query = this.client.from("customers").select("*", { count: "exact" });
      if (p.search)
        query = query.or(
          `name.ilike.%${clean(p.search)}%,code.ilike.%${clean(p.search)}%`,
        );
      if (request.nextUrl.searchParams.get("active") === "true")
        query = query.eq("is_active", true);
      const result = await query
        .order(p.search ? "name" : "created_at", {
          ascending: Boolean(p.search),
        })
        .range(p.from, p.to);
      if (result.error) mapDatabaseError(result.error);
      return ok(result.data, pageMeta(p.page, p.pageSize, result.count ?? 0));
    }
    if (method === "POST") {
      const input = customerSchema.parse(await body(request));
      const created = await this.client
        .from("customers")
        .insert({
          code: await code(this.client, "CUSTOMER", "CUS"),
          name: cleanCustomerName(input.name),
          phone: input.phone,
          address: input.address,
          notes: input.notes,
        })
        .select()
        .single();
      if (created.error?.code === "23505")
        throw new AppError(
          "CUSTOMER_NAME_EXISTS",
          "Nama customer sudah digunakan.",
        );
      const data = db(created);
      await this.audit(
        actor,
        "CUSTOMER_CREATED",
        "CUSTOMER",
        (data as { id: string }).id,
      );
      return ok(data, undefined, { status: 201 });
    }
    if (method === "PATCH" && id) {
      const input = customerSchema.partial().parse(await body(request));
      const data = db(
        await this.client
          .from("customers")
          .update({
            name: input.name,
            phone: input.phone,
            address: input.address,
            notes: input.notes,
            is_active: input.isActive,
          })
          .eq("id", requireId(id))
          .select()
          .single(),
      );
      await this.audit(actor, "CUSTOMER_UPDATED", "CUSTOMER", id);
      return ok(data);
    }
    throw new AppError(
      "NOT_FOUND",
      "Operasi customer tidak ditemukan.",
      undefined,
      404,
    );
  }

  private async rates(request: NextRequest, method: string, id?: string) {
    if (method === "GET")
      return id
        ? ok(
            db(
              await this.client
                .from("rate_configs")
                .select("*")
                .eq("id", requireId(id))
                .single(),
            ),
          )
        : this.simpleList(request, "rate_configs", undefined, "created_at");
    const input = (
      method === "PATCH" ? rateSchema.partial() : rateSchema
    ).parse(await body(request));
    const payload = {
      name: input.name,
      rate_per_kg_idr: input.ratePerKgIdr,
      minimum_charge_idr: input.minimumChargeIdr,
      volumetric_divisor: input.volumetricDivisor,
      rounding_step_kg: input.roundingStepKg,
      valid_from: input.validFrom,
      valid_until: input.validUntil,
      is_active: input.isActive,
      notes: input.notes,
    };
    if (method === "POST")
      return ok(
        db(
          await this.client
            .from("rate_configs")
            .insert(payload)
            .select()
            .single(),
        ),
        undefined,
        { status: 201 },
      );
    if (method === "PATCH" && id)
      return ok(
        db(
          await this.client
            .from("rate_configs")
            .update(payload)
            .eq("id", requireId(id))
            .select()
            .single(),
        ),
      );
    throw new AppError(
      "NOT_FOUND",
      "Operasi tarif tidak ditemukan.",
      undefined,
      404,
    );
  }

  private async resolveIncomingCustomer(
    customerId?: string | null,
    customerName?: string | null,
  ) {
    if (customerId) {
      const selected = await this.client
        .from("customers")
        .select("id,is_active")
        .eq("id", customerId)
        .maybeSingle();
      if (selected.error) mapDatabaseError(selected.error);
      if (!selected.data)
        throw new AppError("CUSTOMER_NOT_FOUND", "Customer tidak ditemukan.");
      if (!selected.data.is_active)
        throw new AppError(
          "CUSTOMER_INACTIVE",
          "Customer yang dipilih sudah nonaktif.",
        );
      return { id: String(selected.data.id), created: false };
    }

    const displayName = customerDisplayName(customerName);
    const normalizedName = normalizeCustomerName(displayName);
    const existing = await this.client
      .from("customers")
      .select("id,is_active")
      .eq("normalized_name", normalizedName)
      .maybeSingle();
    if (existing.error) mapDatabaseError(existing.error);
    if (existing.data) {
      if (!existing.data.is_active)
        throw new AppError(
          "CUSTOMER_INACTIVE",
          "Customer dengan nama ini sudah ada tetapi sedang nonaktif.",
        );
      return { id: String(existing.data.id), created: false };
    }

    const inserted = await this.client
      .from("customers")
      .insert({
        code: await code(this.client, "CUSTOMER", "CUS"),
        name: displayName,
      })
      .select("id,is_active")
      .single();
    if (inserted.error?.code === "23505") {
      const concurrent = await this.client
        .from("customers")
        .select("id,is_active")
        .eq("normalized_name", normalizedName)
        .maybeSingle();
      if (concurrent.error) mapDatabaseError(concurrent.error);
      if (concurrent.data?.is_active)
        return { id: String(concurrent.data.id), created: false };
    }
    if (inserted.error) mapDatabaseError(inserted.error);
    return { id: String(inserted.data.id), created: true };
  }

  private async packages(
    request: NextRequest,
    method: string,
    id: string | undefined,
    action: string | undefined,
    actor: Actor,
  ) {
    if (method === "GET" && id === "lookup") {
      const tracking = request.nextUrl.searchParams.get("trackingNumber") ?? "";
      const normalized = normalizeTrackingNumber(tracking);
      return ok(
        db(
          await this.client
            .from("packages")
            .select("*,customers(id,code,name)")
            .eq("normalized_tracking_number", normalized)
            .order("created_at", { ascending: false }),
        ),
      );
    }
    if (method === "GET" && id) {
      const data = db(
        await this.client
          .from("packages")
          .select(
            "*,customers(*),rate_configs(*),package_attachments(*),closing_packages(is_active,closings(status))",
          )
          .eq("id", requireId(id))
          .single(),
      ) as Record<string, unknown>;
      const memberships = (data.closing_packages ?? []) as {
        is_active: boolean;
        closings: { status: string } | null;
      }[];
      const finalized = memberships.some(
        (item) =>
          item.is_active &&
          item.closings &&
          ["FINALIZED", "IN_SHIPMENT", "ARRIVED", "COMPLETED"].includes(
            item.closings.status,
          ),
      );
      const initialStatus = ["WAITING_CLOSING", "DAMAGED"].includes(
        String(data.status),
      );
      return ok({
        ...data,
        permissions: {
          canEdit: actor.role === "ADMIN" && initialStatus && !finalized,
        },
      });
    }
    if (
      method === "POST" &&
      id &&
      ["hold", "release-hold"].includes(action ?? "")
    ) {
      const status = action === "hold" ? "HOLD" : "WAITING_CLOSING";
      return ok(
        await this.changePackageStatus(
          id,
          status,
          actor,
          (await body(request)).reason,
        ),
      );
    }
    if (method === "GET") {
      const p = packageListSchema.parse(
        Object.fromEntries(request.nextUrl.searchParams),
      );
      const from = (p.page - 1) * p.pageSize;
      const to = p.page * p.pageSize - 1;
      let query = this.client
        .from("packages")
        .select("*,customers(id,code,name)", { count: "exact" });
      if (p.search) {
        const term = clean(p.search);
        query = query.or(
          `tracking_number.ilike.%${term}%,normalized_tracking_number.ilike.%${normalizeTrackingNumber(term)}%,package_code.ilike.%${term}%`,
        );
      }
      if (p.status) query = query.eq("status", p.status);
      if (p.dateFrom) query = query.gte("received_date", p.dateFrom);
      if (p.dateTo) query = query.lte("received_date", p.dateTo);
      if (p.sort === "fee_desc")
        query = query
          .order("shipping_fee_idr", { ascending: false })
          .order("received_date", { ascending: false })
          .order("id", { ascending: true });
      else if (p.sort === "fee_asc")
        query = query
          .order("shipping_fee_idr", { ascending: true })
          .order("received_date", { ascending: false })
          .order("id", { ascending: true });
      else
        query = query
          .order("received_date", {
            ascending: p.sort === "received_asc",
          })
          .order("received_time", {
            ascending: p.sort === "received_asc",
            nullsFirst: false,
          })
          .order("id", { ascending: true });
      const result = await query.range(from, to);
      if (result.error) mapDatabaseError(result.error);
      return ok(result.data, pageMeta(p.page, p.pageSize, result.count ?? 0));
    }
    if (method === "POST" && !id) {
      const form = await request.formData();
      const raw = packagePayload(form);
      const input = packageIntakeSchema.parse(raw);
      const files = await validatedPackageFiles(form, 1);
      const normalized = normalizeTrackingNumber(input.trackingNumber);
      const duplicates = db(
        await this.client
          .from("packages")
          .select("id,package_code,tracking_number,customer_id")
          .eq("normalized_tracking_number", normalized),
      ) as unknown[];
      if (duplicates.length && !input.duplicateOverride)
        throw new AppError(
          "PACKAGE_DUPLICATE_TRACKING",
          "Nomor resi sudah tercatat.",
          { matches: duplicates },
        );
      if (duplicates.length && !input.duplicateOverrideReason?.trim())
        throw new AppError("VALIDATION_ERROR", "Alasan duplikat wajib diisi.");
      const pricing = calculatePackageCharge({
        actualWeightKg: input.actualWeightKg,
        lengthCm: input.lengthCm ?? undefined,
        widthCm: input.widthCm ?? undefined,
        heightCm: input.heightCm ?? undefined,
        chargeType: input.chargeType,
        manualAmountIdr: input.manualAmountIdr,
      });
      const packageId = randomUUID();
      const uploaded: {
        storagePath: string;
        publicId: string;
        file: File;
        mime: string;
      }[] = [];
      try {
        for (const item of files) {
          const result = await uploadCloudinaryImage(
            item.file,
            `jastipin/packages/${packageId}/${randomUUID()}`,
          );
          uploaded.push({ ...result, file: item.file, mime: item.mime });
        }
      } catch (error) {
        await Promise.allSettled(
          uploaded.map((item) => deleteCloudinaryImage(item.storagePath)),
        );
        throw error;
      }
      let customer: { id: string; created: boolean };
      try {
        customer = await this.resolveIncomingCustomer(
          input.customerId,
          input.customerName,
        );
      } catch (error) {
        await Promise.allSettled(
          uploaded.map((item) => deleteCloudinaryImage(item.storagePath)),
        );
        throw error;
      }
      const initialStatus =
        input.receivingCondition === "DAMAGED" ? "DAMAGED" : "WAITING_CLOSING";
      let packageCode: string;
      try {
        packageCode = await code(
          this.client,
          "PACKAGE",
          "PKG",
          new Date().toISOString().slice(0, 10),
        );
      } catch (error) {
        if (customer.created)
          await this.client.from("customers").delete().eq("id", customer.id);
        await Promise.allSettled(
          uploaded.map((item) => deleteCloudinaryImage(item.storagePath)),
        );
        throw error;
      }
      const created = await this.client
        .from("packages")
        .insert({
          id: packageId,
          package_code: packageCode,
          customer_id: customer.id,
          tracking_number: input.trackingNumber,
          normalized_tracking_number: normalized,
          courier: input.courier,
          received_date: input.receivedDate,
          received_time: input.receivedTime,
          received_at: packageReceivedAt(input.receivedDate, input.receivedTime),
          actual_weight_kg: pricing.actualWeightKg,
          length_cm: input.lengthCm,
          width_cm: input.widthCm,
          height_cm: input.heightCm,
          volumetric_weight_kg: pricing.volumetricWeightKg,
          chargeable_weight_kg: pricing.chargeableWeightKg,
          charge_type: input.chargeType,
          shipping_fee_idr: pricing.amountIdr,
          pricing_snapshot: pricing.pricingSnapshot,
          status: initialStatus,
          duplicate_override: input.duplicateOverride,
          duplicate_override_reason: input.duplicateOverrideReason,
          storage_location: input.storageLocation,
          notes: input.notes,
          created_by: actor.id,
          updated_by: actor.id,
        })
        .select()
        .single();
      if (created.error) {
        if (customer.created && customer.id)
          await this.client.from("customers").delete().eq("id", customer.id);
        await Promise.allSettled(
          uploaded.map((item) => deleteCloudinaryImage(item.storagePath)),
        );
        mapDatabaseError(created.error);
      }
      const data = created.data as { id: string };
      const attachments = await this.client.from("package_attachments").insert(
        uploaded.map((item) => ({
          package_id: packageId,
          type: input.receivingCondition === "DAMAGED" ? "DAMAGED" : "RECEIVED",
          storage_path: item.storagePath,
          original_filename: item.file.name,
          mime_type: item.mime,
          size_bytes: item.file.size,
          uploaded_by: actor.id,
        })),
      );
      if (attachments.error) {
        await this.client.from("packages").delete().eq("id", packageId);
        if (customer.created && customer.id)
          await this.client.from("customers").delete().eq("id", customer.id);
        await Promise.allSettled(
          uploaded.map((item) => deleteCloudinaryImage(item.storagePath)),
        );
        mapDatabaseError(attachments.error);
      }
      if (customer.created && customer.id)
        await this.audit(actor, "CUSTOMER_CREATED", "CUSTOMER", customer.id);
      await this.client.from("package_status_history").insert({
        package_id: data.id,
        to_status: initialStatus,
        actor_id: actor.id,
      });
      await this.audit(
        actor,
        input.duplicateOverride
          ? "PACKAGE_DUPLICATE_OVERRIDE"
          : "PACKAGE_CREATED",
        "PACKAGE",
        data.id,
      );
      return ok(data, undefined, { status: 201 });
    }
    if (
      method === "POST" &&
      id &&
      ["hold", "release-hold"].includes(action ?? "")
    ) {
      const status = action === "hold" ? "HOLD" : "WAITING_CLOSING";
      return ok(
        await this.changePackageStatus(
          id,
          status,
          actor,
          (await body(request)).reason,
        ),
      );
    }
    if (method === "PATCH" && id) {
      if (actor.role !== "ADMIN")
        throw new AppError("AUTH_FORBIDDEN", "Hanya admin yang dapat mengedit paket.");
      const packageId = requireId(id);
      const current = db(
        await this.client
          .from("packages")
          .select("*,package_attachments(*),closing_packages(is_active,closings(status))")
          .eq("id", packageId)
          .single(),
      ) as Record<string, unknown>;
      const memberships = (current.closing_packages ?? []) as {
        is_active: boolean;
        closings: { status: string } | null;
      }[];
      const locked =
        !["WAITING_CLOSING", "DAMAGED"].includes(String(current.status)) ||
        memberships.some(
          (item) =>
            item.is_active &&
            item.closings &&
            ["FINALIZED", "IN_SHIPMENT", "ARRIVED", "COMPLETED"].includes(
              item.closings.status,
            ),
        );
      if (locked)
        throw new AppError(
          "PACKAGE_EDIT_LOCKED",
          "Paket tidak dapat diedit setelah closing difinalisasi.",
        );

      const form = await request.formData();
      const raw = packagePayload(form);
      const input = packageIntakeSchema.parse(raw);
      const files = await validatedPackageFiles(form, 0);
      const keepIds = Array.isArray(raw.keepAttachmentIds)
        ? raw.keepAttachmentIds.map((value) => uuid.parse(value))
        : [];
      const existing = (current.package_attachments ?? []) as {
        id: string;
        storage_path: string;
        type: string;
        original_filename: string | null;
        mime_type: string | null;
        size_bytes: number | null;
        uploaded_by: string;
      }[];
      if (keepIds.some((keepId) => !existing.some((item) => item.id === keepId)))
        throw new AppError("VALIDATION_ERROR", "Foto yang dipertahankan tidak valid.");
      if (keepIds.length + files.length < 1 || keepIds.length + files.length > 2)
        throw new AppError("VALIDATION_ERROR", "Paket wajib memiliki 1-2 foto.");

      const normalized = normalizeTrackingNumber(input.trackingNumber);
      const trackingChanged =
        normalized !== String(current.normalized_tracking_number);
      const duplicates = db(
        await this.client
          .from("packages")
          .select("id")
          .eq("normalized_tracking_number", normalized)
          .neq("id", packageId),
      ) as unknown[];
      if (trackingChanged && duplicates.length && !input.duplicateOverride)
        throw new AppError("PACKAGE_DUPLICATE_TRACKING", "Nomor resi sudah tercatat.");
      if (
        trackingChanged &&
        duplicates.length &&
        !input.duplicateOverrideReason?.trim()
      )
        throw new AppError("VALIDATION_ERROR", "Alasan duplikat wajib diisi.");

      const pricing = calculatePackageCharge({
        actualWeightKg: input.actualWeightKg,
        lengthCm: input.lengthCm ?? undefined,
        widthCm: input.widthCm ?? undefined,
        heightCm: input.heightCm ?? undefined,
        chargeType: input.chargeType,
        manualAmountIdr: input.manualAmountIdr,
      });
      const uploaded: {
        storagePath: string;
        publicId: string;
        file: File;
        mime: string;
      }[] = [];
      try {
        for (const item of files) {
          const result = await uploadCloudinaryImage(
            item.file,
            `jastipin/packages/${packageId}/${randomUUID()}`,
          );
          uploaded.push({ ...result, file: item.file, mime: item.mime });
        }
      } catch (error) {
        await Promise.allSettled(
          uploaded.map((item) => deleteCloudinaryImage(item.storagePath)),
        );
        throw error;
      }
      let customer: { id: string; created: boolean };
      try {
        customer = await this.resolveIncomingCustomer(
          input.customerId,
          input.customerName,
        );
      } catch (error) {
        await Promise.allSettled(
          uploaded.map((item) => deleteCloudinaryImage(item.storagePath)),
        );
        throw error;
      }
      const removed = existing.filter((item) => !keepIds.includes(item.id));
      if (removed.length)
        db(
          await this.client
            .from("package_attachments")
            .delete()
            .in("id", removed.map((item) => item.id)),
        );
      const attachmentType = input.receivingCondition === "DAMAGED" ? "DAMAGED" : "RECEIVED";
      const inserted = uploaded.length
        ? await this.client.from("package_attachments").insert(
            uploaded.map((item) => ({
              package_id: packageId,
              type: attachmentType,
              storage_path: item.storagePath,
              original_filename: item.file.name,
              mime_type: item.mime,
              size_bytes: item.file.size,
              uploaded_by: actor.id,
            })),
          )
        : { error: null };
      if (inserted.error) {
        if (removed.length) await this.client.from("package_attachments").insert(removed);
        if (customer.created && customer.id)
          await this.client.from("customers").delete().eq("id", customer.id);
        await Promise.allSettled(
          uploaded.map((item) => deleteCloudinaryImage(item.storagePath)),
        );
        mapDatabaseError(inserted.error);
      }
      const status = input.receivingCondition === "DAMAGED" ? "DAMAGED" : "WAITING_CLOSING";
      const updated = await this.client
        .from("packages")
        .update({
          customer_id: customer.id,
          tracking_number: input.trackingNumber,
          normalized_tracking_number: normalized,
          courier: input.courier,
          received_date: input.receivedDate,
          received_time: input.receivedTime,
          received_at: packageReceivedAt(input.receivedDate, input.receivedTime),
          actual_weight_kg: pricing.actualWeightKg,
          length_cm: input.lengthCm,
          width_cm: input.widthCm,
          height_cm: input.heightCm,
          volumetric_weight_kg: pricing.volumetricWeightKg,
          chargeable_weight_kg: pricing.chargeableWeightKg,
          charge_type: "FIXED",
          shipping_fee_idr: pricing.amountIdr,
          pricing_snapshot: pricing.pricingSnapshot,
          status,
          duplicate_override: trackingChanged
            ? input.duplicateOverride
            : Boolean(current.duplicate_override),
          duplicate_override_reason: trackingChanged
            ? input.duplicateOverrideReason
            : (current.duplicate_override_reason as string | null),
          notes: input.notes,
          updated_by: actor.id,
        })
        .eq("id", packageId)
        .select()
        .single();
      if (updated.error) {
        await this.client
          .from("package_attachments")
          .delete()
          .in("storage_path", uploaded.map((item) => item.storagePath));
        if (removed.length) await this.client.from("package_attachments").insert(removed);
        if (customer.created && customer.id)
          await this.client.from("customers").delete().eq("id", customer.id);
        await Promise.allSettled(
          uploaded.map((item) => deleteCloudinaryImage(item.storagePath)),
        );
        mapDatabaseError(updated.error);
      }
      if (keepIds.length)
        await this.client
          .from("package_attachments")
          .update({ type: attachmentType })
          .in("id", keepIds);
      if (String(current.status) !== status)
        await this.client.from("package_status_history").insert({
          package_id: packageId,
          from_status: String(current.status),
          to_status: status,
          actor_id: actor.id,
          reason: "Diperbarui admin",
        });
      await Promise.allSettled(
        removed.map(async (item) => {
          const deleted = await deleteCloudinaryImage(item.storage_path);
          if (!deleted)
            db(
              await this.client.storage
                .from("package-evidence")
                .remove([item.storage_path]),
            );
        }),
      );
      const data = updated.data;
      await this.audit(actor, "PACKAGE_UPDATED", "PACKAGE", id);
      return ok(data);
    }
    throw new AppError(
      "NOT_FOUND",
      "Operasi paket tidak ditemukan.",
      undefined,
      404,
    );
  }

  private async closings(
    request: NextRequest,
    method: string,
    id: string | undefined,
    action: string | undefined,
    subId: string | undefined,
    actor: Actor,
  ) {
    if (method === "GET" && id && action === "export")
      return this.exportClosing(
        id,
        request.nextUrl.searchParams.get("format") ?? "pdf",
      );
    if (method === "GET" && id)
      return ok(
        db(
          await this.client
            .from("closings")
            .select(
              "*,closing_packages(*,packages(*,customers(*))),invoices(*)",
            )
            .eq("id", requireId(id))
            .single(),
        ),
      );
    if (method === "GET")
      return this.simpleList(request, "closings", undefined, "closing_date");
    if (method === "POST" && !id) {
      const input = closingSchema.parse(await body(request));
      const data = db(
        await this.client
          .from("closings")
          .insert({
            code: await code(this.client, "CLOSING", "CLS", input.closingDate),
            closing_date: input.closingDate,
            notes: input.notes,
            created_by: actor.id,
          })
          .select()
          .single(),
      );
      return ok(data, undefined, { status: 201 });
    }
    if (method === "POST" && id && action === "packages") {
      const input = await body(request);
      const packageIds = (input.packageIds as unknown[]).map((value) =>
        uuid.parse(value),
      );
      return ok(
        db(
          await this.client
            .from("closing_packages")
            .insert(
              packageIds.map((packageId) => ({
                closing_id: requireId(id),
                package_id: packageId,
              })),
            )
            .select(),
        ),
      );
    }
    if (method === "DELETE" && id && action === "packages" && subId) {
      db(
        await this.client
          .from("closing_packages")
          .delete()
          .eq("closing_id", requireId(id))
          .eq("package_id", requireId(subId)),
      );
      return ok({ deleted: true });
    }
    if (method === "POST" && id && action === "finalize")
      return ok(
        db(
          await this.client.rpc("finalize_closing", {
            p_closing_id: requireId(id),
            p_actor_id: actor.id,
          }),
        ),
      );
    if (method === "POST" && id && action === "cancel") {
      const reason = String((await body(request)).reason ?? "");
      return ok(
        db(
          await this.client.rpc("cancel_closing", {
            p_closing_id: requireId(id),
            p_actor_id: actor.id,
            p_reason: reason,
          }),
        ),
      );
    }
    if (method === "PATCH" && id) {
      const input = closingSchema.partial().parse(await body(request));
      return ok(
        db(
          await this.client
            .from("closings")
            .update({ closing_date: input.closingDate, notes: input.notes })
            .eq("id", requireId(id))
            .eq("status", "DRAFT")
            .select()
            .single(),
        ),
      );
    }
    throw new AppError(
      "NOT_FOUND",
      "Operasi closing tidak ditemukan.",
      undefined,
      404,
    );
  }

  private async shipments(
    request: NextRequest,
    method: string,
    id: string | undefined,
    action: string | undefined,
    actor: Actor,
  ) {
    if (method === "GET" && id && action === "reconciliation")
      return this.reconciliation(id);
    if (method === "GET" && id)
      return ok(
        db(
          await this.client
            .from("shipments")
            .select("*,shipment_closings(*,closings(*))")
            .eq("id", requireId(id))
            .single(),
        ),
      );
    if (method === "GET")
      return this.simpleList(request, "shipments", undefined, "created_at");
    if (method === "POST" && !id) {
      const input = shipmentSchema.parse(await body(request));
      const data = db(
        await this.client
          .from("shipments")
          .insert({
            code: await code(
              this.client,
              "SHIPMENT",
              "SHP",
              new Date().toISOString().slice(0, 10),
            ),
            vessel_name: input.vesselName,
            estimated_arrival_at: input.estimatedArrivalAt,
            notes: input.notes,
            created_by: actor.id,
          })
          .select()
          .single(),
      );
      return ok(data, undefined, { status: 201 });
    }
    if (method === "POST" && id && action === "closings") {
      const ids = ((await body(request)).closingIds as unknown[]).map((value) =>
        uuid.parse(value),
      );
      return ok(
        db(
          await this.client
            .from("shipment_closings")
            .insert(
              ids.map((closingId) => ({
                shipment_id: requireId(id),
                closing_id: closingId,
              })),
            )
            .select(),
        ),
      );
    }
    if (method === "POST" && id && action === "depart")
      return ok(
        db(
          await this.client.rpc("depart_shipment", {
            p_shipment_id: requireId(id),
            p_actor_id: actor.id,
            p_departure_at:
              (await body(request)).departureAt ?? new Date().toISOString(),
          }),
        ),
      );
    if (method === "POST" && id && action === "arrival-scan")
      return ok(await this.arrivalScan(id, await body(request), actor));
    if (method === "POST" && id && action === "reconcile")
      return ok(
        db(
          await this.client.rpc("reconcile_shipment", {
            p_shipment_id: requireId(id),
            p_actor_id: actor.id,
            p_confirm_missing: Boolean((await body(request)).confirmMissing),
          }),
        ),
      );
    if (method === "PATCH" && id) {
      const input = shipmentSchema.partial().parse(await body(request));
      return ok(
        db(
          await this.client
            .from("shipments")
            .update({
              vessel_name: input.vesselName,
              estimated_arrival_at: input.estimatedArrivalAt,
              notes: input.notes,
            })
            .eq("id", requireId(id))
            .in("status", ["DRAFT", "READY"])
            .select()
            .single(),
        ),
      );
    }
    throw new AppError(
      "NOT_FOUND",
      "Operasi pengiriman tidak ditemukan.",
      undefined,
      404,
    );
  }

  private async payments(request: NextRequest, method: string, actor: Actor) {
    if (method === "GET")
      return this.simpleList(request, "payments", undefined, "paid_at");
    if (method === "POST") {
      const input = paymentSchema.parse(await body(request));
      const key = uuid.parse(request.headers.get("idempotency-key"));
      return ok(
        db(
          await this.client.rpc("record_payment", {
            p_invoice_id: input.invoiceId,
            p_amount: input.amountIdr,
            p_method: input.method,
            p_paid_at: input.paidAt,
            p_reference: input.reference,
            p_notes: input.notes,
            p_idempotency_key: key,
            p_actor_id: actor.id,
          }),
        ),
        undefined,
        { status: 201 },
      );
    }
    throw new AppError(
      "NOT_FOUND",
      "Operasi pembayaran tidak ditemukan.",
      undefined,
      404,
    );
  }
  private async expenses(
    request: NextRequest,
    method: string,
    id: string | undefined,
    actor: Actor,
  ) {
    if (method === "GET")
      return id
        ? ok(
            db(
              await this.client
                .from("expenses")
                .select("*")
                .eq("id", requireId(id))
                .single(),
            ),
          )
        : this.simpleList(request, "expenses", undefined, "expense_date");
    const input = (
      method === "PATCH" ? expenseSchema.partial() : expenseSchema
    ).parse(await body(request));
    const payload = {
      expense_date: input.expenseDate,
      category: input.category,
      amount_idr: input.amountIdr,
      closing_id: input.closingId,
      shipment_id: input.shipmentId,
      description: input.description,
      notes: input.notes,
      created_by: actor.id,
    };
    if (method === "POST")
      return ok(
        db(
          await this.client.from("expenses").insert(payload).select().single(),
        ),
        undefined,
        { status: 201 },
      );
    if (method === "PATCH" && id)
      return ok(
        db(
          await this.client
            .from("expenses")
            .update(payload)
            .eq("id", requireId(id))
            .select()
            .single(),
        ),
      );
    throw new AppError(
      "NOT_FOUND",
      "Operasi pengeluaran tidak ditemukan.",
      undefined,
      404,
    );
  }
  private async pickups(
    request: NextRequest,
    method: string,
    id: string | undefined,
    actor: Actor,
  ) {
    if (method === "GET")
      return id
        ? ok(
            db(
              await this.client
                .from("pickups")
                .select("*,pickup_packages(*,packages(*))")
                .eq("id", requireId(id))
                .single(),
            ),
          )
        : this.simpleList(request, "pickups", undefined, "picked_up_at");
    if (method === "POST") {
      const input = pickupSchema.parse(await body(request));
      const key = uuid.parse(request.headers.get("idempotency-key"));
      return ok(
        db(
          await this.client.rpc("complete_pickup", {
            p_customer_id: input.customerId,
            p_package_ids: input.packageIds,
            p_picked_up_at: input.pickedUpAt,
            p_recipient_name: input.recipientName,
            p_notes: input.notes,
            p_idempotency_key: key,
            p_actor_id: actor.id,
          }),
        ),
        undefined,
        { status: 201 },
      );
    }
    throw new AppError(
      "NOT_FOUND",
      "Operasi pickup tidak ditemukan.",
      undefined,
      404,
    );
  }

  private async reports(request: NextRequest, type?: string) {
    const from = request.nextUrl.searchParams.get("dateFrom") ?? "1970-01-01";
    const to = request.nextUrl.searchParams.get("dateTo") ?? "2999-12-31";
    if (type === "operational") {
      const { data } = await this.client
        .from("packages")
        .select(
          "status,actual_weight_kg,chargeable_weight_kg,shipping_fee_idr",
        )
        .gte("received_date", from)
        .lte("received_date", to);
      const rows = data ?? [];
      return ok({
        packageCount: rows.length,
        totalActualWeightKg: rows
          .reduce((s, r) => s + Number(r.actual_weight_kg ?? 0), 0)
          .toFixed(3),
        totalChargeableWeightKg: rows
          .reduce((s, r) => s + Number(r.chargeable_weight_kg ?? 0), 0)
          .toFixed(3),
        byStatus: Object.fromEntries(
          [...new Set(rows.map((r) => r.status))].map((status) => [
            status,
            rows.filter((r) => r.status === status).length,
          ]),
        ),
      });
    }
    if (type === "financial") {
      const [inv, pay, exp] = await Promise.all([
        this.client
          .from("invoices")
          .select("total_idr,balance_idr")
          .gte("created_at", from)
          .lte("created_at", `${to}T23:59:59.999Z`)
          .neq("status", "VOID"),
        this.client
          .from("payments")
          .select("amount_idr")
          .gte("paid_at", from)
          .lte("paid_at", `${to}T23:59:59.999Z`),
        this.client
          .from("expenses")
          .select("amount_idr")
          .gte("expense_date", from)
          .lte("expense_date", to),
      ]);
      const sum = (rows: Record<string, unknown>[] | null, key: string) =>
        String((rows ?? []).reduce((s, r) => s + Number(r[key] ?? 0), 0));
      const revenue = sum(inv.data, "total_idr"),
        expenses = sum(exp.data, "amount_idr");
      return ok({
        revenueIdr: revenue,
        collectedIdr: sum(pay.data, "amount_idr"),
        outstandingIdr: sum(inv.data, "balance_idr"),
        expensesIdr: expenses,
        recordedGrossProfitIdr: String(Number(revenue) - Number(expenses)),
      });
    }
    throw new AppError("NOT_FOUND", "Laporan tidak ditemukan.", undefined, 404);
  }

  private async users(
    request: NextRequest,
    method: string,
    id: string | undefined,
    actor: Actor,
  ) {
    if (method === "GET")
      return ok(
        db(
          await this.client
            .from("profiles")
            .select("id,name,role,is_active,created_at")
            .order("created_at"),
        ),
      );
    if (method === "POST") {
      const input = userSchema.parse(await body(request));
      const auth = await this.client.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
      });
      if (auth.error || !auth.data.user) mapDatabaseError(auth.error);
      const profile = await this.client
        .from("profiles")
        .insert({ id: auth.data.user.id, name: input.name, role: input.role })
        .select()
        .single();
      if (profile.error) {
        await this.client.auth.admin.deleteUser(auth.data.user.id);
        mapDatabaseError(profile.error);
      }
      await this.audit(actor, "USER_CREATED", "USER", auth.data.user.id);
      return ok(profile.data, undefined, { status: 201 });
    }
    if (method === "PATCH" && id) {
      const input = userSchema
        .omit({ email: true, password: true })
        .partial()
        .parse(await body(request));
      const data = db(
        await this.client
          .from("profiles")
          .update({
            name: input.name,
            role: input.role,
            is_active: (await body(request)).isActive,
          })
          .eq("id", requireId(id))
          .select()
          .single(),
      );
      return ok(data);
    }
    throw new AppError(
      "NOT_FOUND",
      "Operasi user tidak ditemukan.",
      undefined,
      404,
    );
  }

  private async files(method: string, id: string | undefined, actor: Actor) {
    const attachment = db(
      await this.client
        .from("package_attachments")
        .select("*,packages(status,created_by)")
        .eq("id", requireId(id))
        .single(),
    ) as Record<string, unknown>;
    if (method === "GET") {
      const cloudinaryUrl = cloudinaryDeliveryUrl(
        String(attachment.storage_path),
      );
      if (cloudinaryUrl) return NextResponse.redirect(cloudinaryUrl);
      const downloaded = await this.client.storage
        .from("package-evidence")
        .download(String(attachment.storage_path));
      if (downloaded.error) mapDatabaseError(downloaded.error);
      return new NextResponse(downloaded.data, {
        headers: {
          "content-type": String(
            attachment.mime_type ?? "application/octet-stream",
          ),
          "content-disposition": `inline; filename="${String(attachment.original_filename ?? "evidence")}"`,
        },
      });
    }
    if (method === "DELETE") {
      const pkg = attachment.packages as { status: string; created_by: string };
      if (
        actor.role !== "ADMIN" &&
        !(pkg.created_by === actor.id && pkg.status === "WAITING_CLOSING")
      )
        throw new AppError("AUTH_FORBIDDEN", "Lampiran tidak dapat dihapus.");
      const storagePath = String(attachment.storage_path);
      const deletedFromCloudinary = await deleteCloudinaryImage(storagePath);
      if (!deletedFromCloudinary)
        db(
          await this.client.storage
            .from("package-evidence")
            .remove([storagePath]),
        );
      db(await this.client.from("package_attachments").delete().eq("id", id));
      await this.audit(
        actor,
        "PACKAGE_ATTACHMENT_DELETED",
        "PACKAGE_ATTACHMENT",
        id!,
      );
      return ok({ deleted: true });
    }
    throw new AppError(
      "NOT_FOUND",
      "Operasi file tidak ditemukan.",
      undefined,
      404,
    );
  }

  private async simpleList(
    request: NextRequest,
    table: string,
    id: string | undefined,
    order: string,
  ) {
    if (id)
      return ok(
        db(
          await this.client
            .from(table)
            .select("*")
            .eq("id", requireId(id))
            .single(),
        ),
      );
    const p = pagination(request);
    let query = this.client.from(table).select("*", { count: "exact" });
    if (p.status) query = query.eq("status", p.status);
    const result = await query
      .order(order, { ascending: false })
      .range(p.from, p.to);
    if (result.error) mapDatabaseError(result.error);
    return ok(result.data, pageMeta(p.page, p.pageSize, result.count ?? 0));
  }
  private async changePackageStatus(
    id: string,
    to: string,
    actor: Actor,
    reason?: string,
  ) {
    const current = db(
      await this.client
        .from("packages")
        .select("status")
        .eq("id", requireId(id))
        .single(),
    ) as { status: string };
    const data = db(
      await this.client
        .from("packages")
        .update({ status: to, updated_by: actor.id })
        .eq("id", id)
        .select()
        .single(),
    );
    db(
      await this.client.from("package_status_history").insert({
        package_id: id,
        from_status: current.status,
        to_status: to,
        reason,
        actor_id: actor.id,
      }),
    );
    return data;
  }
  private async arrivalScan(
    shipmentId: string,
    input: Record<string, unknown>,
    actor: Actor,
  ) {
    const normalized = normalizeTrackingNumber(
      String(input.trackingNumber ?? ""),
    );
    const closings = db(
      await this.client
        .from("shipment_closings")
        .select("closing_id")
        .eq("shipment_id", requireId(shipmentId)),
    ) as { closing_id: string }[];
    const memberships = db(
      await this.client
        .from("closing_packages")
        .select("package_id")
        .in(
          "closing_id",
          closings.map((c) => c.closing_id),
        )
        .eq("is_active", true),
    ) as { package_id: string }[];
    const pkg = db(
      await this.client
        .from("packages")
        .select("id,status")
        .in(
          "id",
          memberships.map((m) => m.package_id),
        )
        .eq("normalized_tracking_number", normalized)
        .maybeSingle(),
    ) as { id: string; status: string } | null;
    if (!pkg)
      throw new AppError(
        "PACKAGE_NOT_IN_SHIPMENT",
        "Paket tidak termasuk dalam pengiriman ini.",
      );
    const inserted = await this.client
      .from("arrival_checks")
      .insert({
        shipment_id: shipmentId,
        package_id: pkg.id,
        condition: input.condition ?? "OK",
        checked_by: actor.id,
        notes: input.notes,
      })
      .select()
      .single();
    if (inserted.error?.code === "23505")
      throw new AppError("ARRIVAL_ALREADY_SCANNED", "Paket sudah dipindai.");
    if (inserted.error) mapDatabaseError(inserted.error);
    await this.changePackageStatus(
      pkg.id,
      input.condition === "DAMAGED" ? "DAMAGED" : "ARRIVED_MERAUKE",
      actor,
    );
    return inserted.data;
  }
  private async reconciliation(shipmentId: string) {
    const closings = db(
      await this.client
        .from("shipment_closings")
        .select("closing_id")
        .eq("shipment_id", requireId(shipmentId)),
    ) as { closing_id: string }[];
    const expected = db(
      await this.client
        .from("closing_packages")
        .select(
          "package_id,packages(package_code,tracking_number,status,customer_id)",
        )
        .in(
          "closing_id",
          closings.map((c) => c.closing_id),
        )
        .eq("is_active", true),
    ) as Record<string, unknown>[];
    const checks = db(
      await this.client
        .from("arrival_checks")
        .select("*")
        .eq("shipment_id", shipmentId),
    ) as { package_id: string }[];
    const checked = new Set(checks.map((c) => c.package_id));
    return ok({
      expected: expected.length,
      checked: checked.size,
      remaining: expected.length - checked.size,
      missing: expected.filter((row) => !checked.has(String(row.package_id))),
      checks,
    });
  }
  private async exportClosing(id: string, format: string) {
    const closing = db(
      await this.client
        .from("closings")
        .select(
          "code,closing_date,closing_packages(shipping_fee_snapshot_idr,actual_weight_snapshot_kg,chargeable_weight_snapshot_kg,packages(tracking_number,customers(name)))",
        )
        .eq("id", requireId(id))
        .single(),
    ) as Record<string, unknown>;
    const rows = (closing.closing_packages as Record<string, unknown>[]) ?? [];
    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Closing");
      sheet.columns = [
        { header: "NO", key: "no", width: 8 },
        { header: "CUSTOMER", key: "customer", width: 30 },
        { header: "TRACKING NUMBER", key: "tracking", width: 30 },
        { header: "WEIGHT", key: "weight", width: 14 },
        { header: "SHIPPING FEE", key: "fee", width: 18 },
      ];
      rows.forEach((row, index) => {
        const pkg = row.packages as Record<string, unknown>;
        const customer = pkg.customers as Record<string, unknown>;
        sheet.addRow({
          no: index + 1,
          customer: customer?.name,
          tracking: pkg.tracking_number,
          weight: row.chargeable_weight_snapshot_kg,
          fee: Number(row.shipping_fee_snapshot_idr),
        });
      });
      const output = await workbook.xlsx.writeBuffer();
      return new NextResponse(Buffer.from(output), {
        headers: {
          "content-type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "content-disposition": `attachment; filename="${closing.code}.xlsx"`,
        },
      });
    }
    if (format === "csv") {
      const lines = [
        "NO,CUSTOMER,TRACKING NUMBER,WEIGHT,SHIPPING FEE",
        ...rows.map((row, index) => {
          const pkg = row.packages as Record<string, unknown>;
          const customer = pkg.customers as Record<string, unknown>;
          return [
            index + 1,
            customer?.name,
            pkg.tracking_number,
            row.chargeable_weight_snapshot_kg,
            row.shipping_fee_snapshot_idr,
          ]
            .map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`)
            .join(",");
        }),
      ];
      return new NextResponse(lines.join("\n"), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="${closing.code}.csv"`,
        },
      });
    }
    const text = [
      `JASTIPin - ${closing.code}`,
      `Tanggal: ${closing.closing_date}`,
      "",
      ...rows.map((row, index) => {
        const pkg = row.packages as Record<string, unknown>;
        const customer = pkg.customers as Record<string, unknown>;
        return `${index + 1}. ${customer?.name} | ${pkg.tracking_number} | ${row.chargeable_weight_snapshot_kg} kg | Rp${row.shipping_fee_snapshot_idr}`;
      }),
    ].join("\n");
    const pdf = Buffer.from(
      `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length ${text.length + 50}>>stream\nBT /F1 9 Tf 40 800 Td (${text.replace(/[()\\]/g, " ").replace(/\n/g, ") Tj 0 -14 Td (")}) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\nxref\n0 6\n0000000000 65535 f \ntrailer<</Root 1 0 R/Size 6>>\nstartxref\n0\n%%EOF`,
    );
    return new NextResponse(pdf, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${closing.code}.pdf"`,
      },
    });
  }
  private async audit(
    actor: Actor,
    action: string,
    entityType: string,
    entityId: string,
  ) {
    await this.client.from("audit_logs").insert({
      actor_id: actor.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
    });
  }
}
