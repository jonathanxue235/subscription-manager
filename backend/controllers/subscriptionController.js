class SubscriptionController {
  constructor(subscriptionService, budgetService) {
    this.subscriptionService = subscriptionService;
    this.budgetService = budgetService;
  }

  async getAll(req, res) {
    try {
      const userId = req.user.userId;
      const subscriptions = await this.subscriptionService.getUserSubscriptions(userId);

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

      res.json(subscriptionsWithStatus);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  }

  async getOne(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const subscription = await this.subscriptionService.getSubscription(id, userId);
      res.json(subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      res.status(404).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const userId = req.user.userId;
      const subscriptionData = req.body;

      const budgetCheck = await this.budgetService.checkBudgetLimit(userId, subscriptionData);

      if (budgetCheck.exceedsLimit) {
        return res.status(200).json({
          warning: true,
          message: budgetCheck.message,
          currentTotal: budgetCheck.currentTotal,
          newTotal: budgetCheck.newTotal,
          budgetLimit: budgetCheck.budgetLimit
        });
      }

      const newSubscription = await this.subscriptionService.createSubscription(userId, subscriptionData);
      res.status(201).json(newSubscription);
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  }

  async update(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const updates = req.body;

      const updatedSubscription = await this.subscriptionService.updateSubscription(id, userId, updates);
      res.json(updatedSubscription);
    } catch (error) {
      console.error('Error updating subscription:', error);
      res.status(500).json({ error: 'Failed to update subscription' });
    }
  }

  async delete(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      await this.subscriptionService.deleteSubscription(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      res.status(500).json({ error: 'Failed to delete subscription' });
    }
  }

  async getDashboard(req, res) {
    try {
      const userId = req.user.userId;
      const stats = await this.subscriptionService.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }

  async getHistory(req, res) {
    try {
      const userId = req.user.userId;
      const history = await this.subscriptionService.getSubscriptionHistory(userId);
      res.json(history);
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: 'Failed to fetch subscription history' });
    }
  }
}

module.exports = SubscriptionController;
