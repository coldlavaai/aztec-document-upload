# Upload Page Updates Summary

## Changes Made:

### 1. **Added Upload Instructions**
- **Passport/ID:** "All text must be visible and not blurred"
- **CSCS Front:** "Show front side. Expiry date, name, and details must be completely visible, otherwise your application will be denied."
- **CSCS Back:** "Show back side. All details must be completely visible, otherwise your application will be denied."

### 2. **Added 5 Additional Optional Document Slots**
- Users can upload up to 5 additional documents
- Optional (not required to proceed)
- Each additional document gets a descriptive label in Supabase

### 3. **Supabase Changes Needed**
The documents table already supports this - just stores:
- document_type (e.g., "passport", "cscs_front", "cscs_back", "additional_1", "additional_2", etc.)
- file_path
- file_url

No schema changes needed!

### 4. **UI Improvements**
- Clear instructions under each upload field
- Warning messages in red for critical requirements
- Optional additional documents section at the bottom
- Upload counter for additional docs
