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

    return subscriptions.map(sub => ({
      date: sub.start_date,
      cost: this.convertToMonthlyCost(sub.cost, sub.billing_cycle),
      name: sub.name
    }));
  }

  calculateRenewalDate(startDate, frequency, customFrequencyDays = null) {
    const start = new Date(startDate);
    const renewal = new Date(start);

    switch (frequency) {
      case 'Weekly':
        renewal.setUTCDate(start.getUTCDate() + 7);
        break;
      case 'Bi-Weekly':
        renewal.setUTCDate(start.getUTCDate() + 14);
        break;
      case 'Monthly':
        renewal.setUTCMonth(start.getUTCMonth() + 1);
        break;
      case 'Quarterly':
        renewal.setUTCMonth(start.getUTCMonth() + 3);
        break;
      case 'Bi-Annual':
        renewal.setUTCMonth(start.getUTCMonth() + 6);
        break;
      case 'Annual':
        renewal.setUTCFullYear(start.getUTCFullYear() + 1);
        break;
      case 'Custom':
        if (customFrequencyDays) {
          renewal.setUTCDate(start.getUTCDate() + parseInt(customFrequencyDays) + 1);
        }
        break;
      default:
        renewal.setUTCMonth(start.getUTCMonth() + 1);
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
