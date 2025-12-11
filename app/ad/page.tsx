'use client';

import './ad.css';

export default function AdPage() {
  const handleApply = () => {
    // WhatsApp number with pre-filled message
    const phoneNumber = '447414157366';
    const message = encodeURIComponent("Hi, I'm interested in work");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="ad-container">
      <div className="ad-card">
        {/* Header with logo */}
        <div className="ad-header">
          <img src="/aztec-logo.png" alt="Aztec Landscapes" className="ad-logo" />
          <h1 className="ad-title">SKILLED LANDSCAPER / GROUNDWORKER WANTED</h1>
          <p className="ad-subtitle">START ASAP</p>
        </div>

        {/* Job details */}
        <div className="ad-section">
          <div className="ad-highlight">
            <span className="highlight-item">📍 London & Surrounding Areas</span>
            <span className="highlight-item">💷 £170–£200/day (DOE)</span>
            <span className="highlight-item">📆 Long-Term Work</span>
          </div>
        </div>

        <div className="ad-section">
          <p className="ad-intro">
            Aztec Landscapes are expanding and we're looking for experienced Hard Landscapers /
            Groundworkers to join the team.
          </p>
        </div>

        {/* What we're looking for */}
        <div className="ad-section">
          <h2 className="section-title">We're after people who can hit the ground running with:</h2>
          <ul className="checklist">
            <li>✔ Groundworks</li>
            <li>✔ Setting out, levels, sub-base prep</li>
            <li>✔ Drainage</li>
            <li>✔ Paving & patios</li>
            <li>✔ Retaining walls</li>
            <li>✔ All aspects of hard landscaping</li>
          </ul>
        </div>

        {/* Requirements */}
        <div className="ad-section">
          <h2 className="section-title">You must have:</h2>
          <ul className="checklist">
            <li>✔ Valid CSCS card</li>
            <li>✔ Right to work in the UK</li>
            <li>✔ Ability to travel to London daily</li>
            <li>✔ Solid experience on professional landscaping projects</li>
          </ul>
        </div>

        {/* What you'll get */}
        <div className="ad-section benefits">
          <h2 className="section-title">What you'll get:</h2>
          <ul className="benefits-list">
            <li>💷 £170–£200 per day (experience dependent)</li>
            <li>📆 Long-term, ongoing work</li>
            <li>🏗 Stable company with a strong pipeline</li>
          </ul>
        </div>

        {/* CTA */}
        <div className="ad-section cta-section">
          <p className="cta-text">
            If you're reliable, skilled and ready to get going, we want to hear from you.
          </p>
          <button className="apply-button" onClick={handleApply}>
            👉 Apply Now via WhatsApp
          </button>
          <p className="cta-subtext">
            It only takes 2 minutes. Our automated assistant will walk you through the quick
            application, and our Labour Manager will call you back.
          </p>
        </div>

        {/* Footer */}
        <div className="ad-footer">
          <p>Aztec Landscapes • Reputable Contractor • Solid Pipeline</p>
        </div>
      </div>
    </div>
  );
}
