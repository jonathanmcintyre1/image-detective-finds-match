
import { WebImage, WebPage } from '@/types/results';
import { getHostname, categorizeWebsite } from '@/utils/domainUtils';

/**
 * Determines if a URL is likely spam based on common patterns
 */
export const isLikelySpam = (url: string, pageTitle: string): boolean => {
  const spamPatterns = [
    /\.(ru|cn)\/(?![\w-]+\/)$/,
    /bit\.ly/,
    /goo\.gl/,
    /tinyurl/,
    /(\d{1,3}\.){3}\d{1,3}/,
    /porn|xxx|sex|adult|dating|casino|bet|loan|pharma|рф|бг/,
    /\.(jsp|php|aspx)\?id=\d+$/,
    /forum|topic|thread|blog.*\?p=\d+$/,
  ];
  
  const isSpamUrl = spamPatterns.some(pattern => pattern.test(url.toLowerCase()));
  
  const isSpamTitle = !pageTitle || 
                      pageTitle.length < 3 || 
                      /^\d+$/.test(pageTitle) ||
                      /sex|porn|xxx|hot|dating|viagra|casino/.test(pageTitle.toLowerCase());
  
  return isSpamUrl || isSpamTitle;
};
