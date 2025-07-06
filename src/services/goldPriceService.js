const axios = require('axios');
const cron = require('node-cron');
const logger = require('../utils/logger');

class GoldPriceService {
  constructor() {
    this.currentGoldPrice = 2000; // Default fallback price in USD per ounce
    this.lastUpdateTime = null;
    this.updateInterval = parseInt(process.env.GOLD_PRICE_UPDATE_INTERVAL) || 600000; // 10 minutes default
    this.apiUrl = process.env.GOLD_PRICE_API_URL;
    
    // Start periodic updates
    this.startPeriodicUpdates();
  }

  /**
   * Get current gold price
   * @returns {number} Current gold price in USD per ounce
   */
  getCurrentPrice() {
    return this.currentGoldPrice;
  }

  /**
   * Get last update time
   * @returns {Date|null} Last update timestamp
   */
  getLastUpdateTime() {
    return this.lastUpdateTime;
  }

  /**
   * Fetch gold price from external API
   * @returns {Promise<number>} Gold price in USD per ounce
   */
  async fetchGoldPrice() {
    try {
      // Skip API calls if no API URL is configured
      if (!this.apiUrl) {
        logger.warn('No GOLD_PRICE_API_URL configured, using default price');
        return this.currentGoldPrice;
      }

      logger.info('Fetching gold price from external API');
      
      // Try primary API
      const response = await axios.get(this.apiUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'RENART-Backend/1.0.0'
        }
      });

      let price = null;

      // Handle different API response formats
      if (response.data && response.data.price) {
        price = parseFloat(response.data.price);
      } else if (response.data && response.data.gold) {
        price = parseFloat(response.data.gold);
      } else if (response.data && response.data.rates && response.data.rates.XAU) {
        // Some APIs return in different format
        price = 1 / parseFloat(response.data.rates.XAU); // Convert to USD per ounce
      }

      if (price && price > 0) {
        this.currentGoldPrice = price;
        this.lastUpdateTime = new Date();
        logger.info(`Gold price updated successfully: $${price}/oz`);
        return price;
      } else {
        throw new Error('Invalid price data received from API');
      }

    } catch (error) {
      logger.warn('Failed to fetch gold price:', error.message);
      
      // Try fallback API or use cached price
      try {
        const fallbackPrice = await this.fetchFallbackPrice();
        if (fallbackPrice) {
          this.currentGoldPrice = fallbackPrice;
          this.lastUpdateTime = new Date();
          logger.info(`Gold price updated from fallback: $${fallbackPrice}/oz`);
          return fallbackPrice;
        }
      } catch (fallbackError) {
        logger.warn('Fallback API also failed:', fallbackError.message);
      }

      // Keep using current cached price - this is NOT an error, just a warning
      logger.warn(`Using cached gold price: $${this.currentGoldPrice}/oz`);
      return this.currentGoldPrice;
    }
  }

  /**
   * Fetch from fallback API
   * @returns {Promise<number>} Gold price from fallback source
   */
  async fetchFallbackPrice() {
    // Skip fallback APIs in production if no API keys configured
    if (process.env.NODE_ENV === 'production' && !process.env.FIXER_API_KEY) {
      logger.warn('No fallback API keys configured for production');
      throw new Error('No fallback API keys configured');
    }

    // You can add alternative gold price APIs here
    // For example: fixer.io, exchangerate-api.com, etc.
    
    const fallbackApis = [
      // Only use these if properly configured
      ...(process.env.FIXER_API_KEY ? [`https://api.fixer.io/latest?access_key=${process.env.FIXER_API_KEY}&base=USD&symbols=XAU`] : []),
      ...(process.env.EXCHANGE_API_KEY ? [`https://api.exchangerate-api.com/v4/latest/USD?access_key=${process.env.EXCHANGE_API_KEY}`] : [])
    ];

    if (fallbackApis.length === 0) {
      throw new Error('No fallback APIs configured');
    }

    for (const api of fallbackApis) {
      try {
        const response = await axios.get(api, { timeout: 5000 });
        // Handle response based on API format
        if (response.data && response.data.rates && response.data.rates.XAU) {
          return 1 / parseFloat(response.data.rates.XAU);
        }
      } catch (error) {
        logger.warn(`Fallback API failed: ${api}`);
        continue;
      }
    }

    throw new Error('All fallback APIs failed');
  }

  /**
   * Start periodic gold price updates
   */
  startPeriodicUpdates() {
    // Only start cron jobs in production or if explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_GOLD_PRICE_UPDATES === 'true') {
      // Update every 10 minutes
      cron.schedule('*/10 * * * *', async () => {
        try {
          await this.fetchGoldPrice();
        } catch (error) {
          logger.warn('Scheduled gold price update failed:', error.message);
        }
      });

      logger.info('Gold price periodic updates enabled');
    } else {
      logger.info('Gold price periodic updates disabled (development mode)');
    }

    // Initial fetch (but don't fail if it doesn't work)
    this.fetchGoldPrice().catch(error => {
      logger.warn('Initial gold price fetch failed:', error.message);
    });
  }

  /**
   * Calculate dynamic price for a product
   * @param {number} popularityScore - Product popularity score
   * @param {number} weight - Product weight in grams
   * @returns {number} Calculated price in USD
   */
  calculateProductPrice(popularityScore, weight) {
    const goldPricePerGram = this.currentGoldPrice / 31.1035; // Convert oz to grams
    const price = (popularityScore + 1) * weight * goldPricePerGram;
    return Math.round(price * 100) / 100; // Round to 2 decimal places
  }
}

// Export singleton instance
module.exports = new GoldPriceService();
