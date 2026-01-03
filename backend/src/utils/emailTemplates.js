function baseTemplate({ title, intro, content, ctaLabel, ctaUrl }) {
  const ctaHtml = ctaLabel && ctaUrl
    ? `<a href="${ctaUrl}" style="display:inline-block;background:#1E40AF;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">${ctaLabel}</a>`
    : '';

  return `
  <div style="font-family:Arial, sans-serif;background:#F9FAFB;padding:24px;">
    <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:10px;border:1px solid #E5E7EB;overflow:hidden;">
      <div style="background:#1E40AF;color:#fff;padding:18px 24px;">
        <h1 style="margin:0;font-size:20px;">EduAuth Registry</h1>
      </div>
      <div style="padding:24px;color:#111827;">
        <h2 style="margin-top:0;font-size:18px;">${title}</h2>
        ${intro ? `<p style="margin:0 0 16px 0;">${intro}</p>` : ''}
        ${content}
        ${ctaHtml ? `<div style="margin-top:24px;">${ctaHtml}</div>` : ''}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #E5E7EB;color:#6B7280;font-size:12px;">
        Bangladesh Educational Certificate Verification System
      </div>
    </div>
  </div>
  `;
}

function verificationEmail({ name, verifyUrl }) {
  const content = `
    <p>Welcome ${name || 'to EduAuth Registry'}.</p>
    <p>Please verify your email within 24 hours to continue registration.</p>
  `;
  return baseTemplate({
    title: 'Verify Your Email',
    intro: 'Complete your registration by confirming your email address.',
    content,
    ctaLabel: 'Verify Email',
    ctaUrl: verifyUrl,
  });
}

function registrationApprovedEmail({ name, loginUrl }) {
  const content = `
    <p>Hi ${name || ''},</p>
    <p>Your registration has been approved. You can now sign in to your EduAuth account.</p>
  `;
  return baseTemplate({
    title: 'Registration Approved',
    intro: 'Your EduAuth Registry account is active.',
    content,
    ctaLabel: 'Login Now',
    ctaUrl: loginUrl,
  });
}

function registrationRejectedEmail({ name, reason, registerUrl, submittedData }) {
  const details = submittedData
    ? Object.entries(submittedData)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([label, value]) => `<li><strong>${label}:</strong> ${value}</li>`)
        .join('')
    : '';
  const content = `
    <p>Hi ${name || ''},</p>
    <p>Your registration was not approved at this time.</p>
    <p><strong>Reason:</strong> ${reason || 'Please review your submission and try again.'}</p>
    ${details ? `<p>Submitted details:</p><ul>${details}</ul>` : ''}
    <p>You may re-register with corrected information.</p>
  `;
  return baseTemplate({
    title: 'Registration Status Update',
    intro: 'We need a few updates to proceed.',
    content,
    ctaLabel: 'Register Again',
    ctaUrl: registerUrl,
  });
}

function certificateIssuedEmail({ name, certificateType, serial, viewUrl }) {
  const content = `
    <p>Hi ${name || ''},</p>
    <p>A new certificate has been issued.</p>
    <ul>
      <li><strong>Type:</strong> ${certificateType}</li>
      <li><strong>Serial:</strong> ${serial}</li>
    </ul>
  `;
  return baseTemplate({
    title: 'New Certificate Issued',
    intro: 'Your certificate is ready.',
    content,
    ctaLabel: 'View Certificate',
    ctaUrl: viewUrl,
  });
}

function profileRequestReceivedEmail({ name }) {
  const content = `
    <p>Hi ${name || ''},</p>
    <p>We received your profile update request. Review usually takes 3-5 business days.</p>
  `;
  return baseTemplate({
    title: 'Profile Update Request Received',
    intro: 'We are reviewing your request.',
    content,
  });
}

