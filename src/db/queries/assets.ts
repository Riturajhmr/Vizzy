import 'server-only'
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { schema } from '@/db'
import { AppError, ErrorCode } from '@/types/errors'

export type Asset = InferSelectModel<typeof schema.assets>
export type NewAsset = InferInsertModel<typeof schema.assets>

// Phase 4 expansion
export async function createAsset(_data: NewAsset): Promise<Asset> {
  throw new AppError('Asset creation not yet implemented', ErrorCode.UNKNOWN, 501)
}

// Phase 4 expansion
export async function getUserAssets(_userId: string): Promise<Asset[]> {
  throw new AppError('Asset listing not yet implemented', ErrorCode.UNKNOWN, 501)
}
