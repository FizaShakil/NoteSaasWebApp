import React from 'react';

interface SafeHtmlRendererProps {
  html: string;
  className?: string;
  maxLength?: number;
}

const SafeHtmlRenderer: React.FC<SafeHtmlRendererProps> = ({ 
  html, 
  className = '', 
  maxLength = 120 
}) => {
  // Strip HTML tags and get plain text for preview
  const getPlainText = (htmlString: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  // Truncate text if needed
  const truncateText = (text: string, max: number): string => {
    if (text.length <= max) return text;
    return text.substring(0, max) + '...';
  };

  const plainText = getPlainText(html);
  const displayText = truncateText(plainText, maxLength);

  return (
    <div className={className}>
      {displayText}
    </div>
  );
};

export default SafeHtmlRenderer;