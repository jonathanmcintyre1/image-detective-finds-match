
import { supabase } from '@/integrations/supabase/client';
import { SearchRecordWithEntities } from '@/integrations/supabase/types';
import { format, startOfDay, subDays } from 'date-fns';

interface DailySearchCount {
  date: string;
  count: number;
}

interface SearchAnalytics {
  totalSearches: number;
  searchesByDay: DailySearchCount[];
  totalUnique: number;
  uploadedImages: number;
  urlImages: number;
}

interface RawAnalyticsData {
  date: string;
  count: number;
}

export const recordSearchAttempt = async (data: {
  imageUrl?: string;
  uploadId?: string;
  searchType: 'url' | 'upload';
  userAgent: string;
  ipHash: string;
  deviceType: string;
}) => {
  try {
    const { error } = await supabase.from('search_records').insert([
      {
        image_url: data.imageUrl || null,
        upload_id: data.uploadId || null,
        search_type: data.searchType,
        user_agent: data.userAgent,
        ip_hash: data.ipHash,
        device_type: data.deviceType,
      },
    ]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error recording search attempt:', error);
    return { success: false, error };
  }
};

export const recordSearchEntities = async (searchId: number, entities: string[]) => {
  try {
    const entitiesToInsert = entities.map((entity) => ({
      search_id: searchId,
      entity_name: entity,
    }));

    const { error } = await supabase
      .from('search_entities')
      .insert(entitiesToInsert);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error recording search entities:', error);
    return { success: false, error };
  }
};

export const getRecentSearches = async (limit: number = 10): Promise<SearchRecordWithEntities[]> => {
  try {
    const { data: searchRecords, error } = await supabase
      .from('search_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!searchRecords) return [];

    const searchesWithEntities: SearchRecordWithEntities[] = [];
    
    for (const record of searchRecords) {
      const { data: entities, error: entitiesError } = await supabase
        .from('search_entities')
        .select('entity_name')
        .eq('search_id', record.id);

      if (entitiesError) throw entitiesError;
      
      searchesWithEntities.push({
        ...record,
        entities: entities?.map(e => e.entity_name) || []
      });
    }

    return searchesWithEntities;
  } catch (error) {
    console.error('Error fetching recent searches:', error);
    return [];
  }
};

export const getSearchAnalytics = async (days: number = 30): Promise<SearchAnalytics> => {
  try {
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
    
    // Get daily counts
    const { data: dailyData, error: dailyError } = await supabase
      .rpc('get_daily_search_counts', { start_date: startDate });
    
    if (dailyError) throw dailyError;
    
    // Get totals
    const { data: totalsData, error: totalsError } = await supabase
      .rpc('get_search_totals', { start_date: startDate });
    
    if (totalsError) throw totalsError;
    
    // Ensure we have data to work with
    const searchesByDay = (dailyData || []).map((item: RawAnalyticsData) => ({
      date: item.date,
      count: item.count
    }));
    
    const totals = totalsData?.[0] || {
      total_searches: 0,
      unique_users: 0,
      uploaded_images: 0,
      url_images: 0
    };
    
    return {
      totalSearches: totals.total_searches || 0,
      searchesByDay: searchesByDay,
      totalUnique: totals.unique_users || 0,
      uploadedImages: totals.uploaded_images || 0,
      urlImages: totals.url_images || 0
    };
  } catch (error) {
    console.error('Error fetching search analytics:', error);
    return {
      totalSearches: 0,
      searchesByDay: [],
      totalUnique: 0,
      uploadedImages: 0,
      urlImages: 0
    };
  }
};
