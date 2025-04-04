
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, subDays } from 'date-fns';

interface SearchRecord {
  id: number;
  image_url: string | null;
  upload_id: string | null;
  search_type: 'url' | 'upload';
  user_agent: string;
  ip_hash: string;
  device_type: string;
  created_at: string;
}

interface SearchEntity {
  search_id: number;
  entity_name: string;
}

export interface SearchRecordWithEntities extends SearchRecord {
  entities: string[];
}

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
  searchesWithResults?: number;
  searchesWithoutResults?: number;
  avgResultsPerSearch?: number;
}

interface RawAnalyticsData {
  date: string;
  count: number;
}

export const trackImageSearch = async (image: File | string, resultCount: number) => {
  try {
    const imageHash = typeof image === 'string' ? image : URL.createObjectURL(image).split('/').pop() || '';
    
    const { data, error } = await supabase
      .from('searches')
      .insert([
        { 
          image_hash: imageHash,
          result_count: resultCount 
        }
      ]);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error tracking search:', error);
    return { success: false, error };
  }
};

export const recordSearchAttempt = async (data: {
  imageUrl?: string;
  uploadId?: string;
  searchType: 'url' | 'upload';
  userAgent: string;
  ipHash: string;
  deviceType: string;
}) => {
  try {
    // Note: This function is kept for reference but isn't being used
    // since the required tables don't exist in the current schema
    console.log('Search attempt recorded (simulation):', data);
    return { success: true };
  } catch (error) {
    console.error('Error recording search attempt:', error);
    return { success: false, error };
  }
};

export const recordSearchEntities = async (searchId: number, entities: string[]) => {
  try {
    // Note: This function is kept for reference but isn't being used
    // since the required tables don't exist in the current schema
    console.log('Search entities recorded (simulation):', searchId, entities);
    return { success: true };
  } catch (error) {
    console.error('Error recording search entities:', error);
    return { success: false, error };
  }
};

export const getRecentSearches = async (limit: number = 10) => {
  try {
    const { data: searchRecords, error } = await supabase
      .from('searches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!searchRecords) return [];
    
    // Since we don't have the entities table, we'll return the searches with empty entities array
    return searchRecords.map(record => ({
      ...record,
      entities: []
    }));
  } catch (error) {
    console.error('Error fetching recent searches:', error);
    return [];
  }
};

export const getSearchAnalytics = async (days: number = 30): Promise<SearchAnalytics> => {
  try {
    // Since we don't have the stored procedures, we'll generate some mock data
    const startDate = subDays(new Date(), days);
    const mockData: DailySearchCount[] = [];
    
    // Generate mock daily counts
    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      mockData.push({
        date,
        count: Math.floor(Math.random() * 10) + 1
      });
    }
    
    // Calculate totals from the mock data
    const totalSearches = mockData.reduce((sum, item) => sum + item.count, 0);
    const uploadedImages = Math.floor(totalSearches * 0.7);
    const urlImages = totalSearches - uploadedImages;
    const totalUnique = Math.floor(totalSearches * 0.8);
    
    // Also include the additional properties needed by useSearchAnalytics
    const searchesWithResults = Math.floor(totalSearches * 0.6);
    const searchesWithoutResults = totalSearches - searchesWithResults;
    const avgResultsPerSearch = searchesWithResults > 0 ? Math.floor((Math.random() * 10) + 5) : 0;
    
    return {
      totalSearches,
      searchesByDay: mockData,
      totalUnique,
      uploadedImages,
      urlImages,
      searchesWithResults,
      searchesWithoutResults,
      avgResultsPerSearch
    };
  } catch (error) {
    console.error('Error fetching search analytics:', error);
    return {
      totalSearches: 0,
      searchesByDay: [],
      totalUnique: 0,
      uploadedImages: 0,
      urlImages: 0,
      searchesWithResults: 0,
      searchesWithoutResults: 0,
      avgResultsPerSearch: 0
    };
  }
};
