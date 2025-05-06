
export interface WebEntity {
  entityId: string;
  score: number;
  description: string;
}

export interface WebImage {
  url: string;
  score: number;
  imageUrl?: string;
  platform?: string;
  dateFound?: Date;
  pageUrl?: string;
  pageTitle?: string;
}

export interface WebPage {
  url: string;
  score: number;
  pageTitle: string;
  platform?: string;
  pageType?: 'product' | 'category' | 'search' | 'unknown';
  matchingImages?: WebImage[];
  dateFound?: Date;
  isSpam?: boolean;
}

export interface MatchResult {
  webEntities: WebEntity[];
  visuallySimilarImages: WebImage[];
  pagesWithMatchingImages: WebPage[];
}

export interface FilteredData {
  exactMatches: WebImage[];
  partialMatches: WebImage[];
  similarMatches: WebImage[];
  productPages: WebPage[];
  categoryPages: WebPage[];
  searchPages: WebPage[];
  otherPages: WebPage[];
  allPages: WebPage[];
}

export interface DashboardData {
  totalMatches: number;
  exactMatches: WebImage[];
  partialMatches: WebImage[];
  similarMatches: WebImage[];
  domainsCount: number;
  marketplacesCount: number;
  socialMediaCount: number;
  ecommerceCount: number;
  highestConfidence: number;
  topDomains: { domain: string; count: number; type: string }[];
}
