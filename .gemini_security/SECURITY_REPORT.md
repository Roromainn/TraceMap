# Security Audit Report - TraceMap MVP

**Audit Date:** March 18, 2026  
**Scope:** Recent changes (Slice 5 UX + activity display fixes)  
**Files Analyzed:** 4 files changed in last 5 commits

## Executive Summary

**Risk Level:** MEDIUM  
**Total Findings:** 3 (1 High, 2 Low)

The audit identified one high-severity XXE vulnerability in GPX file parsing and two low-severity information disclosure issues via console logging.

---

## Findings

### 🔴 HIGH: XML External Entity (XXE) Injection in GPX Parser

**File:** `src/services/gpxParser.ts`  
**Line:** 72-75  
**CWE:** CWE-611 (Improper Restriction of XML External Entity Reference)

**Description:**
The GPX parser uses `fast-xml-parser` without XXE protection enabled. GPX files are XML-based, and malicious users could craft GPX files containing XML External Entity declarations to:
- Read arbitrary files from the device
- Perform SSRF attacks against internal networks
- Cause denial of service via billion laughs attack

**Vulnerable Code:**
```typescript
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => name === 'trkpt' || name === 'trkseg',
});
```

**Impact:**
- **Confidentiality:** Attackers could read sensitive files from user's device
- **Integrity:** Potential for data exfiltration
- **Availability:** DoS via entity expansion attacks

**Recommendation:**
Enable XXE protection in the XMLParser configuration:
```typescript
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => name === 'trkpt' || name === 'trkseg',
  // ADD THESE OPTIONS:
  allowExternalEntities: false,  // Disable external entities
  ignoreExternalEntities: true,  // Ignore any external entity declarations
});
```

**References:**
- OWASP XXE Prevention Cheat Sheet
- fast-xml-parser documentation on entity handling

---

### 🔵 LOW: Sensitive Information Leakage via Console Logs

**File:** `src/app/(tabs)/index.tsx`  
**Lines:** 37-38, 49-53  
**CWE:** CWE-532 (Insertion of Sensitive Information into Log File)

**Description:**
Multiple `console.log` statements log sensitive user data including:
- Activity titles and GPS coordinates
- Bounding box coordinates (user's exercise routes)
- Number of GPS points per activity

**Vulnerable Code:**
```typescript
console.log('[Map] Setting trace from', recentActivity.title, 'with', 
            recentActivity.trace.coordinates.length, 'points');

console.log('[Map] Bounds:', {
  ne: [maxLng + lngPadding, maxLat + latPadding],
  sw: [minLng - lngPadding, minLat - latPadding],
});
```

**Impact:**
- **Privacy:** User's exercise routes and locations logged to console
- **Security:** Could be accessed by malicious apps with log access
- **Compliance:** May violate GDPR if logs are collected by third parties

**Recommendation:**
1. Remove or disable console.log statements in production
2. Use a logging library with log levels (debug, info, warn, error)
3. Implement log sanitization to remove PII

**Example Fix:**
```typescript
// Use environment-based logging
const __DEV__ = process.env.NODE_ENV === 'development';

if (__DEV__) {
  console.log('[Map] Loading trace...'); // No sensitive data
}
```

---

### 🔵 LOW: Insufficient File Upload Validation

**File:** `src/services/activities.ts`  
**Line:** 50-53  
**CWE:** CWE-434 (Unrestricted Upload of File with Dangerous Type)

**Description:**
GPX files uploaded to Supabase Storage are validated only by file extension (.gpx). The actual content is not validated to ensure it's a valid GPX file, allowing potential upload of:
- Malicious XML files
- Non-GPX files with .gpx extension
- Files with embedded scripts or malware

**Vulnerable Code:**
```typescript
const fileExt = options.fileName.split('.').pop();
const fileName = `${userId}/${Date.now()}.${fileExt}`;

await supabase.storage
  .from('gpx-files')
  .upload(fileName, options.rawGpxContent, {
    contentType: 'application/gpx+xml',
    upsert: false,
  });
```

**Impact:**
- **Storage Pollution:** Non-GPX files consuming storage quota
- **XSS Risk:** If files are served back with incorrect MIME types
- **Malware:** Potential for storing malicious content

**Recommendation:**
1. Validate GPX content structure before upload:
```typescript
// Validate GPX structure
function isValidGPX(content: string): boolean {
  try {
    const parser = new XMLParser({ 
      allowExternalEntities: false,
      ignoreExternalEntities: true,
    });
    const result = parser.parse(content);
    return result.gpx !== undefined;
  } catch {
    return false;
  }
}
```

2. Set strict Content-Type validation on Supabase Storage bucket
3. Implement file size limits (already has 50MB limit - good!)

---

## Positive Security Controls Observed

✅ **RLS (Row Level Security)** enabled on Supabase tables  
✅ **Parameterized queries** via Supabase client (prevents SQL injection)  
✅ **Secure storage** for auth tokens (expo-secure-store)  
✅ **File size validation** (50MB limit on GPX uploads)  
✅ **User isolation** via `user_id` scoping in queries  
✅ **Error handling** with try-catch blocks  

---

## Recommendations Summary

### Immediate Actions (High Priority)
1. **Fix XXE vulnerability** in `gpxParser.ts` by adding XXE protection options
2. **Add GPX content validation** before uploading to Storage

### Short-term Improvements (Low Priority)
3. **Remove console.log statements** or implement production-safe logging
4. **Add file content type validation** for GPX uploads
5. **Consider implementing CSP** for web version

---

## Conclusion

The codebase demonstrates good security practices overall (RLS, parameterized queries, secure token storage). However, the XXE vulnerability in GPX parsing should be addressed immediately before production deployment, as it could allow attackers to read files from users' devices or perform SSRF attacks.

**Risk Assessment:**
- **Pre-mitigation:** MEDIUM-HIGH
- **Post-mitigation (if XXE fixed):** LOW

---

*Audit performed using Two-Pass SAST Analysis Model*
