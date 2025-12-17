/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { supabase } from './supabaseClient';
import { Grid, InventoryItem } from '../types';

interface SaveDesignPayload {
  userId: string;
  grid: Grid;
  worldColor: string;
  floorColor: string;
  inventory: InventoryItem[];
}

export interface PersistedWorkspace {
  grid: Grid;
  worldColor?: string;
  floorColor?: string;
}

export async function fetchWorkspace(userId: string): Promise<PersistedWorkspace | null> {
  const { data: design, error } = await supabase
    .from('clinic_designs')
    .select('id, layout_json, world_color, floor_color')
    .eq('user_id', userId)
    .eq('name', 'default')
    .maybeSingle();

  if (error) {
    console.error('Error fetching design', error);
    return null;
  }
  if (!design) return null;

  return {
    grid: (design.layout_json as Grid) ?? null,
    worldColor: design.world_color ?? undefined,
    floorColor: design.floor_color ?? undefined,
  };
}

export async function saveWorkspace(payload: SaveDesignPayload) {
  const { userId, grid, worldColor, floorColor, inventory } = payload;

  const { data: design, error: upsertError } = await supabase
    .from('clinic_designs')
    .upsert(
      {
        user_id: userId,
        name: 'default',
        layout_json: grid,
        world_color: worldColor,
        floor_color: floorColor,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,name' }
    )
    .select('id')
    .single();

  if (upsertError) throw upsertError;
  if (!design?.id) return;

  // Replace inventory items for this design to keep it in sync with layout state.
  await supabase.from('inventory_items').delete().eq('design_id', design.id);

  if (inventory.length > 0) {
    const records = inventory.map((item) => ({
      design_id: design.id,
      user_id: userId,
      name: item.name,
      brand: item.brand,
      sku: item.sku,
      quantity: item.quantity,
      status: item.status,
      uom: item.uom,
      unit_price: item.unitPrice,
      vendor: item.vendor,
      category: item.category,
      description: item.description,
      location: item.location,
      tile_x: item.tileX,
      tile_y: item.tileY,
    }));

    const { error: insertError } = await supabase.from('inventory_items').insert(records);
    if (insertError) throw insertError;
  }
}
