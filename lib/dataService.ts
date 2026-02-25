
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
            .order('date', { ascending: false });

        if (error) throw error;

        // Map snake_case to camelCase
        return data.map((sale: any) => ({
            id: sale.id,
            customerName: sale.customer_name,
            customerPhone: sale.customer_phone,
            date: new Date(sale.date).toLocaleString('pt-BR'),
            total: sale.total,
            status: sale.status,
            seller: sale.seller,
            items: sale.items.map((item: any) => ({
                id: item.id,
                inventoryId: item.inventory_id,
                name: item.name,
                size: item.size,
                quantity: item.quantity,
                price: item.price
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
                total: sale.total,
                status: sale.status,
                seller: sale.seller
            })
            .select()
            .single();

        if (saleError) throw saleError;

        // 2. Insert sale items
        const saleItems = sale.items.map(item => ({
            sale_id: saleData.id,
            inventory_id: item.inventoryId,
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.price
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
    }
};
