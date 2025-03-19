import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './SavedQuotes.css';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const SavedQuotes = ({ quotes = [], onClose, onDeleteQuote, onShareQuote, onAddQuote }) => {
  const [selectedQuotes, setSelectedQuotes] = useState([]);
  const [shareEmail, setShareEmail] = useState('');
  const [showShareForm, setShowShareForm] = useState(false);
  
  const handleSelectQuote = (index) => {
    if (selectedQuotes.includes(index)) {
      setSelectedQuotes(selectedQuotes.filter(i => i !== index));
    } else {
      setSelectedQuotes([...selectedQuotes, index]);
    }
  };
  
  const handleExportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('My Quote Collection', 105, 15, { align: 'center' });
    
    // Add subtitle with date
    doc.setFontSize(12);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 25, { align: 'center' });
    
    // Prepare data for table
    const exportQuotes = selectedQuotes.length > 0 
      ? selectedQuotes.map(index => quotes[index])
      : quotes;
      
    const tableData = exportQuotes.map(quote => [
      `"${quote.text}"`, 
      quote.npcType ? `${quote.npcType}: ${quote.source}` : quote.source,
      new Date(quote.timestamp).toLocaleDateString()
    ]);
    
    // Add table
    doc.autoTable({
      startY: 35,
      head: [['Quote', 'Source', 'Date Added']],
      body: tableData,
      headStyles: { fillColor: [52, 152, 219] },
      styles: { font: 'helvetica', fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 }
      },
      margin: { top: 35 }
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        'Created with Authentic Internet - A collection of wisdom through the ages',
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    doc.save('authentic-internet-quotes.pdf');
  };
  
  const handleShareQuotes = () => {
    if (!shareEmail || !shareEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    
    const quotesToShare = selectedQuotes.length > 0 
      ? selectedQuotes.map(index => quotes[index])
      : quotes;
      
    if (onShareQuote) {
      onShareQuote(quotesToShare, shareEmail);
      setShowShareForm(false);
      setShareEmail('');
      alert(`Quotes shared with ${shareEmail}`);
    }
  };
  
  if (!quotes || quotes.length === 0) {
    return (
      <div className="saved-quotes-container">
        <div className="saved-quotes-header">
          <h2>Saved Quotes</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="no-quotes-message">
          <p>You haven't saved any quotes yet.</p>
          <p>Talk to NPCs and save their wisdom to see them here!</p>
          {onAddQuote && (
            <button 
              className="add-quote-button"
              onClick={onAddQuote}
            >
              Add Quote from Welcome Screen
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="saved-quotes-container">
      <div className="saved-quotes-header">
        <h2>Saved Quotes Collection</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="quotes-actions">
        <button 
          className="export-button"
          onClick={handleExportToPDF}
          title="Export quotes as PDF"
        >
          📄 Export as PDF
        </button>
        <button 
          className="share-button"
          onClick={() => setShowShareForm(!showShareForm)}
          title="Share quotes with friends"
        >
          🔗 Share Quotes
        </button>
        {onAddQuote && (
          <button 
            className="add-quote-button"
            onClick={onAddQuote}
            title="Add quote from welcome screen"
          >
            ➕ Add Quote
          </button>
        )}
      </div>
      
      {showShareForm && (
        <div className="share-form">
          <input
            type="email"
            placeholder="Enter email to share with"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
          />
          <button 
            className="share-submit-button"
            onClick={handleShareQuotes}
          >
            Share
          </button>
        </div>
      )}
      
      <div className="quotes-list">
        <div className="select-all-container">
          <label>
            <input 
              type="checkbox" 
              checked={selectedQuotes.length === quotes.length}
              onChange={() => {
                if (selectedQuotes.length === quotes.length) {
                  setSelectedQuotes([]);
                } else {
                  setSelectedQuotes(quotes.map((_, index) => index));
                }
              }}
            />
            {selectedQuotes.length > 0 ? `Selected ${selectedQuotes.length} quotes` : 'Select All'}
          </label>
        </div>
        
        {quotes.map((quote, index) => (
          <div key={index} className={`quote-item ${selectedQuotes.includes(index) ? 'selected' : ''}`}>
            <div className="quote-checkbox">
              <input 
                type="checkbox" 
                checked={selectedQuotes.includes(index)} 
                onChange={() => handleSelectQuote(index)}
              />
            </div>
            <div className="quote-content">
              <div className="quote-text">"{quote.text}"</div>
              <div className="quote-source">
                {quote.npcType && <span className="npc-type">{quote.npcType}: </span>}
                {quote.source}
              </div>
              <div className="quote-timestamp">Saved on: {new Date(quote.timestamp).toLocaleDateString()}</div>
            </div>
            <div className="quote-actions">
              {onDeleteQuote && (
                <button 
                  className="delete-quote-button"
                  onClick={() => onDeleteQuote(index)}
                >
                  Delete
                </button>
              )}
              <button 
                className="copy-quote-button"
                onClick={() => {
                  navigator.clipboard.writeText(`"${quote.text}" - ${quote.source}`);
                  alert('Quote copied to clipboard!');
                }}
              >
                Copy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

SavedQuotes.propTypes = {
  quotes: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      source: PropTypes.string,
      npcType: PropTypes.string,
      timestamp: PropTypes.string
    })
  ),
  onClose: PropTypes.func.isRequired,
  onDeleteQuote: PropTypes.func,
  onShareQuote: PropTypes.func,
  onAddQuote: PropTypes.func
};

export default SavedQuotes; 