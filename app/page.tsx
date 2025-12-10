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
      setError('Error validating upload link.');
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
        .from('Applicant Documents')
        .upload(passportPath, passportFile, { upsert: true });

      if (passportError) throw new Error('Failed to upload passport');

      const { data: { publicUrl: passportUrl } } = supabase.storage
        .from('Applicant Documents')
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
        .from('Applicant Documents')
        .upload(cscsFrontPath, cscsFrontFile, { upsert: true });

      if (cscsFrontError) throw new Error('Failed to upload CSCS front');

      const { data: { publicUrl: cscsFrontUrl } } = supabase.storage
        .from('Applicant Documents')
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
        .from('Applicant Documents')
        .upload(cscsBackPath, cscsBackFile, { upsert: true });

      if (cscsBackError) throw new Error('Failed to upload CSCS back');

      const { data: { publicUrl: cscsBackUrl } } = supabase.storage
        .from('Applicant Documents')
        .getPublicUrl(cscsBackPath);

      uploadedFiles.push({
        type: 'cscs_back',
        url: cscsBackUrl,
        filename: cscsBackFile.name,
        path: cscsBackPath
      });

      // Webhook back to n8n
      await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          status: 'success',
          files: uploadedFiles
        })
      });

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
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  if (!validToken || error) {
    return (
      <div className="container">
        <div className="card">
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
          <h1>✅ Upload Complete!</h1>
          <p>Thank you, {name}! Your documents have been uploaded successfully.</p>
          <p>Check your WhatsApp for confirmation. Our labour manager will review your application and contact you within 48 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        .card {
          background: white;
          border-radius: 12px;
          padding: 40px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 {
          margin: 0 0 20px 0;
          color: #333;
        }
        p {
          color: #666;
          line-height: 1.6;
        }
        .upload-group {
          margin: 20px 0;
        }
        label {
          display: block;
          margin-bottom: 8px;
          color: #333;
        }
        input[type="file"] {
          display: block;
          width: 100%;
          padding: 10px;
          margin-top: 8px;
          border: 2px dashed #ddd;
          border-radius: 8px;
          cursor: pointer;
        }
        input[type="file"]:hover {
          border-color: #667eea;
        }
        .filename {
          display: block;
          margin-top: 8px;
          color: #28a745;
          font-size: 14px;
        }
        button {
          width: 100%;
          padding: 15px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 20px;
        }
        button:hover:not(:disabled) {
          background: #5568d3;
        }
        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .error {
          color: #dc3545;
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 14px;
          color: #999;
        }
      `}</style>
    </div>
  );
}
