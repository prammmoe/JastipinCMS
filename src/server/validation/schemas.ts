import { z } from "zod";
const optionalText = z.string().trim().max(1000).nullish();
export const uuid = z.uuid();
export const paginationSchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(200).default(50), search: z.string().trim().max(100).default(""), status: z.string().max(50).optional(), sort: z.string().max(50).optional() });
export const customerSchema = z.object({ name: z.string().trim().min(1).max(160), phone: z.string().trim().max(30).nullish(), address: optionalText, notes: optionalText, isActive: z.boolean().optional() });
export const rateSchema = z.object({ name:z.string().trim().min(1).max(160),ratePerKgIdr:z.coerce.number().int().min(0).nullish(),minimumChargeIdr:z.coerce.number().int().min(0).nullish(),volumetricDivisor:z.coerce.number().positive().nullish(),roundingStepKg:z.coerce.number().positive().nullish(),validFrom:z.iso.date().nullish(),validUntil:z.iso.date().nullish(),isActive:z.boolean().default(true),notes:optionalText });
export const packageSchema = z.object({ customerId:z.uuid().nullish(),customerName:z.string().trim().max(160).nullish(),trackingNumber:z.string().trim().min(1).max(120),courier:z.string().trim().max(80).nullish(),receivedAt:z.iso.datetime().optional(),actualWeightKg:z.coerce.number().positive().nullish(),lengthCm:z.coerce.number().positive().nullish(),widthCm:z.coerce.number().positive().nullish(),heightCm:z.coerce.number().positive().nullish(),chargeType:z.enum(["WEIGHT","VOLUMETRIC","FIXED","MANUAL"]),rateConfigId:z.uuid().nullish(),manualAmountIdr:z.coerce.number().int().min(0).nullish(),overrideReason:z.string().trim().max(500).nullish(),duplicateOverride:z.boolean().default(false),duplicateOverrideReason:z.string().trim().max(500).nullish(),storageLocation:z.string().trim().max(100).nullish(),receivingCondition:z.enum(["RECEIVED","DAMAGED"]).default("RECEIVED"),notes:optionalText });
const receivedTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullish();
export const packageIntakeSchema = packageSchema.extend({
  customerName:z.string().trim().max(160).nullish(),receivedDate:z.iso.date(),receivedTime:receivedTimeSchema,
  actualWeightKg:z.coerce.number().positive(),chargeType:z.literal("FIXED").default("FIXED"),
  manualAmountIdr:z.coerce.number().int().positive(),receivingCondition:z.enum(["RECEIVED","DAMAGED"]).default("RECEIVED")
}).superRefine((value,context)=>{if(!value.customerId&&!value.customerName?.trim())context.addIssue({code:"custom",path:["customerName"],message:"Customer wajib diisi."})});
const packageStatusEnum = z.enum(["WAITING_CLOSING","READY_TO_SHIP","IN_TRANSIT","ARRIVED_MERAUKE","READY_FOR_PICKUP","COMPLETED","HOLD","DAMAGED","MISSING"]);
export const packageListSchema = paginationSchema.extend({
  dateFrom:z.iso.date().optional(),dateTo:z.iso.date().optional(),customerId:z.uuid().optional(),status:packageStatusEnum.optional(),attention:z.enum(["true","false"]).optional(),
  sort:z.enum(["received_desc","received_asc","fee_desc","fee_asc","name_asc","name_desc","packages_desc","packages_asc"]).default("received_desc")
});
export const customerHistorySchema = z.object({
  year:z.coerce.number().int().min(2000).max(2100).optional(),
  month:z.coerce.number().int().min(1).max(12).optional(),
  from:z.iso.date().optional(),
  to:z.iso.date().optional(),
  status:packageStatusEnum.optional(),
});
export const closingSchema = z.object({ closingDate:z.iso.date(),notes:optionalText });
export const shipmentSchema = z.object({ vesselName:z.string().trim().max(160).nullish(),estimatedArrivalAt:z.iso.datetime().nullish(),notes:optionalText });
export const paymentSchema = z.object({ invoiceId:z.uuid(),amountIdr:z.coerce.number().int().positive(),method:z.enum(["CASH","BANK_TRANSFER","OTHER"]),paidAt:z.iso.datetime(),reference:z.string().trim().max(160).nullish(),notes:optionalText });
export const expenseSchema = z.object({ expenseDate:z.iso.date(),category:z.enum(["SEA_FREIGHT","TRANSPORT","PACKAGING","SALARY","RENT","OPERATIONS","OTHER"]),amountIdr:z.coerce.number().int().positive(),closingId:z.uuid().nullish(),shipmentId:z.uuid().nullish(),description:z.string().trim().min(1).max(500),notes:optionalText });
export const pickupSchema = z.object({ customerId:z.uuid(),packageIds:z.array(z.uuid()).min(1),pickedUpAt:z.iso.datetime(),recipientName:z.string().trim().max(160).nullish(),notes:optionalText });
export const userSchema = z.object({ email:z.email(),password:z.string().min(10).max(128),name:z.string().trim().min(1).max(160),role:z.enum(["ADMIN","STAFF_SIDOARJO","STAFF_MERAUKE"]) });
