class SubscriptionService {
  constructor(subscriptionRepository) {
    this.repository = subscriptionRepository;
  }

  async getUserSubscriptions(userId) {
    return await this.repository.findByUserId(userId);
  }

  async getSubscription(subscriptionId, userId) {
    const subscription = await this.repository.findById(subscriptionId, userId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    return subscription;
  }

  async createSubscription(userId, subscriptionData) {
    const renewalDate = this.calculateRenewalDate(
      subscriptionData.start_date,
      subscriptionData.frequency,
      subscriptionData.custom_frequency_days
    );

    const newSubscription = {
      user_id: userId,
      name: subscriptionData.name,
      cost: subscriptionData.cost,
      frequency: subscriptionData.frequency,
      start_date: subscriptionData.start_date,
      renewal_date: renewalDate,
      status: subscriptionData.status || 'Active',
      logo: subscriptionData.logo || subscriptionData.name.charAt(0).toUpperCase(),
      card_issuer: subscriptionData.card_issuer || null
    };

    if (subscriptionData.custom_frequency_days) {
      newSubscription.custom_frequency_days = parseInt(subscriptionData.custom_frequency_days);
    }

    return await this.repository.create(newSubscription);
  }

  async updateSubscription(subscriptionId, userId, updates) {
    if (updates.start_date || updates.frequency || updates.custom_frequency_days) {
      const subscription = await this.getSubscription(subscriptionId, userId);
      const startDate = updates.start_date || subscription.start_date;
      const frequency = updates.frequency || subscription.frequency;
      const customDays = updates.custom_frequency_days || subscription.custom_frequency_days;
      updates.renewal_date = this.calculateRenewalDate(startDate, frequency, customDays);
    }

    return await this.repository.update(subscriptionId, userId, updates);
  }

  async deleteSubscription(subscriptionId, userId) {
    await this.repository.delete(subscriptionId, userId);
  }

  async getDashboardStats(userId) {
    const subscriptions = await this.repository.findByUserId(userId);

    const calculateStatus = (renewalDate) => {
      const today = new Date();
      const renewal = new Date(renewalDate);
      const daysUntilRenewal = Math.ceil((renewal - today) / (1000 * 60 * 60 * 24));

      if (daysUntilRenewal <= 7 && daysUntilRenewal >= 0) {
        return 'Expiring Soon';
      }
      return 'Active';
    };

    const subscriptionsWithStatus = subscriptions.map(sub => ({
      ...sub,
      status: calculateStatus(sub.renewal_date)
    }));

    const activeSubscriptions = subscriptionsWithStatus.filter(sub => sub.status === 'Active');

    const getDaysInFrequency = (frequency, customDays) => {
      switch (frequency) {
        case 'Weekly': return 7;
        case 'Bi-Weekly': return 14;
        case 'Monthly': return 30;
        case 'Quarterly': return 90;
        case 'Bi-Annual': return 182;
        case 'Annual': return 365;
        case 'Custom': return customDays || 30;
        default: return 30;
      }
    };

    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const totalMonthlyCost = subscriptionsWithStatus.reduce((sum, sub) => {
      const cost = parseFloat(sub.cost);
      const startDate = sub.start_date ? new Date(sub.start_date) : new Date();
      const frequencyDays = getDaysInFrequency(sub.frequency, sub.custom_frequency_days);

      let renewalCount = 0;
      let currentRenewalDate = new Date(startDate);

      if (startDate <= currentMonthEnd) {
        while (currentRenewalDate <= currentMonthEnd) {
          if (currentRenewalDate >= currentMonthStart && currentRenewalDate <= currentMonthEnd) {
            renewalCount++;
          }
          currentRenewalDate = new Date(currentRenewalDate);
          currentRenewalDate.setDate(currentRenewalDate.getDate() + frequencyDays);
        }
      }

      return sum + (renewalCount * cost);
    }, 0);

    const upcomingRenewals = subscriptionsWithStatus
      .filter(sub => new Date(sub.renewal_date) >= today)
      .sort((a, b) => new Date(a.renewal_date) - new Date(b.renewal_date));

    const nextRenewal = upcomingRenewals[0];

    return {
      totalMonthlyCost: totalMonthlyCost.toFixed(2),
      activeSubscriptions: activeSubscriptions.length,
      nextRenewal: nextRenewal ? {
        date: nextRenewal.renewal_date,
        name: nextRenewal.name
      } : null
    };
  }

  async getSubscriptionHistory(userId) {
    const subscriptions = await this.repository.findByUserId(userId);

    if (subscriptions.length === 0) {
      return [];
    }

    // Find the earliest start date to determine how far back to generate data
    let earliestStartDate = new Date();
    subscriptions.forEach(sub => {
      if (sub.start_date) {
        const startDate = new Date(sub.start_date);
        if (startDate < earliestStartDate) {
          earliestStartDate = startDate;
        }
      }
    });

    // Calculate monthly costs based on start dates
    const monthlyCosts = {};
    const today = new Date();

    // Generate all months from earliest start date to now
    const startMonth = new Date(earliestStartDate.getFullYear(), earliestStartDate.getMonth(), 1);
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    let currentDate = new Date(startMonth);
    while (currentDate <= currentMonth) {
      const monthKey = currentDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyCosts[monthKey] = 0;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Helper function to advance renewal date by frequency
    const advanceRenewalDate = (date, frequency, customDays) => {
      const newDate = new Date(date);
      switch (frequency) {
        case 'Weekly':
          newDate.setDate(newDate.getDate() + 7);
          break;
        case 'Bi-Weekly':
          newDate.setDate(newDate.getDate() + 14);
          break;
        case 'Monthly':
          newDate.setMonth(newDate.getMonth() + 1);
          break;
        case 'Quarterly':
          newDate.setMonth(newDate.getMonth() + 3);
          break;
        case 'Bi-Annual':
          newDate.setMonth(newDate.getMonth() + 6);
          break;
        case 'Annual':
          newDate.setFullYear(newDate.getFullYear() + 1);
          break;
        case 'Custom':
          newDate.setDate(newDate.getDate() + (customDays || 30));
          break;
        default:
          newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    };

    // Calculate costs for each subscription
    subscriptions.forEach(sub => {
      const startDate = sub.start_date ? new Date(sub.start_date) : new Date();
      const cost = parseFloat(sub.cost);

      // For each month, count how many renewals occur
      Object.keys(monthlyCosts).forEach(monthKey => {
        const [monthStr, yearStr] = monthKey.split(' ');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = monthNames.indexOf(monthStr);
        const year = 2000 + parseInt(yearStr);

        // Get first and last day of the month
        const monthStart = new Date(year, monthIndex, 1);
        const monthEnd = new Date(year, monthIndex + 1, 0); // Last day of month

        // Only process if subscription started before month end
        if (startDate <= monthEnd) {
          let renewalCount = 0;
          let currentRenewalDate = new Date(startDate);

          // Count renewals that fall within this month
          while (currentRenewalDate <= monthEnd) {
            if (currentRenewalDate >= monthStart && currentRenewalDate <= monthEnd) {
              renewalCount++;
            }
            // Move to next renewal date
            currentRenewalDate = advanceRenewalDate(currentRenewalDate, sub.frequency, sub.custom_frequency_days);
          }

          // Add the cost for this month (renewalCount * cost)
          monthlyCosts[monthKey] += renewalCount * cost;
        }
      });
    });

    // Transform to chart format
    const chartData = Object.entries(monthlyCosts).map(([name, cost]) => ({
      name,
      cost: parseFloat(cost.toFixed(2))
    }));

    return chartData;
  }

  calculateRenewalDate(startDate, frequency, customFrequencyDays = null) {
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    let renewal = new Date(start);

    // Keep advancing the renewal date until it's in the future or equal to today
    while (renewal < today) {
      switch (frequency) {
        case 'Weekly':
          renewal.setUTCDate(renewal.getUTCDate() + 7);
          break;
        case 'Bi-Weekly':
          renewal.setUTCDate(renewal.getUTCDate() + 14);
          break;
        case 'Monthly':
          renewal.setUTCMonth(renewal.getUTCMonth() + 1);
          break;
        case 'Quarterly':
          renewal.setUTCMonth(renewal.getUTCMonth() + 3);
          break;
        case 'Bi-Annual':
          renewal.setUTCMonth(renewal.getUTCMonth() + 6);
          break;
        case 'Annual':
          renewal.setUTCFullYear(renewal.getUTCFullYear() + 1);
          break;
        case 'Custom':
          if (customFrequencyDays) {
            renewal.setUTCDate(renewal.getUTCDate() + parseInt(customFrequencyDays));
          } else {
            // If no custom days specified, default to monthly and exit loop
            renewal.setUTCMonth(renewal.getUTCMonth() + 1);
          }
          break;
        default:
          renewal.setUTCMonth(renewal.getUTCMonth() + 1);
      }
    }

    return renewal.toISOString().split('T')[0];
  }

  convertToMonthlyCost(cost, frequency, customDays = null) {
    const monthlyCost = parseFloat(cost);
    switch (frequency) {
      case 'Weekly':
        return monthlyCost * 4.33;
      case 'Bi-Weekly':
        return monthlyCost * 2.17;
      case 'Monthly':
        return monthlyCost;
      case 'Quarterly':
        return monthlyCost / 3;
      case 'Bi-Annual':
        return monthlyCost / 6;
      case 'Annual':
        return monthlyCost / 12;
      case 'Custom':
        if (customDays) {
          const daysPerMonth = 30.44;
          return monthlyCost * (daysPerMonth / parseInt(customDays));
        }
        return monthlyCost;
      default:
        return monthlyCost;
    }
  }

  getUpcomingRenewals(subscriptions, daysAhead = 30) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    return subscriptions
      .filter(sub => {
        const renewalDate = new Date(sub.renewal_date);
        return renewalDate >= today && renewalDate <= futureDate;
      })
      .sort((a, b) => new Date(a.renewal_date) - new Date(b.renewal_date));
  }
}

module.exports = SubscriptionService;
