
import { supabase } from './supabase';
import { InventoryItem, SaleRecord, OrderItem, TeamMember } from '../types';

export const dataService = {
    // Inventory
    async getInventory(): Promise<InventoryItem[]> {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .order('name');

        if (error) throw error;
        return data as InventoryItem[];
    },

    async updateInventoryItem(item: InventoryItem): Promise<InventoryItem> {
        const isNew = !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.id);

        const { data, error } = await supabase
            .from('inventory')
            .upsert({
                id: isNew ? undefined : item.id,
                name: item.name,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                type: item.type,
                price: item.price,
                discount: item.discount,
                image: item.image
            })
            .select()
            .single();

        if (error) throw error;
        return data as InventoryItem;
    },

    async deleteInventoryItem(id: string): Promise<void> {
        const { error } = await supabase
            .from('inventory')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Sales
    async getSales(): Promise<SaleRecord[]> {
        const { data, error } = await supabase
            .from('sales')
            .select(`
        *,
        items:sale_items(*)
      `)
            .order('date', { ascending: false })
            .order('created_at', { foreignTable: 'sale_items', ascending: true })
            .order('id', { foreignTable: 'sale_items', ascending: true });

        if (error) throw error;

        // Map snake_case to camelCase
        return data.map((sale: any) => ({
            id: sale.id,
            customerName: sale.customer_name,
            customerPhone: sale.customer_phone,
            customerBM: sale.customer_bm,
            date: new Date(sale.date).toLocaleString('pt-BR'),
            total: sale.total,
            status: sale.status,
            seller: sale.seller,
            deliveredAt: sale.delivered_at ? new Date(sale.delivered_at).toLocaleString('pt-BR') : undefined,
            paidAt: sale.paid_at ? new Date(sale.paid_at).toLocaleString('pt-BR') : undefined,
            deliveryForecast: sale.delivery_forecast ? new Date(sale.delivery_forecast).toLocaleDateString('pt-BR') : undefined,
            items: sale.items.map((item: any) => ({
                id: item.id,
                inventoryId: item.inventory_id,
                name: item.name,
                size: item.size,
                quantity: item.quantity,
                price: item.price,
                status: item.status,
                totalInstallments: item.total_installments || 1,
                paidInstallments: item.paid_installments || 0,
                deliveredAt: item.delivered_at ? new Date(item.delivered_at).toLocaleString('pt-BR') : undefined,
                paidAt: item.paid_at ? new Date(item.paid_at).toLocaleString('pt-BR') : undefined
            }))
        }));
    },

    async addSale(sale: SaleRecord): Promise<void> {
        // 1. Insert search record
        const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .insert({
                customer_name: sale.customerName,
                customer_phone: sale.customerPhone,
                customer_bm: sale.customerBM,
                total: sale.total,
                status: sale.status,
                seller: sale.seller,
                delivery_forecast: sale.deliveryForecast ? new Date(sale.deliveryForecast.split('/').reverse().join('-')).toISOString() : null,
                delivered_at: sale.status === 'Entregue' ? new Date().toISOString() : null,
                paid_at: sale.status === 'Pago' ? new Date().toISOString() : null
            })
            .select()
            .single();

        if (saleError) throw saleError;

        // 2. Insert sale items with status matching the sale status
        const saleItems = sale.items.map(item => ({
            sale_id: saleData.id,
            inventory_id: item.inventoryId,
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
            status: sale.status, // Initialize item status from sale status
            total_installments: item.totalInstallments || 1,
            paid_installments: item.paidInstallments || 0,
            delivered_at: sale.status === 'Entregue' ? new Date().toISOString() : null,
            paid_at: sale.status === 'Pago' ? new Date().toISOString() : null
        }));

        const { error: itemsError } = await supabase
            .from('sale_items')
            .insert(saleItems);

        if (itemsError) throw itemsError;

        // 3. Update inventory levels (This should ideally be a transaction/RPC)
        for (const item of sale.items) {
            const { data: invItem } = await supabase
                .from('inventory')
                .select('quantity')
                .eq('id', item.inventoryId)
                .single();

            if (invItem) {
                await supabase
                    .from('inventory')
                    .update({ quantity: Math.max(0, invItem.quantity - item.quantity) })
                    .eq('id', item.inventoryId);
            }
        }
    },

    // Team
    async getTeam(): Promise<TeamMember[]> {
        const { data, error } = await supabase
            .from('team')
            .select('*')
            .order('name');

        if (error) throw error;
        return data as TeamMember[];
    },

    async addTeamMember(member: Partial<TeamMember>): Promise<TeamMember> {
        const { data, error } = await supabase
            .from('team')
            .insert(member)
            .select()
            .single();

        if (error) throw error;
        return data as TeamMember;
    },

    async deleteTeamMember(id: string): Promise<void> {
        const { error } = await supabase
            .from('team')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async deleteSale(id: string): Promise<void> {
        const { error } = await supabase
            .from('sales')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
    async updateItemInstallments(itemId: string, paidCount: number): Promise<void> {
        const { error } = await supabase
            .from('sale_items')
            .update({
                paid_installments: paidCount
            })
            .eq('id', itemId);

        if (error) throw error;
    },
    async updateItemStatus(itemId: string, status: string): Promise<void> {
        const updateObj: any = { status };
        if (status === 'Entregue') updateObj.delivered_at = new Date().toISOString();
        if (status === 'Pago') updateObj.paid_at = new Date().toISOString();

        const { error } = await supabase
            .from('sale_items')
            .update(updateObj)
            .eq('id', itemId);

        if (error) throw error;

        // Propagate to sale if all items match the new status or something similar could be done here, 
        // but for now, we follow the current pattern of item-level status updates.
        // Let's also update the sale status if it makes sense.
        // For simplicity and matching current UI flow, we'll just update the item.
    }
};
