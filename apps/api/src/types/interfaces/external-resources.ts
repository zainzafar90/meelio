/******************************/
/*****   LEMON SQUEEZY   ******/
/******************************/

export enum WebhookEvent {
  OrderCreated = "order_created",
  OrderRefunded = "order_refunded",
  SubscriptionCreated = "subscription_created",
  SubscriptionUpdated = "subscription_updated",
  SubscriptionCancelled = "subscription_cancelled",
  SubscriptionResumed = "subscription_resumed",
  SubscriptionExpired = "subscription_expired",
  SubscriptionPaused = "subscription_paused",
  SubscriptionUnpaused = "subscription_unpaused",
  SubscriptionPaymentSuccess = "subscription_payment_success",
  SubscriptionPaymentFailed = "subscription_payment_failed",
  SubscriptionPaymentRecovered = "subscription_payment_recovered",
  LicenseKeyCreated = "license_key_created",
  LicenseKeyUpdated = "license_key_updated",
}

interface BaseApiObject {
  type: string;
  id: string;
  relationships: object;
  links: object;
}

interface SubscriptionAttributesPayload {
  /**
   * The ID of the store this subscription belongs to.
   */
  store_id: number;
  /**
   * The ID of the customer this subscription belongs to.
   */
  customer_id: number;
  /**
   * The ID of the order associated with this subscription.
   */
  order_id: number;
  /**
   * The ID of the order item associated with this subscription.
   */
  order_item_id: number;
  /**
   * The ID of the product associated with this subscription.
   */
  product_id: number;
  /**
   * The ID of the variant associated with this subscription.
   */
  variant_id: number;
  /**
   * The name of the product.
   */
  product_name: string;
  /**
   * The name of the variant.
   */
  variant_name: string;
  /**
   * The full name of the customer.
   */
  user_name: string;
  /**
   * The email address of the customer.
   */
  user_email: string;
  /**
   * The status of the subscription.
   */
  status: "on_trial" | "active" | "paused" | "unpaid" | "cancelled" | "expired";
  /**
   * The title-case formatted status of the subscription.
   */
  status_formatted:
    | "On Trial"
    | "Active"
    | "Paused"
    | "Unpaid"
    | "Cancelled"
    | "Expired";
  /**
   * Lowercase brand of the card used to pay for the latest subscription payment.
   */
  card_brand:
    | "visa"
    | "mastercard"
    | "amex"
    | "discover"
    | "jcb"
    | "diners"
    | "unionpay"
    | null;
  /**
   * The last 4 digits of the card used to pay for the latest subscription payment.
   */
  card_last_four: string | null;
  /**
   * An object containing the payment collection pause behaviour options for the subscription, if set.
   */
  pause: object | null;
  /**
   * A boolean indicating if the subscription has been cancelled.
   */
  cancelled: boolean;
  /**
   * If the subscription has a free trial, an ISO-8601 formatted date-time indicating when the trial period ends.
   */
  trial_ends_at: string | null;
  /**
   * An integer representing the day of the month on which subscription invoice payments are collected.
   */
  billing_anchor: number;
  /**
   * An object representing the first subscription item belonging to this subscription.
   */
  first_subscription_item: {
    /**
     * ID of the subscription item.
     */
    id: number;
    /**
     * ID of the related subscription.
     */
    subscription_id: number;
    /**
     * ID of the subscription item's price.
     */
    price_id: number;
    /**
     * Quantity of the subscription item.
     */
    quantity: number;
    /**
     * Date the subscription item was created (ISO 8601 format).
     */
    created_at: string;
    /**
     * Date the subscription item was updated (ISO 8601 format).
     */
    updated_at: string;
  };
  /**
   * URLs for the customer to manage the subscription.
   */
  urls: {
    /**
     * A signed URL for managing payment and billing infanaginormation for the subscription, valid for 24 hours.
     */
    update_payment_method: string;
    /**
     * A signed URL for Customer Portal for managing the subscription, valid for 24 hours.
     */
    customer_portal: string;
  };
  /**
   * Date indicating the end of the current billing cycle, and when the next invoice will be issued (ISO 8601 format).
   */
  renews_at: string | null;
  /**
   * Date indicating when the subscription will expire or has expired (ISO 8601 format).
   */
  ends_at: string | null;
  /**
   * Date the subscription was created (ISO 8601 format).
   */
  created_at: string;
  /**
   * Date the subscription was updated (ISO 8601 format).
   */
  updated_at: string;
  /**
   * A boolean indicating if the customer was created within test mode.
   */
  test_mode: boolean;
}

export interface SubscriptionObject extends BaseApiObject {
  attributes: SubscriptionAttributesPayload;
}

export interface WebhookObject {
  meta: {
    event_name: WebhookEvent;
    test_mode: boolean;
  };
  data: SubscriptionObject;
}
