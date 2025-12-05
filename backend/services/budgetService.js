class BudgetService {
  constructor(subscriptionService, userRepository) {
    this.subscriptionService = subscriptionService;
    this.userRepository = userRepository;
  }

  async checkBudgetLimit(userId, newSubscriptionData, accessToken = null) {
    console.log('=== BUDGET CHECK START ===');
    console.log('userId:', userId);
    console.log('newSubscriptionData:', newSubscriptionData);
    console.log('accessToken provided:', !!accessToken);

    const user = await this.userRepository.findById(userId);

    if (!user || !user.monthly_budget) {
      console.log('No budget limit set');
      return {
        exceedsLimit: false,
        message: 'No budget limit set'
      };
    }

    const budgetLimit = parseFloat(user.monthly_budget);
    console.log('Budget limit:', budgetLimit);

    const subscriptions = await this.subscriptionService.getUserSubscriptions(userId, accessToken);
    console.log('Active subscriptions count:', subscriptions.filter(sub => sub.status === 'Active').length);

    const currentTotal = subscriptions
      .filter(sub => sub.status === 'Active')
      .reduce((sum, sub) => {
        const monthlyCost = this.subscriptionService.convertToMonthlyCost(sub.cost, sub.frequency, sub.custom_frequency_days);
        console.log(`Subscription: ${sub.name}, cost: ${sub.cost}, frequency: ${sub.frequency}, monthly cost: ${monthlyCost}`);
        return sum + monthlyCost;
      }, 0);

    console.log('Current total monthly cost:', currentTotal);

    const newMonthlyCost = this.subscriptionService.convertToMonthlyCost(
      newSubscriptionData.cost,
      newSubscriptionData.billing_cycle,
      newSubscriptionData.custom_frequency_days
    );

    console.log('New subscription monthly cost:', newMonthlyCost);
    console.log('New subscription billing_cycle:', newSubscriptionData.billing_cycle);

    const newTotal = currentTotal + newMonthlyCost;
    console.log('New total would be:', newTotal);
    console.log('Budget limit is:', budgetLimit);
    console.log('Exceeds budget?', newTotal > budgetLimit);
    console.log('=== BUDGET CHECK END ===');

    if (newTotal > budgetLimit) {
      return {
        exceedsLimit: true,
        message: `Adding this subscription will exceed your budget limit of $${budgetLimit.toFixed(2)}/month`,
        currentTotal: currentTotal.toFixed(2),
        newTotal: newTotal.toFixed(2),
        budgetLimit: budgetLimit.toFixed(2)
      };
    }

    return {
      exceedsLimit: false,
      currentTotal: currentTotal.toFixed(2),
      newTotal: newTotal.toFixed(2),
      budgetLimit: budgetLimit.toFixed(2)
    };
  }

  async updateBudgetLimit(userId, newLimit) {
    return await this.userRepository.update(userId, { monthly_budget: newLimit });
  }

  async getBudgetStatus(userId) {
    const user = await this.userRepository.findById(userId);
    const subscriptions = await this.subscriptionService.getUserSubscriptions(userId);

    const currentTotal = subscriptions
      .filter(sub => sub.status === 'Active')
      .reduce((sum, sub) => {
        const monthlyCost = this.subscriptionService.convertToMonthlyCost(sub.cost, sub.frequency, sub.custom_frequency_days);
        return sum + monthlyCost;
      }, 0);

    const budgetLimit = user?.monthly_budget ? parseFloat(user.monthly_budget) : null;

    return {
      currentTotal: currentTotal.toFixed(2),
      budgetLimit: budgetLimit ? budgetLimit.toFixed(2) : null,
      remaining: budgetLimit ? (budgetLimit - currentTotal).toFixed(2) : null,
      percentUsed: budgetLimit ? ((currentTotal / budgetLimit) * 100).toFixed(1) : null
    };
  }
}

module.exports = BudgetService;
