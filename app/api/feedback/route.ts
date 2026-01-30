import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, email, message, context } = await request.json();

    // Validate input
    if (!name || !message) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      );
    }

    // Slack webhook URL from environment variable
    const slackWebhookUrl = process.env.SLACK_FEEDBACK_WEBHOOK_URL;

    if (!slackWebhookUrl) {
      console.error('SLACK_FEEDBACK_WEBHOOK_URL is not configured');
      return NextResponse.json(
        { error: 'Feedback service is not configured' },
        { status: 500 }
      );
    }

    const isCheckoutCancelled = context === 'checkout_cancelled';
    const headerText = isCheckoutCancelled
      ? '💳 Payment abandoned feedback'
      : '📬 New Feedback Received';

    // Format message for Slack
    const slackMessage = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: headerText,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Name:*\n${name}`,
            },
            {
              type: 'mrkdwn',
              text: `*Email:*\n${email || 'n/a'}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Message:*\n${message}`,
          },
        },
        ...(isCheckoutCancelled
          ? [
              {
                type: 'context',
                elements: [
                  { type: 'mrkdwn', text: 'Context: User left Stripe Checkout without completing payment' },
                ],
              },
            ]
          : []),
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Sent from Akowe • ${new Date().toLocaleString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short',
              })}`,
            },
          ],
        },
      ],
    };

    // Send to Slack
    const slackResponse = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    });

    if (!slackResponse.ok) {
      console.error('Failed to send to Slack:', await slackResponse.text());
      return NextResponse.json(
        { error: 'Failed to send feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
