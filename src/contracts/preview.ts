import type { DatasetId, DateBounds } from "./catalog";
import type { OperationResult } from "./failures";
import type { ExpiryInstant, OperationContext } from "./session";
import type { OpaqueIdentifier, TableData } from "./table";

/** Proposed cursor preview models, intentionally separate from numbered SQL pages. */
export type PreviewCursor = string;

export interface AppliedFilters {
  readonly dates?: DateBounds;
  readonly facilityId?: OpaqueIdentifier;
}

export interface PreviewSelection {
  readonly datasetId: DatasetId;
  readonly filters: AppliedFilters;
  readonly pageSize: number;
}

export interface PreviewSequence {
  readonly selection: PreviewSelection;
  readonly snapshotId: string;
  /** Original expiry from the first page; continuation must not extend it. */
  readonly expiresAt: ExpiryInstant;
}

export interface PreviewPage {
  readonly sequence: PreviewSequence;
  readonly table: TableData;
  readonly pageCursor?: PreviewCursor;
  readonly hasMore?: boolean;
  readonly nextCursor: PreviewCursor | null;
}

export interface ContinuePreviewInput {
  readonly sequence: PreviewSequence;
  readonly cursor: PreviewCursor;
}

export interface PreviewOperations {
  startPreview(context: OperationContext, selection: PreviewSelection): Promise<OperationResult<PreviewPage>>;
  continuePreview(context: OperationContext, input: ContinuePreviewInput): Promise<OperationResult<PreviewPage>>;
}
