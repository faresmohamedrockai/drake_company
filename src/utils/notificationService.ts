// Notification Service for Propai CRM
// Handles email notifications, push notifications, and contract alerts

interface NotificationSettings {
  email: {
    enabled: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    fromEmail: string;
    fromName: string;
    mirrorEnabled: boolean;
    mirrorEmail: string;
  };
  push: {
    enabled: boolean;
    meetingReminders: boolean;
    contractAlerts: boolean;
    soundEnabled: boolean;
  };
  contract: {
    statusAlerts: boolean;
    expiryAlerts: boolean;
    paymentReminders: boolean;
  };
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  createdAt: string;
  createdBy: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  attendees: string[];
  leadId?: string;
  notes?: string;
}

interface Contract {
  id: string;
  leadId: string;
  propertyId: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  amount: number;
  paymentStatus: 'pending' | 'partial' | 'completed';
  lastPaymentDate?: string;
  nextPaymentDate?: string;
}

class NotificationService {
  private settings: NotificationSettings;
  private notificationHistory: Array<{
    id: string;
    type: 'email' | 'push' | 'contract';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }> = [];

  constructor() {
    this.settings = this.loadSettings();
    this.requestNotificationPermission();
  }

  private loadSettings(): NotificationSettings {
    const saved = localStorage.getItem('propai_notification_settings');
    if (saved) {
      return JSON.parse(saved);
    }

    // Default settings
    return {
      email: {
        enabled: true,
        smtpHost: import.meta.env.VITE_SMTP_HOST || 'smtp.gmail.com',
        smtpPort: parseInt(import.meta.env.VITE_SMTP_PORT || '587'),
        smtpUser: import.meta.env.VITE_SMTP_USER || '',
        smtpPass: import.meta.env.VITE_SMTP_PASS || '',
        fromEmail: import.meta.env.VITE_FROM_EMAIL || 'notifications@propai.com',
        fromName: import.meta.env.VITE_FROM_NAME || 'Propai CRM',
        mirrorEnabled: true,
        mirrorEmail: import.meta.env.VITE_MIRROR_EMAIL || 'admin@propai.com',
      },
      push: {
        enabled: true,
        meetingReminders: true,
        contractAlerts: true,
        soundEnabled: true,
      },
      contract: {
        statusAlerts: true,
        expiryAlerts: true,
        paymentReminders: true,
      },
    };
  }

  private saveSettings(): void {
    localStorage.setItem('propai_notification_settings', JSON.stringify(this.settings));
  }

  public updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  public getSettings(): NotificationSettings {
    return this.settings;
  }

  // Request notification permission
  private async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  // Email notification for new leads with mirror functionality
  public async sendLeadEmailNotification(lead: Lead): Promise<void> {
    if (!this.settings.email.enabled) return;

    try {
      const emailData = {
        to: lead.email,
        subject: `Welcome to Propai Real Estate - Lead Registration`,
        html: this.generateLeadEmailTemplate(lead),
        text: this.generateLeadEmailText(lead),
      };

      // Send to lead
      await this.sendEmail(emailData);

      // Mirror email if enabled
      if (this.settings.email.mirrorEnabled && this.settings.email.mirrorEmail) {
        const mirrorData = {
          to: this.settings.email.mirrorEmail,
          subject: `[MIRROR] New Lead Registration - ${lead.name}`,
          html: this.generateMirrorEmailTemplate(lead),
          text: this.generateMirrorEmailText(lead),
        };
        await this.sendEmail(mirrorData);
      }

      this.addToHistory('email', 'New Lead Notification', `Email sent to ${lead.name} (${lead.email})`);
    } catch (error) {
      console.error('Failed to send lead email notification:', error);
    }
  }

