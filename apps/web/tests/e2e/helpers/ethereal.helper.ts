import { Page } from '@playwright/test';

export interface EtherealCredentials {
  username: string;
  password: string;
}

export interface EmailMessage {
  subject: string;
  from: string;
  to: string;
  html?: string;
  text?: string;
  messageId?: string;
}

export class EtherealHelper {
  private credentials: EtherealCredentials;
  private baseUrl = 'https://ethereal.email';
  
  constructor(
    private page: Page,
    credentials?: EtherealCredentials
  ) {
    // Use provided credentials or defaults from environment
    this.credentials = credentials || {
      username: process.env.SMTP_USERNAME || 'rylan.keebler85@ethereal.email',
      password: process.env.SMTP_PASSWORD || 'SAUjACwVEjRKU7Kqvn'
    };
  }

  /**
   * Login to Ethereal email service
   */
  async login(): Promise<void> {
    // Navigate to Ethereal login page
    await this.page.goto(`${this.baseUrl}/login`);
    
    // Fill in credentials
    const emailInput = this.page.locator('input[name="address"], input[type="email"]').first();
    const passwordInput = this.page.locator('input[name="password"], input[type="password"]').first();
    
    await emailInput.fill(this.credentials.username);
    await passwordInput.fill(this.credentials.password);
    
    // Submit login form
    const loginButton = this.page.locator('button[type="submit"], button:has-text("Login")').first();
    await loginButton.click();
    
    // Wait for navigation to messages page
    await this.page.waitForURL(/.*messages.*/, { timeout: 10000 });
  }

  /**
   * Get the latest email message
   */
  async getLatestEmail(timeout = 30000): Promise<EmailMessage | null> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      // Refresh messages page
      await this.page.goto(`${this.baseUrl}/messages`);
      
      // Look for email rows
      const emailRows = this.page.locator('tbody tr, .message-row, [data-message-id]');
      const count = await emailRows.count();
      
      if (count > 0) {
        // Click on the first (latest) email
        await emailRows.first().click();
        
        // Wait for email details to load
        await this.page.waitForSelector('.message-content, iframe, pre', { timeout: 5000 });
        
        // Extract email details
        const subject = await this.page.locator('.subject, h1, h2').first().textContent() || '';
        const from = await this.page.locator('.from, [data-from]').first().textContent() || '';
        const to = await this.page.locator('.to, [data-to]').first().textContent() || '';
        
        // Try to get HTML content from iframe or message body
        let html = '';
        let text = '';
        
        const iframe = this.page.frameLocator('iframe').first();
        if (await iframe.locator('body').count() > 0) {
          html = await iframe.locator('body').innerHTML() || '';
          text = await iframe.locator('body').textContent() || '';
        } else {
          // Fallback to direct content
          const messageContent = this.page.locator('.message-content, .email-body, pre').first();
          if (await messageContent.count() > 0) {
            html = await messageContent.innerHTML() || '';
            text = await messageContent.textContent() || '';
          }
        }
        
        return {
          subject: subject.trim(),
          from: from.trim(),
          to: to.trim(),
          html,
          text
        };
      }
      
      // Wait before checking again
      await this.page.waitForTimeout(2000);
    }
    
    return null;
  }

  /**
   * Extract magic link from email content
   */
  extractMagicLink(emailContent: string): string | null {
    // Common patterns for magic links
    const patterns = [
      /https?:\/\/[^\s<>"]+\/verify-magic-link\?token=[^\s<>"]+/i,
      /https?:\/\/[^\s<>"]+\/auth\/verify\?token=[^\s<>"]+/i,
      /https?:\/\/[^\s<>"]+\/magic-link\?[^\s<>"]+/i,
      /https?:\/\/[^\s<>"]+\?token=[A-Za-z0-9\-_]+/i
    ];
    
    for (const pattern of patterns) {
      const match = emailContent.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    // Fallback: look for any link with 'token' parameter
    const tokenLinkPattern = /https?:\/\/[^\s<>"]+token=[^\s<>"&]+/i;
    const tokenMatch = emailContent.match(tokenLinkPattern);
    if (tokenMatch) {
      return tokenMatch[0];
    }
    
    return null;
  }

  /**
   * Wait for and retrieve magic link from email
   */
  async waitForMagicLink(expectedEmail: string, timeout = 30000): Promise<string | null> {
    const email = await this.getLatestEmail(timeout);
    
    if (!email) {
      return null;
    }
    
    // Verify it's for the expected recipient
    if (!email.to.includes(expectedEmail) && !email.text?.includes(expectedEmail)) {
      console.warn(`Email recipient mismatch. Expected: ${expectedEmail}, Got: ${email.to}`);
    }
    
    // Extract magic link from email content
    const content = email.html || email.text || '';
    return this.extractMagicLink(content);
  }

  /**
   * Clear all messages in inbox
   */
  async clearInbox(): Promise<void> {
    await this.page.goto(`${this.baseUrl}/messages`);
    
    // Select all messages if there's a select all checkbox
    const selectAll = this.page.locator('input[type="checkbox"][name="select-all"], .select-all').first();
    if (await selectAll.count() > 0) {
      await selectAll.check();
      
      // Click delete button
      const deleteButton = this.page.locator('button:has-text("Delete"), button[aria-label="Delete"]').first();
      if (await deleteButton.count() > 0) {
        await deleteButton.click();
        
        // Confirm deletion if needed
        const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
        }
      }
    }
  }

  /**
   * Get email count in inbox
   */
  async getEmailCount(): Promise<number> {
    await this.page.goto(`${this.baseUrl}/messages`);
    const emailRows = this.page.locator('tbody tr, .message-row, [data-message-id]');
    return await emailRows.count();
  }

  /**
   * Open Ethereal in a new tab and return magic link
   */
  async getMagicLinkInNewTab(expectedEmail: string): Promise<string | null> {
    // Create a new page (tab) in the same context
    const etherealPage = await this.page.context().newPage();
    
    try {
      // Create helper instance for the new page
      const etherealHelper = new EtherealHelper(etherealPage, this.credentials);
      
      // Login to Ethereal
      await etherealHelper.login();
      
      // Wait for and get the magic link
      const magicLink = await etherealHelper.waitForMagicLink(expectedEmail, 30000);
      
      return magicLink;
    } finally {
      // Close the Ethereal tab
      await etherealPage.close();
    }
  }
}