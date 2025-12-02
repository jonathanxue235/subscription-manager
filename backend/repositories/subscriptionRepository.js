/**

 * handles all database operations for the subscription table
 */

class SubscriptionRepository {
  constructor(dbClient) {
    this.db = dbClient;
  }


  async findByUserId(userId) {
    const { data, error } = await this.db
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('renewal_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }

    return data || [];
  }


  async findById(subscriptionId, userId) {
    const { data, error } = await this.db
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found (this is okay)
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }

    return data;
  }

  
  async create(subscriptionData) {
    const { data, error } = await this.db
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    return data;
  }


  async update(subscriptionId, userId, updates) {
    const { data, error } = await this.db
      .from('subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    return data;
  }

  async delete(subscriptionId, userId) {
    const { error } = await this.db
      .from('subscriptions')
      .delete()
      .eq('id', subscriptionId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete subscription: ${error.message}`);
    }
  }
}

module.exports = SubscriptionRepository;