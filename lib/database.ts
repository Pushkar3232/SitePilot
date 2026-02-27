// lib/database.ts
import { supabaseServer } from './supabase';
import type { Tenant, User, Website, Page, Component } from './supabase';

// Generic database operations
export class DatabaseService {
  static async findById<T>(table: string, id: string): Promise<T | null> {
    const { data, error } = await supabaseServer
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error finding ${table} by id:`, error);
      return null;
    }

    return data as T;
  }

  static async findByField<T>(
    table: string,
    field: string,
    value: any
  ): Promise<T[]> {
    const { data, error } = await supabaseServer
      .from(table)
      .select('*')
      .eq(field, value);

    if (error) {
      console.error(`Error finding ${table} by ${field}:`, error);
      return [];
    }

    return data as T[];
  }

  static async create<T>(table: string, data: Partial<T>): Promise<T | null> {
    const { data: result, error } = await supabaseServer
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error(`Error creating ${table}:`, error);
      return null;
    }

    return result as T;
  }

  static async update<T>(
    table: string,
    id: string,
    updates: Partial<T>
  ): Promise<T | null> {
    const { data, error } = await supabaseServer
      .from(table)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating ${table}:`, error);
      return null;
    }

    return data as T;
  }

  static async delete(table: string, id: string): Promise<boolean> {
    const { error } = await supabaseServer
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting from ${table}:`, error);
      return false;
    }

    return true;
  }
}

// Specific database operations
export class TenantService extends DatabaseService {
  static async findBySlug(slug: string): Promise<Tenant | null> {
    const tenants = await this.findByField<Tenant>('tenants', 'slug', slug);
    return tenants[0] || null;
  }

  static async findWithPlan(tenantId: string): Promise<(Tenant & { plan: any }) | null> {
    const { data, error } = await supabaseServer
      .from('tenants')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('id', tenantId)
      .single();

    if (error) {
      console.error('Error finding tenant with plan:', error);
      return null;
    }

    return data;
  }
}

export class UserService extends DatabaseService {
  static async findByFirebaseId(firebaseId: string): Promise<User | null> {
    const users = await this.findByField<User>('users', 'firebase_id', firebaseId);
    return users[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const users = await this.findByField<User>('users', 'email', email);
    return users[0] || null;
  }
}

export class WebsiteService extends DatabaseService {
  static async findByTenant(tenantId: string): Promise<Website[]> {
    return this.findByField<Website>('websites', 'tenant_id', tenantId);
  }

  static async findBySlug(slug: string): Promise<Website | null> {
    const websites = await this.findByField<Website>('websites', 'slug', slug);
    return websites[0] || null;
  }

  static async findWithPages(websiteId: string): Promise<(Website & { pages: Page[] }) | null> {
    const { data, error } = await supabaseServer
      .from('websites')
      .select(`
        *,
        pages(*)
      `)
      .eq('id', websiteId)
      .single();

    if (error) {
      console.error('Error finding website with pages:', error);
      return null;
    }

    return data;
  }
}

export class PageService extends DatabaseService {
  static async findByWebsite(websiteId: string): Promise<Page[]> {
    return this.findByField<Page>('pages', 'website_id', websiteId);
  }

  static async findBySlug(websiteId: string, slug: string): Promise<Page | null> {
    const { data, error } = await supabaseServer
      .from('pages')
      .select('*')
      .eq('website_id', websiteId)
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error finding page by slug:', error);
      return null;
    }

    return data;
  }

  static async findWithComponents(pageId: string): Promise<(Page & { components: Component[] }) | null> {
    const { data, error } = await supabaseServer
      .from('pages')
      .select(`
        *,
        components(*)
      `)
      .eq('id', pageId)
      .single();

    if (error) {
      console.error('Error finding page with components:', error);
      return null;
    }

    return data;
  }
}

export class ComponentService extends DatabaseService {
  static async findByPage(pageId: string): Promise<Component[]> {
    const { data, error } = await supabaseServer
      .from('components')
      .select('*')
      .eq('page_id', pageId)
      .order('order_key', { ascending: true });

    if (error) {
      console.error('Error finding components by page:', error);
      return [];
    }

    return data;
  }

  static async reorderComponents(
    pageId: string,
    componentOrders: { id: string; order_key: string }[]
  ): Promise<boolean> {
    try {
      for (const { id, order_key } of componentOrders) {
        await this.update<Component>('components', id, { order_key });
      }
      return true;
    } catch (error) {
      console.error('Error reordering components:', error);
      return false;
    }
  }
}