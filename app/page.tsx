'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './upload.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UploadPage() {
  const [token, setToken] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [alreadyUploaded, setAlreadyUploaded] = useState(false);
  const [error, setError] = useState('');

  // Reference data
  const [ref1Name, setRef1Name] = useState<string>('');
  const [ref1Phone, setRef1Phone] = useState<string>('');
  const [ref1Company, setRef1Company] = useState<string>('');
  const [ref2Name, setRef2Name] = useState<string>('');
  const [ref2Phone, setRef2Phone] = useState<string>('');
  const [ref2Company, setRef2Company] = useState<string>('');

  // File uploads
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [cscsFrontFile, setCscsFrontFile] = useState<File | null>(null);
  const [cscsBackFile, setCSCSBackFile] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<(File | null)[]>([null, null, null, null, null]);

  useEffect(() => {
    // Get token and name from URL
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlName = params.get('name');

    if (urlToken) {
      setToken(urlToken);
      setName(urlName || 'there');
      validateToken(urlToken);
    } else {
      setError('Invalid upload link. Please check your WhatsApp message.');
      setLoading(false);
    }
  }, []);

  const validateToken = async (tokenToValidate: string) => {
    try {
      const { data, error } = await supabase
        .from('applicants')
        .select('id, first_name, document_upload_token, documents_uploaded')
        .eq('document_upload_token', tokenToValidate)
        .single();

      if (error || !data) {
        setError('Invalid or expired upload link.');
        setValidToken(false);
      } else if (data.documents_uploaded) {
        setAlreadyUploaded(true);
        setName(data.first_name || name);
      } else {
        setValidToken(true);
        setName(data.first_name || name);
      }
    } catch (err) {
      setError('Error validating upload link. Please try again.');
      setValidToken(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate reference fields
    if (!ref1Name || !ref1Phone || !ref1Company || !ref2Name || !ref2Phone || !ref2Company) {
      setError('Please provide both references (all fields required).');
      return;
    }

    // Validate documents
    if (!passportFile || !cscsFrontFile || !cscsBackFile) {
      setError('Please select all required documents.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploadedFiles = [];

      // Upload Passport
      const passportPath = `${token}/passport.${passportFile.name.split('.').pop()}`;
      const { data: passportData, error: passportError } = await supabase.storage
        .from('applicant-documents')
        .upload(passportPath, passportFile, { upsert: true });

      if (passportError) throw new Error(`Failed to upload Passport/ID: ${passportError.message}`);

      const { data: { publicUrl: passportUrl } } = supabase.storage
        .from('applicant-documents')
        .getPublicUrl(passportPath);

      uploadedFiles.push({
        type: 'passport',
        url: passportUrl,
        filename: passportFile.name,
        path: passportPath
      });

      // Upload CSCS Front
      const cscsFrontPath = `${token}/cscs_front.${cscsFrontFile.name.split('.').pop()}`;
      const { data: cscsFrontData, error: cscsFrontError } = await supabase.storage
        .from('applicant-documents')
        .upload(cscsFrontPath, cscsFrontFile, { upsert: true });

      if (cscsFrontError) throw new Error(`Failed to upload CSCS Card (Front): ${cscsFrontError.message}`);

      const { data: { publicUrl: cscsFrontUrl } } = supabase.storage
        .from('applicant-documents')
        .getPublicUrl(cscsFrontPath);

      uploadedFiles.push({
        type: 'cscs_front',
        url: cscsFrontUrl,
        filename: cscsFrontFile.name,
        path: cscsFrontPath
      });

      // Upload CSCS Back
      const cscsBackPath = `${token}/cscs_back.${cscsBackFile.name.split('.').pop()}`;
      const { data: cscsBackData, error: cscsBackError } = await supabase.storage
        .from('applicant-documents')
        .upload(cscsBackPath, cscsBackFile, { upsert: true });

      if (cscsBackError) throw new Error(`Failed to upload CSCS Card (Back): ${cscsBackError.message}`);

      const { data: { publicUrl: cscsBackUrl } } = supabase.storage
        .from('applicant-documents')
        .getPublicUrl(cscsBackPath);

      uploadedFiles.push({
        type: 'cscs_back',
        url: cscsBackUrl,
        filename: cscsBackFile.name,
        path: cscsBackPath
      });

      // Upload Additional Documents (if any selected)
      for (let i = 0; i < additionalFiles.length; i++) {
        const additionalFile = additionalFiles[i];
        if (additionalFile) {
          const additionalPath = `${token}/additional_${i + 1}.${additionalFile.name.split('.').pop()}`;
          const { data: additionalData, error: additionalError } = await supabase.storage
            .from('applicant-documents')
            .upload(additionalPath, additionalFile, { upsert: true });

          if (additionalError) {
            console.warn(`Failed to upload Additional Document ${i + 1}:`, additionalError.message);
            // Don't throw - additional docs are optional
          } else {
            const { data: { publicUrl: additionalUrl } } = supabase.storage
              .from('applicant-documents')
              .getPublicUrl(additionalPath);

            uploadedFiles.push({
              type: `additional_${i + 1}`,
              url: additionalUrl,
              filename: additionalFile.name,
              path: additionalPath
            });
          }
        }
      }

      // Send webhook to n8n for WhatsApp confirmation
      try {
        await fetch('https://n8n.coldlava.ai/webhook/document-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            status: 'success',
            files: uploadedFiles,
            references: {
              reference_1_name: ref1Name,
              reference_1_phone: ref1Phone,
              reference_1_company: ref1Company,
              reference_2_name: ref2Name,
              reference_2_phone: ref2Phone,
              reference_2_company: ref2Company
            }
          })
        });
      } catch (webhookError) {
        console.log('Webhook notification failed (non-critical):', webhookError);
        // Don't fail the upload if webhook fails - user still uploaded successfully
      }

      setUploadComplete(true);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <img src="/aztec-logo.png" alt="Aztec Landscapes" className="logo" />
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  if (alreadyUploaded) {
    return (
      <div className="container">
        <div className="card">
          <img src="/aztec-logo.png" alt="Aztec Landscapes" className="logo" />
          <h1>✅ Documents Already Uploaded</h1>
          <p>Thank you, {name}!</p>
          <p>Your documents have already been successfully uploaded and received.</p>
          <p>Our labour manager will review your application and contact you within 48 hours.</p>
          <p className="footer" style={{marginTop: '24px', fontSize: '14px', color: '#666'}}>
            You can close this window. We'll be in touch soon!
          </p>
        </div>
      </div>
    );
  }

  if (!validToken || error) {
    return (
      <div className="container">
        <div className="card">
          <img src="/aztec-logo.png" alt="Aztec Landscapes" className="logo" />
          <h1>❌ Upload Error</h1>
          <p className="error">{error}</p>
          <p>Please contact Aztec Landscapes if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  if (uploadComplete) {
    return (
      <div className="container">
        <div className="card">
          <img src="/aztec-logo.png" alt="Aztec Landscapes" className="logo" />
          <h1>✅ Upload Complete!</h1>
          <p>Thank you for uploading your documents, {name}!</p>
          <p>We appreciate your application. Our labour manager will review your documents and be in touch with you soon.</p>
          <p className="footer" style={{marginTop: '20px', fontSize: '14px'}}>
            You can now close this window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <img src="/aztec-logo.png" alt="Aztec Landscapes" className="logo" />
        <h1>📄 Document Upload</h1>
        <p>Welcome, {name}!</p>
        <p>Please upload the following documents to complete your application:</p>

        <form onSubmit={handleUpload}>
          {/* Reference 1 */}
          <div className="reference-section">
            <h3>Reference 1</h3>
            <div className="reference-fields">
              <div className="field-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={ref1Name}
                  onChange={(e) => setRef1Name(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="field-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  value={ref1Phone}
                  onChange={(e) => setRef1Phone(e.target.value)}
                  placeholder="+44..."
                  required
                />
              </div>
              <div className="field-group">
                <label>Company *</label>
                <input
                  type="text"
                  value={ref1Company}
                  onChange={(e) => setRef1Company(e.target.value)}
                  placeholder="Company name"
                  required
                />
              </div>
            </div>
          </div>

          {/* Reference 2 */}
          <div className="reference-section">
            <h3>Reference 2</h3>
            <div className="reference-fields">
              <div className="field-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={ref2Name}
                  onChange={(e) => setRef2Name(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="field-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  value={ref2Phone}
                  onChange={(e) => setRef2Phone(e.target.value)}
                  placeholder="+44..."
                  required
                />
              </div>
              <div className="field-group">
                <label>Company *</label>
                <input
                  type="text"
                  value={ref2Company}
                  onChange={(e) => setRef2Company(e.target.value)}
                  placeholder="Company name"
                  required
                />
              </div>
            </div>
          </div>

          <hr style={{margin: '32px 0', border: 'none', borderTop: '1px solid #ddd'}} />
          <h3 style={{marginBottom: '16px'}}>Document Uploads</h3>

          <div className="upload-group">
            <label>
              <strong>1. Passport or ID</strong>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
                required
              />
              {passportFile && <span className="filename">✓ {passportFile.name}</span>}
            </label>
          </div>

          <div className="upload-group">
            <label>
              <strong>2. CSCS Card (Front)</strong>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setCscsFrontFile(e.target.files?.[0] || null)}
                required
              />
              {cscsFrontFile && <span className="filename">✓ {cscsFrontFile.name}</span>}
            </label>
          </div>

          <div className="upload-group">
            <label>
              <strong>3. CSCS Card (Back)</strong>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setCSCSBackFile(e.target.files?.[0] || null)}
                required
              />
              {cscsBackFile && <span className="filename">✓ {cscsBackFile.name}</span>}
            </label>
          </div>

          <div className="optional-section">
            <h3>Additional Documents (Optional)</h3>
            <p className="optional-hint">Upload any additional certificates, tickets, or proof of qualifications</p>

            {[0, 1, 2, 3, 4].map((index) => (
              <div className="upload-group" key={index}>
                <label>
                  <strong>Additional Document {index + 1} (Optional)</strong>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const newFiles = [...additionalFiles];
                      newFiles[index] = e.target.files?.[0] || null;
                      setAdditionalFiles(newFiles);
                    }}
                  />
                  {additionalFiles[index] && <span className="filename">✓ {additionalFiles[index]!.name}</span>}
                </label>
              </div>
            ))}
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Documents'}
          </button>
        </form>

        <p className="footer">
          Powered by <strong>Aztec Landscapes</strong>
        </p>
      </div>
    </div>
  );
}
