import { z } from "zod";
import { isCalendarDate } from "../../lib/calendar-date";

const columnTypes = ["integer", "decimal", "float", "boolean", "string", "date", "time", "timestamp", "timestamp_tz", "binary", "list", "struct", "map", "null"] as const;
const valueEncodings = ["integer-string", "decimal-string", "number-or-special-string", "boolean", "string", "iso-date", "iso-time", "iso-local-datetime", "iso-utc-datetime", "base64", "array", "field-array", "pair-array", "null"] as const;
export interface Descriptor {
  readonly name: string;
  readonly type: typeof columnTypes[number];
  readonly encoding: typeof valueEncodings[number];
  readonly precision?: number | undefined;
  readonly scale?: number | undefined;
  readonly children?: readonly Descriptor[] | undefined;
}
const encodingByType: Record<Descriptor["type"], Descriptor["encoding"]> = {
  integer: "integer-string",
  decimal: "decimal-string",
  float: "number-or-special-string",
  boolean: "boolean",
  string: "string",
  date: "iso-date",
  time: "iso-time",
  timestamp: "iso-local-datetime",
  timestamp_tz: "iso-utc-datetime",
  binary: "base64",
  list: "array",
  struct: "field-array",
  map: "pair-array",
  null: "null",
};
const descriptorFields = {
  name: z.string(), type: z.enum(columnTypes), encoding: z.enum(valueEncodings),
  precision: z.number().int().min(1).max(38).optional(), scale: z.number().int().min(0).max(38).optional(),
  children: z.lazy((): z.ZodType<Descriptor[]> => z.array(childSchema)).optional(),
};
function validDescriptor(value: Descriptor): boolean {
  if (value.encoding !== encodingByType[value.type]) return false;
  if (value.type === "decimal") return value.precision !== undefined && value.scale !== undefined && value.scale <= value.precision && value.children === undefined;
  if (value.precision !== undefined || value.scale !== undefined) return false;
  if (value.type === "list") return value.children?.length === 1;
  if (value.type === "map") return value.children?.length === 2;
  if (value.type === "struct") return value.children !== undefined;
  return value.children === undefined;
}
const childSchema: z.ZodType<Descriptor> = z.object(descriptorFields).strict().refine(validDescriptor);
export const columnSchema = z.object({ ...descriptorFields, index: z.number().int().nonnegative(), nullable: z.boolean().nullable(), unit: z.string().nullable() }).strict().refine(validDescriptor);
export const columnsSchema = z.array(columnSchema).refine((columns) => columns.every((column, index) => column.index === index));
export const opaqueSchema = z.string().min(1).max(256);
// The data API excludes year zero in addition to ordinary calendar validation.
export const dateSchema = z.string().refine((value) => isCalendarDate(value) && !value.startsWith("0000"));
export const instantSchema = z.iso.datetime();
const coverageSchema = z.object({ start_date: dateSchema.nullable(), end_date: dateSchema.nullable() }).strict().refine((range) => (range.start_date === null && range.end_date === null) || (range.start_date !== null && range.end_date !== null && range.start_date <= range.end_date));
export const datasetIdSchema = z.enum(["national", "facilities", "generators"]);
export const catalogSchema = z.object({
  generation_id: opaqueSchema,
  datasets: z.array(z.object({
    id: datasetIdSchema, sql_name: datasetIdSchema, label: z.string(), schema_version: z.literal("1"),
    columns: columnsSchema, supported_filters: z.tuple([z.literal("start_date"), z.literal("end_date")]), coverage: coverageSchema,
  }).strict()).refine((items) => new Set(items.map((item) => item.id)).size === items.length),
}).strict();
const tableFields = { columns: columnsSchema, rows: z.array(z.array(z.unknown())) };
export const previewSchema = z.object({
  ...tableFields, dataset: datasetIdSchema, generation_id: opaqueSchema, page_size: z.number().int().min(1).max(500),
  page_cursor: opaqueSchema, next_cursor: opaqueSchema.nullable(), has_more: z.boolean(), expires_at: instantSchema,
}).strict().refine((page) => page.has_more === (page.next_cursor !== null) && page.rows.length <= page.page_size && page.next_cursor !== page.page_cursor);
export const querySchema = z.object({
  ...tableFields, query_id: opaqueSchema, generation_id: opaqueSchema.nullable(),
  page: z.number().int().positive(), page_size: z.number().int().min(1).max(500), retained_row_count: z.number().int().min(0).max(1000),
  total_pages: z.number().int().positive(), has_more: z.boolean(), truncated: z.boolean(), truncation_reason: z.enum(["row_limit", "byte_limit"]).nullable(),
  limits: z.object({ max_rows: z.literal(1000), max_bytes: z.literal(1048576) }).strict(), expires_at: instantSchema,
}).strict().refine((page) => page.total_pages === Math.max(1, Math.ceil(page.retained_row_count / page.page_size))
  && page.page <= page.total_pages && page.has_more === (page.page < page.total_pages)
  && page.truncated === (page.truncation_reason !== null)
  && page.rows.length === Math.min(page.page_size, Math.max(0, page.retained_row_count - (page.page - 1) * page.page_size)));
export type WireColumn = z.infer<typeof columnSchema>;