function profileRequestApprovedEmail({ name, summary }) {
  const content = `
    <p>Hi ${name || ''},</p>
    <p>Your profile update request has been approved.</p>
    ${summary ? `<p><strong>Updated:</strong> ${summary}</p>` : ''}
  `;
  return baseTemplate({
    title: 'Profile Update Approved',
    intro: 'Your information has been updated.',
    content,
  });
}

function profileRequestRejectedEmail({ name, reason }) {
  const content = `
    <p>Hi ${name || ''},</p>
    <p>Your profile update request was not approved.</p>
    <p><strong>Reason:</strong> ${reason || 'Please review the feedback and resubmit.'}</p>
  `;
  return baseTemplate({
    title: 'Profile Update Request - Action Required',
    intro: 'We need more information to proceed.',
    content,
  });
}

function programDecisionEmail({ institutionName, programName, status, comments }) {
  const content = `
    <p>${institutionName || 'Institution'},</p>
    <p>Your program request for <strong>${programName}</strong> has been <strong>${status}</strong>.</p>
    ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
  `;
  return baseTemplate({
    title: 'Program Approval Decision',
    intro: 'Program request update.',
    content,
  });
}

function passwordResetEmail({ name, resetUrl }) {
  const content = `
    <p>Hi ${name || ''},</p>
    <p>We received a request to reset your password. This link expires in 1 hour.</p>
  `;
  return baseTemplate({
    title: 'Reset Your Password',
    intro: 'Use the link below to reset your password.',
    content,
    ctaLabel: 'Reset Password',
    ctaUrl: resetUrl,
  });
}

function permissionRevokedEmail({ institutionName, reason }) {
  const content = `
    <p>${institutionName || 'Institution'},</p>
    <p>Your certificate issuing permission has been revoked.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
  `;
  return baseTemplate({
    title: 'Certificate Issuing Permission Update',
    intro: 'Please contact support for assistance.',
    content,
  });
}

function issueTicketConfirmationEmail({ ticketNumber, summary }) {
  const content = `
    <p>Your support ticket has been created.</p>
    <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
    ${summary ? `<p><strong>Summary:</strong> ${summary}</p>` : ''}
    <p>We will respond as soon as possible.</p>
  `;
  return baseTemplate({
    title: 'Support Ticket Created',
    intro: 'Thank you for contacting EduAuth support.',
    content,
  });
}

function issueResponseEmail({ ticketNumber, response }) {
  const content = `
    <p>We have an update on your support request.</p>
    <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
    <p><strong>Response:</strong> ${response}</p>
  `;
  return baseTemplate({
    title: 'Support Ticket Update',
    intro: 'A response is available for your ticket.',
    content,
  });
}

function enrollmentApprovedEmail({ studentName, institutionName }) {
  const content = `
    <p>Hi ${studentName || ''},</p>
    <p>Your enrollment has been confirmed${institutionName ? ` at <strong>${institutionName}</strong>` : ''}.</p>
    <p>You can now view enrollment details in your EduAuth dashboard.</p>
  `;
  return baseTemplate({
    title: 'Enrollment Confirmed',
    intro: 'Enrollment update from EduAuth Registry.',
    content,
  });
}

function enrollmentRejectedEmail({ studentName, institutionName, reason }) {
  const content = `
    <p>Hi ${studentName || ''},</p>
    <p>Your enrollment request${institutionName ? ` with <strong>${institutionName}</strong>` : ''} was not approved.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
    <p>You may contact the institution or submit a new request with updated information.</p>
  `;
  return baseTemplate({
    title: 'Enrollment Request Update',
    intro: 'We have reviewed your enrollment request.',
    content,
  });
}

module.exports = {
  verificationEmail,
  registrationApprovedEmail,
  registrationRejectedEmail,
  certificateIssuedEmail,
  profileRequestReceivedEmail,
  profileRequestApprovedEmail,
  profileRequestRejectedEmail,
  programDecisionEmail,
  passwordResetEmail,
  permissionRevokedEmail,
  issueTicketConfirmationEmail,
  issueResponseEmail,
  enrollmentApprovedEmail,
  enrollmentRejectedEmail,
};
