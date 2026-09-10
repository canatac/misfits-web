/**
 * BIMI (Brand Indicators for Message Identification) parser and validator.
 *
 * Parses BIMI-Location and BIMI-Indicator headers, validates VMC
 * (Verified Mark Certificate), and provides logo URL extraction.
 *
 * Reference: RFC 8601, BIMI Group (bimigroup.org)
 */

export interface BimiRecord {
  /** The URL of the SVG logo (from BIMI-Location header). */
  logoUrl: string;
  /** The URL of the VMC certificate (from BIMI-Indicator header, optional). */
  vmcUrl?: string;
  /** Whether the BIMI record is valid (has required fields). */
  isValid: boolean;
  /** Validation errors, if any. */
  errors: string[];
}

/**
 * Parse a BIMI DNS record string.
 * Format: "v=BIMI1; l=https://example.com/logo.svg; a=https://example.com/vmc.pem"
 */
export function parseBimiRecord(dnsRecord: string): BimiRecord {
  const errors: string[] = [];
  let logoUrl = '';
  let vmcUrl = '';

  if (!dnsRecord || !dnsRecord.startsWith('v=BIMI1')) {
    errors.push('Invalid BIMI record: must start with "v=BIMI1"');
    return { logoUrl: '', vmcUrl: '', isValid: false, errors };
  }

  const parts = dnsRecord.split(';').map((p) => p.trim());

  for (const part of parts) {
    if (part.startsWith('l=')) {
      logoUrl = part.slice(2).trim();
    } else if (part.startsWith('a=')) {
      vmcUrl = part.slice(2).trim();
    }
  }

  if (!logoUrl) {
    errors.push('Missing required "l=" (logo URL) field');
  } else {
    // Validate logo URL
    try {
      const url = new URL(logoUrl);
      if (url.protocol !== 'https:') {
        errors.push('Logo URL must use HTTPS');
      }
      if (!url.pathname.endsWith('.svg')) {
        errors.push('Logo URL must point to an SVG file');
      }
    } catch {
      errors.push('Invalid logo URL format');
    }
  }

  if (vmcUrl) {
    try {
      const url = new URL(vmcUrl);
      if (url.protocol !== 'https:') {
        errors.push('VMC URL must use HTTPS');
      }
    } catch {
      errors.push('Invalid VMC URL format');
    }
  }

  return {
    logoUrl,
    vmcUrl: vmcUrl || undefined,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Parse BIMI headers from an email.
 */
export function parseBimiHeaders(headers: Record<string, string>): BimiRecord {
  const errors: string[] = [];
  let logoUrl = '';
  let vmcUrl = '';

  // BIMI-Location: the URL of the SVG logo
  const bimiLocation = headers['bimi-location'] || headers['BIMI-Location'] || '';
  // BIMI-Indicator: base64-encoded SVG (less common) or VMC reference
  const bimiIndicator = headers['bimi-indicator'] || headers['BIMI-Indicator'] || '';

  if (bimiLocation) {
    logoUrl = bimiLocation.trim();
    try {
      const url = new URL(logoUrl);
      if (url.protocol !== 'https:') {
        errors.push('BIMI-Location must use HTTPS');
      }
    } catch {
      errors.push('Invalid BIMI-Location URL');
    }
  }

  if (bimiIndicator) {
    // Could be a VMC URL or encoded data
    if (bimiIndicator.startsWith('https://')) {
      vmcUrl = bimiIndicator;
    }
  }

  if (!logoUrl && !bimiIndicator) {
    errors.push('No BIMI headers found');
  }

  return {
    logoUrl,
    vmcUrl,
    isValid: errors.length === 0 && !!logoUrl,
    errors,
  };
}

/**
 * Generate a BIMI DNS record for a domain.
 */
export function generateBimiRecord(args: {
  domain: string;
  logoPath?: string;
  vmcPath?: string;
}): string {
  const { domain, logoPath = '/.well-known/bimi/logo.svg', vmcPath } = args;
  let record = `v=BIMI1; l=https://${domain}${logoPath}`;
  if (vmcPath) {
    record += `; a=https://${domain}${vmcPath}`;
  }
  return record;
}

/**
 * Validate an SVG logo string (basic checks).
 */
export function validateSvgLogo(svgContent: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!svgContent.includes('<svg')) {
    errors.push('Missing <svg> element');
  }
  if (!svgContent.includes('</svg>')) {
    errors.push('Missing closing </svg> tag');
  }
  if (!svgContent.includes('xmlns=')) {
    errors.push('Missing xmlns attribute');
  }

  // Check for potentially dangerous content
  if (/<script/i.test(svgContent)) {
    errors.push('SVG contains <script> tags');
  }
  if (/javascript:/i.test(svgContent)) {
    errors.push('SVG contains javascript: URLs');
  }
  if (/on\w+=/i.test(svgContent)) {
    errors.push('SVG contains event handlers');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get the BIMI DNS record name for a domain.
 */
export function getBimiDnsRecordName(domain: string): string {
  return `default._bimi.${domain}`;
}
