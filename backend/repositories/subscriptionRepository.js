/**

 * handles all database operations for the subscription table
 */

class SubscriptionRepository {
  constructor(dbClient, createDbClientFn = null) {
    this.db = dbClient;
    this.createDbClient = createDbClientFn;
  }

  _getClient(accessToken = null) {
    // If access token is provided and we have the factory function, create a new client
    if (accessToken && this.createDbClient) {
      return this.createDbClient(accessToken);
    }
    // Otherwise use the default client (for operations that don't need RLS)
    return this.db;
  }

  async findByUserId(userId, accessToken = null) {
    const client = this._getClient(accessToken);
    const { data, error } = await client
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('renewal_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }

    return data || [];
  }


  async findById(subscriptionId, userId, accessToken = null) {
    const client = this._getClient(accessToken);
    const { data, error } = await client
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


  async create(subscriptionData, accessToken = null) {
    const client = this._getClient(accessToken);
    const { data, error } = await client
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    return data;
  }


  async update(subscriptionId, userId, updates, accessToken = null) {
    const client = this._getClient(accessToken);
    const { data, error } = await client
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

  async delete(subscriptionId, userId, accessToken = null) {
    const client = this._getClient(accessToken);
    const { error } = await client
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