export interface SMSTemplateData {
  infoType: string;
  requestId: string;
  value?: string;
  errorMessage?: string;
}

export function getInfoTypeLabel(infoType: string): string {
  switch (infoType) {
    case 'email':
      return 'email address';
    case 'address':
      return 'full address';
    case 'account_number':
      return 'account number';
    default:
      return 'information';
  }
}

export function getInfoTypeExample(infoType: string): string {
  switch (infoType) {
    case 'email':
      return 'john.smith@email.com';
    case 'address':
      return '123 Main St, Springfield, IL 62701';
    case 'account_number':
      return '1234567890';
    default:
      return '';
  }
}

export function getRequestSMS(data: SMSTemplateData): string {
  const label = getInfoTypeLabel(data.infoType);
  const example = getInfoTypeExample(data.infoType);
  
  return `Hi! To continue with your call, please reply with your ${label}.

Example: ${example}

Request ID: ${data.requestId}`;
}

export function getConfirmationSMS(data: SMSTemplateData): string {
  const label = getInfoTypeLabel(data.infoType);
  
  return `✓ Got it!

Your ${label}: ${data.value}

Continuing with your call...`;
}

export function getErrorSMS(data: SMSTemplateData): string {
  return `That doesn't look right.

${data.errorMessage}

Please reply again with the correct information.`;
}

export function getTimeoutSMS(): string {
  return `This request has expired.

If you're still on the call, ask the agent to send a new request.`;
}
