class BudgetService {
  constructor(subscriptionService, userRepository) {
    this.subscriptionService = subscriptionService;
    this.userRepository = userRepository;
  }

  async checkBudgetLimit(userId, newSubscriptionData) {
    const user = await this.userRepository.findById(userId);

    if (!user || !user.monthly_budget) {
      return {
        exceedsLimit: false,
        message: 'No budget limit set'
      };
    }

    const budgetLimit = parseFloat(user.monthly_budget);
    const subscriptions = await this.subscriptionService.getUserSubscriptions(userId);

    const currentTotal = subscriptions
      .filter(sub => sub.status === 'Active')
      .reduce((sum, sub) => {
        const monthlyCost = this.subscriptionService.convertToMonthlyCost(sub.cost, sub.frequency, sub.custom_frequency_days);
        return sum + monthlyCost;
      }, 0);

    const newMonthlyCost = this.subscriptionService.convertToMonthlyCost(
      newSubscriptionData.cost,
      newSubscriptionData.billing_cycle,
      newSubscriptionData.custom_frequency_days
    );

    const newTotal = currentTotal + newMonthlyCost;

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
