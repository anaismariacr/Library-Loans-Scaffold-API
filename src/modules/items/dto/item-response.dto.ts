import { Item, ItemType } from '../entities/item.entity';

export interface ItemResponse {
  id: string;
  code: string;
  title: string;
  type: ItemType;
  isActive: boolean;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const toItemResponse = (item: Item, activeLoansCount = 0): ItemResponse => ({
  id: item.id,
  code: item.code,
  title: item.title,
  type: item.type,
  isActive: item.isActive,
  isAvailable: activeLoansCount === 0,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});
