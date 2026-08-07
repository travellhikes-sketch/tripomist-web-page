import React, { useEffect, useRef } from 'react';
import {
  Undo, Redo, Bold, Italic, Underline, List, ListOrdered,
  Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, Eraser
} from 'lucide-react';

const RichTextEditor = ({ value, onChange, placeholder = "Enter content..." }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleLink = () => {
    const url = prompt("Enter URL link:");
    if (url) {
      exec("createLink", url);
    }
  };

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-xs flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border-b border-gray-200">
        <button type="button" onClick={() => exec('undo')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer" title="Undo"><Undo size={15} /></button>
        <button type="button" onClick={() => exec('redo')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer" title="Redo"><Redo size={15} /></button>
        <div className="w-[1px] bg-gray-300 mx-1" />
        <select onChange={(e) => exec('formatBlock', e.target.value)} className="text-xs border rounded px-2 py-1 bg-white font-medium text-gray-700 outline-none cursor-pointer" defaultValue="P">
          <option value="P">Paragraph</option>
          <option value="H1">Heading 1</option>
          <option value="H2">Heading 2</option>
          <option value="H3">Heading 3</option>
        </select>
        <div className="w-[1px] bg-gray-300 mx-1" />
        <button type="button" onClick={() => exec('bold')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 font-bold cursor-pointer" title="Bold"><Bold size={15} /></button>
        <button type="button" onClick={() => exec('italic')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 italic cursor-pointer" title="Italic"><Italic size={15} /></button>
        <button type="button" onClick={() => exec('underline')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 underline cursor-pointer" title="Underline"><Underline size={15} /></button>
        <div className="w-[1px] bg-gray-300 mx-1" />
        <button type="button" onClick={() => exec('insertUnorderedList')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer" title="Bulleted List"><List size={15} /></button>
        <button type="button" onClick={() => exec('insertOrderedList')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer" title="Numbered List"><ListOrdered size={15} /></button>
        <button type="button" onClick={handleLink} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer" title="Insert Link"><LinkIcon size={15} /></button>
        <div className="w-[1px] bg-gray-300 mx-1" />
        <button type="button" onClick={() => exec('justifyLeft')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer" title="Align Left"><AlignLeft size={15} /></button>
        <button type="button" onClick={() => exec('justifyCenter')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer" title="Align Center"><AlignCenter size={15} /></button>
        <button type="button" onClick={() => exec('justifyRight')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer" title="Align Right"><AlignRight size={15} /></button>
        <div className="w-[1px] bg-gray-300 mx-1" />
        <button type="button" onClick={() => exec('removeFormat')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer" title="Clear Formatting"><Eraser size={15} /></button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={() => onChange(editorRef.current ? editorRef.current.innerHTML : '')}
        className="p-3 text-xs md:text-sm text-gray-800 focus:outline-none min-h-[120px] max-h-[300px] overflow-y-auto prose max-w-none"
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
