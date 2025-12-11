'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

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
  const [error, setError] = useState('');

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
        setError('Documents already uploaded for this application.');
        setValidToken(false);
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

      // TODO: Re-enable webhook after n8n workflow is imported
      // Webhook temporarily disabled to prevent CORS errors during testing
      // Will send WhatsApp confirmation once webhook handler is active

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

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Documents'}
          </button>
        </form>

        <p className="footer">
          Powered by <strong>Aztec Landscapes</strong>
        </p>
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #000000 0%, #949494 100%);
          padding: 20px;
        }
        .card {
          background: white;
          border-radius: 12px;
          padding: 40px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          border-top: 4px solid #a69438;
        }
        .logo {
          display: block;
          max-width: 200px;
          height: auto;
          margin: 0 auto 30px auto;
        }
        h1 {
          margin: 0 0 20px 0;
          color: #000000;
          text-align: center;
        }
        p {
          color: #949494;
          line-height: 1.6;
        }
        .upload-group {
          margin: 20px 0;
        }
        label {
          display: block;
          margin-bottom: 8px;
          color: #000000;
        }
        input[type="file"] {
          display: block;
          width: 100%;
          padding: 10px;
          margin-top: 8px;
          border: 2px dashed #949494;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        input[type="file"]:hover {
          border-color: #a69438;
          background-color: #f9f9f9;
        }
        .filename {
          display: block;
          margin-top: 8px;
          color: #a69438;
          font-size: 14px;
          font-weight: 600;
        }
        button {
          width: 100%;
          padding: 15px;
          background: #a69438;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 20px;
          transition: all 0.3s ease;
        }
        button:hover:not(:disabled) {
          background: #8f7e30;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(166, 148, 56, 0.4);
        }
        button:disabled {
          background: #949494;
          cursor: not-allowed;
          transform: none;
        }
        .error {
          color: #dc3545;
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 14px;
          color: #949494;
        }
        .footer strong {
          color: #a69438;
        }
      `}</style>
    </div>
  );
}