  // Push notification for meeting reminders
  public async sendMeetingReminder(meeting: Meeting): Promise<void> {
    if (!this.settings.push.enabled || !this.settings.push.meetingReminders) return;

    try {
      const title = 'Meeting Reminder';
      const message = `Meeting: ${meeting.title} at ${meeting.time}`;
      
      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/src/aspects/RockaidevLogo.jpg',
          badge: '/src/aspects/RockaidevLogo.jpg',
          tag: `meeting-${meeting.id}`,
        });
      }

      // Play sound if enabled
      if (this.settings.push.soundEnabled) {
        this.playNotificationSound();
      }

      this.addToHistory('push', title, message);
    } catch (error) {
      console.error('Failed to send meeting reminder:', error);
    }
  }

  // Push notification for contract status alerts
  public async sendContractAlert(contract: Contract, alertType: 'status' | 'expiry' | 'payment'): Promise<void> {
    if (!this.settings.push.enabled || !this.settings.push.contractAlerts) return;

    try {
      let title = 'Contract Alert';
      let message = '';

      switch (alertType) {
        case 'status':
          if (!this.settings.contract.statusAlerts) return;
          message = `Contract status changed to: ${contract.status}`;
          break;
        case 'expiry':
          if (!this.settings.contract.expiryAlerts) return;
          message = `Contract expires on: ${contract.endDate}`;
          break;
        case 'payment':
          if (!this.settings.contract.paymentReminders) return;
          message = `Payment reminder: ${contract.paymentStatus} - Next payment: ${contract.nextPaymentDate}`;
          break;
      }

      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/src/aspects/RockaidevLogo.jpg',
          badge: '/src/aspects/RockaidevLogo.jpg',
          tag: `contract-${contract.id}-${alertType}`,
        });
      }

      // Play sound if enabled
      if (this.settings.push.soundEnabled) {
        this.playNotificationSound();
      }

      this.addToHistory('contract', title, message);
    } catch (error) {
      console.error('Failed to send contract alert:', error);
    }
  }

  // Email sending function (simulated - would integrate with actual email service)
  private async sendEmail(emailData: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    // In a real implementation, this would use a service like SendGrid, AWS SES, or similar
    console.log('Sending email:', {
      to: emailData.to,
      subject: emailData.subject,
      smtpHost: this.settings.email.smtpHost,
      smtpPort: this.settings.email.smtpPort,
      fromEmail: this.settings.email.fromEmail,
    });

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Email templates
  private generateLeadEmailTemplate(lead: Lead): string {
    return `
      <!DOCTYPE html>
      <html dir="ltr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Propai Real Estate</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Propai Real Estate</h1>
            <p>Thank you for your interest in our properties!</p>
          </div>
          <div class="content">
            <h2>Hello ${lead.name},</h2>
            <p>Welcome to Propai Real Estate! We're excited to have you as part of our community.</p>
            
            <h3>Your Lead Details:</h3>
            <ul>
              <li><strong>Name:</strong> ${lead.name}</li>
              <li><strong>Email:</strong> ${lead.email}</li>
              <li><strong>Phone:</strong> ${lead.phone}</li>
              <li><strong>Status:</strong> ${lead.status}</li>
              <li><strong>Source:</strong> ${lead.source}</li>
            </ul>
            
            <p>Our team will be in touch with you shortly to discuss your real estate needs and show you our latest properties.</p>
            
            <a href="https://propai.com" class="button">Visit Our Website</a>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>The Propai Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Propai Real Estate. All rights reserved.</p>
            <p>This email was sent to ${lead.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateLeadEmailText(lead: Lead): string {
    return `
Welcome to Propai Real Estate!

Hello ${lead.name},

Welcome to Propai Real Estate! We're excited to have you as part of our community.

Your Lead Details:
- Name: ${lead.name}
- Email: ${lead.email}
- Phone: ${lead.phone}
- Status: ${lead.status}
- Source: ${lead.source}

Our team will be in touch with you shortly to discuss your real estate needs and show you our latest properties.

Visit our website: https://propai.com

If you have any questions, please don't hesitate to contact us.

Best regards,
The Propai Team

© 2024 Propai Real Estate. All rights reserved.
    `;
  }

  private generateMirrorEmailTemplate(lead: Lead): string {
    return `
      <!DOCTYPE html>
      <html dir="ltr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Lead Registration - Mirror</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ff6b6b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .lead-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Lead Registration</h1>
            <p>Mirror Notification</p>
          </div>
          <div class="content">
            <h2>A new lead has been registered in the system:</h2>
            
            <div class="lead-info">
              <h3>Lead Information:</h3>
              <ul>
                <li><strong>Name:</strong> ${lead.name}</li>
                <li><strong>Email:</strong> ${lead.email}</li>
                <li><strong>Phone:</strong> ${lead.phone}</li>
                <li><strong>Status:</strong> ${lead.status}</li>
                <li><strong>Source:</strong> ${lead.source}</li>
                <li><strong>Created By:</strong> ${lead.createdBy}</li>
                <li><strong>Created At:</strong> ${new Date(lead.createdAt).toLocaleString()}</li>
              </ul>
            </div>
            
            <p>This is a mirror notification. The lead has also received a welcome email.</p>
            
            <p>Please follow up with this lead according to your sales process.</p>
          </div>
          <div class="footer">
            <p>© 2024 Propai Real Estate. All rights reserved.</p>
            <p>This is an automated mirror notification.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateMirrorEmailText(lead: Lead): string {
    return `
New Lead Registration - Mirror

A new lead has been registered in the system:

Lead Information:
- Name: ${lead.name}
- Email: ${lead.email}
- Phone: ${lead.phone}
- Status: ${lead.status}
- Source: ${lead.source}
- Created By: ${lead.createdBy}
- Created At: ${new Date(lead.createdAt).toLocaleString()}

This is a mirror notification. The lead has also received a welcome email.

Please follow up with this lead according to your sales process.

© 2024 Propai Real Estate. All rights reserved.
    `;
  }

  // Play notification sound
  private playNotificationSound(): void {
    try {
      const audio = new Audio('/notification-sound.mp3'); // You can add a sound file
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Fallback: create a simple beep sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        setTimeout(() => oscillator.stop(), 200);
      });
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  // Add notification to history
  private addToHistory(type: 'email' | 'push' | 'contract', title: string, message: string): void {
    const notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.notificationHistory.unshift(notification);
    
    // Keep only last 100 notifications
    if (this.notificationHistory.length > 100) {
      this.notificationHistory = this.notificationHistory.slice(0, 100);
    }

    // Save to localStorage
    localStorage.setItem('propai_notification_history', JSON.stringify(this.notificationHistory));
  }

  // Get notification history
  public getNotificationHistory(): Array<{
    id: string;
    type: 'email' | 'push' | 'contract';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }> {
    return this.notificationHistory;
  }

  // Mark notification as read
  public markAsRead(notificationId: string): void {
    const notification = this.notificationHistory.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      localStorage.setItem('propai_notification_history', JSON.stringify(this.notificationHistory));
    }
  }

  // Get unread count
  public getUnreadCount(): number {
    return this.notificationHistory.filter(n => !n.read).length;
  }

  // Clear notification history
  public clearHistory(): void {
    this.notificationHistory = [];
    localStorage.removeItem('propai_notification_history');
  }

  // Test notification
  public async testNotification(type: 'email' | 'push' | 'contract'): Promise<void> {
    const testLead: Lead = {
      id: 'test-1',
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      status: 'New',
      source: 'Website',
      createdAt: new Date().toISOString(),
      createdBy: 'System',
    };

    const testMeeting: Meeting = {
      id: 'test-meeting-1',
      title: 'Test Meeting',
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM',
      attendees: ['Test User'],
    };

    const testContract: Contract = {
      id: 'test-contract-1',
      leadId: 'test-1',
      propertyId: 'test-property-1',
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: 50000,
      paymentStatus: 'pending',
      nextPaymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    switch (type) {
      case 'email':
        await this.sendLeadEmailNotification(testLead);
        break;
      case 'push':
        await this.sendMeetingReminder(testMeeting);
        break;
      case 'contract':
        await this.sendContractAlert(testContract, 'status');
        break;
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService; 