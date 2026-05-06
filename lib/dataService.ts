
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
                gender: item.gender || 'Unissex',
                quantity: item.quantity,
                type: item.type,
                price: item.price,
                discount: item.discount,
                image: item.image
            }, { onConflict: 'name,size,color,gender' })
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

    async deleteInventoryItems(ids: string[]): Promise<void> {
        const { error } = await supabase
            .from('inventory')
            .delete()
            .in('id', ids);

        if (error) throw error;
    },

    // Sales
    async getSales(): Promise<SaleRecord[]> {
        const { data, error } = await supabase
            .from('sales')
            .select(`
                *,
                items:sale_items(
                    *,
                    installment_payments(*)
                )
            `)
            .order('created_at', { ascending: false });

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
                paidAt: item.paid_at ? new Date(item.paid_at).toLocaleString('pt-BR') : undefined,
                lastPaymentAt: item.last_payment_at ? new Date(item.last_payment_at).toLocaleString('pt-BR') : undefined,
                source: item.source || 'Loja',
                installmentHistory: (item.installment_payments || [])
                    .sort((a: any, b: any) => a.installment_number - b.installment_number)
                    .map((p: any) => ({
                        installmentNumber: p.installment_number,
                        paidAt: new Date(p.paid_at).toLocaleString('pt-BR')
                    }))
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
                delivered_at: sale.status === 'Entregue' ? new Date().toISOString() : null,
                paid_at: sale.status === 'Pago' ? new Date().toISOString() : null
            })
            .select()
            .single();

        if (saleError) throw saleError;

        // 2. Insert sale items with status matching the sale status
        const saleItems = sale.items.map(item => {
            // Validate UUID for inventory_id
            const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.inventoryId);
            
            return {
                sale_id: saleData.id,
                inventory_id: isValidUUID ? item.inventoryId : null,
                name: item.name,
                size: item.size,
                quantity: item.quantity,
                price: item.price,
                status: sale.status, // Initialize item status from sale status
                total_installments: item.totalInstallments || 1,
                paid_installments: item.paidInstallments || 0,
                source: item.source || 'Loja',
                delivered_at: sale.status === 'Entregue' ? new Date().toISOString() : null,
                paid_at: sale.status === 'Pago' ? new Date().toISOString() : null
            };
        });

        const { error: itemsError } = await supabase
            .from('sale_items')
            .insert(saleItems);

        if (itemsError) {
            // Rollback sale insertion to prevent orphan sales without items
            await supabase.from('sales').delete().eq('id', saleData.id);
            throw itemsError;
        }

        // 3. Update inventory levels only for "Estoque" source
        for (const item of sale.items) {
            if (item.source !== 'Estoque') continue;

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

    async addItemToSale(saleId: string, item: OrderItem, currentSaleTotal: number): Promise<void> {
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.inventoryId);
        
        const saleItem = {
            sale_id: saleId,
            inventory_id: isValidUUID ? item.inventoryId : null,
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
            status: item.status, 
            total_installments: item.totalInstallments || 1,
            paid_installments: item.paidInstallments || 0,
            source: item.source || 'Loja',
            delivered_at: item.status === 'Entregue' ? new Date().toISOString() : null,
            paid_at: item.status === 'Pago' ? new Date().toISOString() : null
        };

        const { error: itemsError } = await supabase
            .from('sale_items')
            .insert(saleItem);

        if (itemsError) throw itemsError;

        // Update sale total
        const newTotal = currentSaleTotal + (item.price * item.quantity);
        await supabase
            .from('sales')
            .update({ total: newTotal })
            .eq('id', saleId);

        // Update inventory levels only for "Estoque" source
        if (item.source === 'Estoque' && isValidUUID) {
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

    async removeItemFromSale(saleId: string, itemId: string): Promise<void> {
        // 1. Get the item to know its price, quantity and source
        const { data: item, error: fetchError } = await supabase
            .from('sale_items')
            .select('*')
            .eq('id', itemId)
            .single();

        if (fetchError) throw fetchError;

        // 2. Restore inventory if it was from Estoque
        if (item.source === 'Estoque' && item.inventory_id) {
            const { data: inv } = await supabase
                .from('inventory')
                .select('quantity')
                .eq('id', item.inventory_id)
                .single();

            if (inv) {
                await supabase
                    .from('inventory')
                    .update({ quantity: inv.quantity + item.quantity })
                    .eq('id', item.inventory_id);
            }
        }

        // 3. Delete the item
        const { error: deleteError } = await supabase
            .from('sale_items')
            .delete()
            .eq('id', itemId);

        if (deleteError) throw deleteError;

        // 4. Update the sale total
        const { data: sale } = await supabase
            .from('sales')
            .select('total')
            .eq('id', saleId)
            .single();

        if (sale) {
            const itemTotal = item.price * item.quantity;
            const newTotal = Math.max(0, sale.total - itemTotal);
            await supabase
                .from('sales')
                .update({ total: newTotal })
                .eq('id', saleId);
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

    async updateSaleInfo(saleId: string, updates: { customerName?: string; customerPhone?: string; customerBM?: string; seller?: string }): Promise<void> {
        const payload: any = {};
        if (updates.customerName !== undefined) payload.customer_name = updates.customerName;
        if (updates.customerPhone !== undefined) payload.customer_phone = updates.customerPhone;
        if (updates.customerBM !== undefined) payload.customer_bm = updates.customerBM;
        if (updates.seller !== undefined) payload.seller = updates.seller;

        if (Object.keys(payload).length > 0) {
            const { error } = await supabase
                .from('sales')
                .update(payload)
                .eq('id', saleId);
            if (error) throw error;
        }
    },

    async deleteSale(id: string): Promise<void> {
        // 1. Get sale items to restore inventory
        const { data: items, error: fetchError } = await supabase
            .from('sale_items')
            .select('inventory_id, quantity, source')
            .eq('sale_id', id);

        if (!fetchError && items) {
            for (const item of items) {
                if (item.source === 'Estoque' && item.inventory_id) {
                    // Get current stock
                    const { data: inv } = await supabase
                        .from('inventory')
                        .select('quantity')
                        .eq('id', item.inventory_id)
                        .single();

                    if (inv) {
                        // Restore quantity
                        await supabase
                            .from('inventory')
                            .update({ quantity: inv.quantity + item.quantity })
                            .eq('id', item.inventory_id);
                    }
                }
            }
        }

        // 2. Delete the sale (cascades to sale_items)
        const { error } = await supabase
            .from('sales')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
    async updateItemInstallments(itemId: string, paidCount: number): Promise<void> {
        // 1. Get current item to know if we are incrementing or decrementing
        const { data: currentItem, error: fetchError } = await supabase
            .from('sale_items')
            .select('paid_installments')
            .eq('id', itemId)
            .single();

        if (fetchError) throw fetchError;

        const oldPaidCount = currentItem.paid_installments || 0;

        // 2. Update the count and last payment date
        const { error: updateError } = await supabase
            .from('sale_items')
            .update({
                paid_installments: paidCount,
                last_payment_at: new Date().toISOString()
            })
            .eq('id', itemId);

        if (updateError) throw updateError;

        // 3. Handle installment records
        if (paidCount > oldPaidCount) {
            // Record new payments
            const newPayments = [];
            for (let i = oldPaidCount + 1; i <= paidCount; i++) {
                newPayments.push({
                    sale_item_id: itemId,
                    installment_number: i,
                    paid_at: new Date().toISOString()
                });
            }
            await supabase.from('installment_payments').insert(newPayments);
        } else if (paidCount < oldPaidCount) {
            // Remove payments that were "undone"
            await supabase
                .from('installment_payments')
                .delete()
                .eq('sale_item_id', itemId)
                .gt('installment_number', paidCount);
        }
    },
    async updateItemStatus(itemId: string, status: string): Promise<void> {
        const updateObj: any = { status };
        const now = new Date().toISOString();
        if (status === 'Entregue') updateObj.delivered_at = now;
        if (status === 'Pago') updateObj.paid_at = now;

        // 1. Update the item
        const { data: itemData, error: itemError } = await supabase
            .from('sale_items')
            .update(updateObj)
            .eq('id', itemId)
            .select('sale_id')
            .single();

        if (itemError) throw itemError;

        // 2. Update the parent sale record for visibility in reports
        // We update the sale's status and dates if reasonable.
        const saleUpdate: any = {};
        if (status === 'Entregue') {
            saleUpdate.status = 'Entregue';
            saleUpdate.delivered_at = now;
        } else if (status === 'Pago') {
            // Only mark sale as Pago if status is Pago
            saleUpdate.status = 'Pago';
            saleUpdate.paid_at = now;
        } else {
            saleUpdate.status = status;
        }

        await supabase
            .from('sales')
            .update(saleUpdate)
            .eq('id', itemData.sale_id);
    }
};
