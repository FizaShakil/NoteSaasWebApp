import React, { useRef, useEffect, useState } from 'react';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing your note..."
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentAlignment, setCurrentAlignment] = useState<'left' | 'center' | 'right'>('left');

  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      editorRef.current.innerHTML = value;
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const formatBlock = (tag: string) => {
    execCommand('formatBlock', tag);
  };

  const insertList = (type: 'insertOrderedList' | 'insertUnorderedList') => {
    // First try the standard execCommand
    try {
      document.execCommand(type);
      editorRef.current?.focus();
      handleInput();
    } catch (error) {
      // Fallback: Manual list creation
      createListManually(type === 'insertOrderedList' ? 'ol' : 'ul');
    }
  };

  const createListManually = (listType: 'ol' | 'ul') => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    // Create the list element
    const listElement = document.createElement(listType);
    listElement.style.paddingLeft = '1.5em';
    listElement.style.margin = '1em 0';

    // Create list item
    const listItem = document.createElement('li');
    listItem.style.margin = '0.25em 0';
    
    if (selectedText) {
      listItem.textContent = selectedText;
    } else {
      listItem.innerHTML = '&nbsp;'; // Non-breaking space for empty list item
    }

    listElement.appendChild(listItem);

    // Insert the list
    if (selectedText) {
      range.deleteContents();
    }
    range.insertNode(listElement);

    // Position cursor at the end of the list item
    const newRange = document.createRange();
    newRange.setStartAfter(listItem.lastChild || listItem);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    editorRef.current.focus();
    handleInput();
  };

  const toggleCodeBlock = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      if (selectedText) {
        const codeElement = document.createElement('pre');
        codeElement.style.backgroundColor = '#f3f4f6';
        codeElement.style.padding = '16px';
        codeElement.style.borderRadius = '6px';
        codeElement.style.fontFamily = 'Monaco, Menlo, Ubuntu Mono, monospace';
        codeElement.style.color = '#374151';
        codeElement.style.margin = '16px 0';
        codeElement.style.whiteSpace = 'pre-wrap';
        codeElement.style.wordWrap = 'break-word';
        codeElement.textContent = selectedText;
        
        range.deleteContents();
        range.insertNode(codeElement);
        
        // Clear selection
        selection.removeAllRanges();
        handleInput();
      }
    }
  };

  // Handle keyboard events for better list support
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle Enter key in lists
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const currentElement = range.startContainer.parentElement;
        
        // Check if we're in a list item
        if (currentElement?.tagName === 'LI') {
          e.preventDefault();
          
          // Create new list item
          const newListItem = document.createElement('li');
          newListItem.innerHTML = '&nbsp;';
          newListItem.style.margin = '0.25em 0';
          
          // Insert after current list item
          currentElement.parentNode?.insertBefore(newListItem, currentElement.nextSibling);
          
          // Move cursor to new list item
          const newRange = document.createRange();
          newRange.setStart(newListItem, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          
          handleInput();
          return;
        }
      }
    }
    
    // Handle Tab key for indentation in lists
    if (e.key === 'Tab') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const currentElement = range.startContainer.parentElement;
        
        if (currentElement?.tagName === 'LI') {
          e.preventDefault();
          
          if (e.shiftKey) {
            // Shift+Tab: Decrease indentation (outdent)
            const parentList = currentElement.parentElement;
            const grandParent = parentList?.parentElement;
            if (grandParent && grandParent.tagName !== 'DIV') {
              grandParent.insertBefore(currentElement, parentList.nextSibling);
              handleInput();
            }
          } else {
            // Tab: Increase indentation (indent)
            const prevSibling = currentElement.previousElementSibling;
            if (prevSibling && prevSibling.tagName === 'LI') {
              let subList = prevSibling.querySelector('ul, ol');
              if (!subList) {
                const parentList = currentElement.parentElement;
                subList = document.createElement(parentList?.tagName.toLowerCase() || 'ul') as HTMLUListElement | HTMLOListElement;
                (subList as HTMLElement).style.paddingLeft = '1.5em';
                (subList as HTMLElement).style.margin = '0.5em 0';
                prevSibling.appendChild(subList);
              }
              subList.appendChild(currentElement);
              handleInput();
            }
          }
          return;
        }
      }
    }
  };

  // Text alignment functions
  const setTextAlignment = (alignment: 'left' | 'center' | 'right') => {
    setCurrentAlignment(alignment);
    execCommand('justifyLeft');
    execCommand('justify' + alignment.charAt(0).toUpperCase() + alignment.slice(1));
    
    // Apply alignment to the editor content
    if (editorRef.current) {
      editorRef.current.style.textAlign = alignment;
    }
  };

  // Import text from file
  const handleImportText = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (editorRef.current) {
          // Convert plain text to HTML with line breaks
          const htmlContent = text.replace(/\n/g, '<br>');
          editorRef.current.innerHTML = htmlContent;
          onChange(htmlContent);
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please select a .txt file');
    }
    // Reset file input
    event.target.value = '';
  };

  // Export as text file
  const exportAsText = () => {
    if (editorRef.current) {
      // Convert HTML to plain text
      const plainText = editorRef.current.innerText || editorRef.current.textContent || '';
      const blob = new Blob([plainText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'note.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Export as PDF
  const exportAsPDF = () => {
    if (editorRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const content = editorRef.current.innerHTML;
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Note Export</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                  line-height: 1.6;
                  padding: 20px;
                  max-width: 800px;
                  margin: 0 auto;
                }
                h1, h2, h3 { color: #333; }
                pre {
                  background: #f5f5f5;
                  padding: 10px;
                  border-radius: 4px;
                  overflow-x: auto;
                }
                a { color: #0066cc; }
                @media print {
                  body { margin: 0; padding: 20px; }
                }
              </style>
            </head>
            <body>
              ${content}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  return (
    <div className="custom-rich-editor">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        onChange={handleFileImport}
        style={{ display: 'none' }}
      />

      {/* Toolbar */}
      <div className="editor-toolbar">
        {/* Text Alignment Group */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => setTextAlignment('left')}
            className={`toolbar-btn ${currentAlignment === 'left' ? 'active' : ''}`}
            title="Align Left"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setTextAlignment('center')}
            className={`toolbar-btn ${currentAlignment === 'center' ? 'active' : ''}`}
            title="Align Center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setTextAlignment('right')}
            className={`toolbar-btn ${currentAlignment === 'right' ? 'active' : ''}`}
            title="Align Right"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/>
            </svg>
          </button>
        </div>

        {/* Text Formatting Group */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className="toolbar-btn"
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className="toolbar-btn"
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => execCommand('underline')}
            className="toolbar-btn"
            title="Underline"
          >
            <u>U</u>
          </button>
        </div>

        {/* Heading Group */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => formatBlock('h1')}
            className="toolbar-btn"
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => formatBlock('h2')}
            className="toolbar-btn"
            title="Heading 2"
          >
            H2
          </button>
        </div>

        {/* List Group */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => insertList('insertOrderedList')}
            className="toolbar-btn"
            title="Numbered List"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48H3.5v1.05H5V13h-.5v-1H5V11H3.5v1.05zM2 6h20v2H2zm1.5 1.5V6H5v1.5H4V8H3V6.5h1.5zM2 11h20v2H2z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => insertList('insertUnorderedList')}
            className="toolbar-btn"
            title="Bullet List"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
            </svg>
          </button>
        </div>

        {/* Tools Group */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={toggleCodeBlock}
            className="toolbar-btn"
            title="Code Block"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={insertLink}
            className="toolbar-btn"
            title="Insert Link"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
            </svg>
          </button>
        </div>

        {/* Clear Formatting */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => execCommand('removeFormat')}
            className="toolbar-btn"
            title="Clear Formatting"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6zm-.27 14.49L17.73 7.49l-1.41-1.41L4.32 18.08l1.41 1.41z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        className={`editor-content align-${currentAlignment}`}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
        style={{ textAlign: currentAlignment }}
      />

      {/* Import/Export Controls */}
      <div className="editor-footer">
        <div className="import-export-controls">
          <button
            type="button"
            onClick={handleImportText}
            className="import-export-btn"
            title="Import from .txt file"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            Import .txt
          </button>
          <button
            type="button"
            onClick={exportAsText}
            className="import-export-btn"
            title="Export as .txt file"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            Export .txt
          </button>
          <button
            type="button"
            onClick={exportAsPDF}
            className="import-export-btn"
            title="Export as PDF"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;